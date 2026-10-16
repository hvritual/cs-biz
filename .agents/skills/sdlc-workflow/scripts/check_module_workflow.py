#!/usr/bin/env python3
"""Read-only module admission/next-action checks. Never authenticate or execute work."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess

from artifact_io import (ROOT, asset, content_digest, digest, git_bytes,
                                   read_json, relative, require, scope_path)

BOUNDARIES = {'reviewed_design', 'integrated_main', 'deployed', 'physical', 'operational'}
BOUNDARY_KIND = {'reviewed_design': 'static', 'integrated_main': 'integration',
                 'deployed': 'deployment', 'physical': 'physical', 'operational': 'operational'}
KINDS = {'static', 'runtime', 'integration', 'deployment', 'physical', 'operational'}


def meaningful(value):
    return (isinstance(value, str) and bool(value.strip()) and
            not re.fullmatch(r'(?i)\s*(TBD|TODO|unknown|待定|待补|待明确)\s*[.!。:：]?\s*', value))


def fields(row, names):
    require(isinstance(row, dict), 'object required')
    for name in names:
        require(meaningful(row.get(name)), 'missing/unresolved field: ' + name)


def unique(rows, key):
    require(isinstance(rows, list) and rows, 'nonempty list required: ' + key)
    require(all(isinstance(r, dict) for r in rows), 'object rows required: ' + key)
    ids = [r.get(key) for r in rows]
    require(all(isinstance(x, (str, int)) and not isinstance(x, bool) for x in ids),
            'invalid ID: ' + key)
    require(len(set(ids)) == len(ids), 'duplicate ID: ' + key)
    return {r[key]: r for r in rows}


def numbers(values):
    require(isinstance(values, list) and values and
            all(type(x) is int and x > 0 for x in values) and
            len(set(values)) == len(values), 'invalid/duplicate issue numbers')
    return set(values)


def strings(values):
    require(isinstance(values, list) and values and all(meaningful(x) for x in values)
            and len(set(values)) == len(values), 'invalid/duplicate reference list')
    return set(values)


def source_ref(value, sources):
    require(meaningful(value) and '#' in value and value.split('#', 1)[0] in sources
            and meaningful(value.split('#', 1)[1]), 'source locator not bound to frozen sources')


def contract(path, root):
    root = root.resolve()
    path = root / path if not path.is_absolute() else path
    path = relative(root, path.absolute().relative_to(root).as_posix())
    data = read_json(path)
    require(data.get('protocol') == 'module-outcome-v1', 'wrong module protocol')
    fields(data, ('module_ref', 'revision', 'inventory_ref', 'boundary_environment'))
    require(re.fullmatch(r'r\d{3,}', data['revision']), 'invalid revision')
    require(data.get('boundary') in BOUNDARIES, 'invalid completion boundary')
    require(data.get('unresolved_decisions') == [], 'resolve material decisions before freeze')
    sources = unique(data.get('sources'), 'path')
    for name, row in sources.items():
        require(row.get('sha256') == digest(git_bytes(root, row.get('commit'), name)) ==
                digest(relative(root, name).read_bytes()), 'frozen source changed: ' + name)
    inventory = numbers(data.get('inventory_numbers'))
    issues = unique(data.get('issues'), 'number')
    included = numbers(list(issues))
    excluded = data.get('exclusions')
    require(isinstance(excluded, list), 'explicit exclusions required')
    excluded_ids = set()
    for row in excluded:
        fields(row, ('reason', 'decision_ref'))
        n = row.get('number')
        require(type(n) is int and n > 0 and n not in excluded_ids, 'invalid exclusion')
        excluded_ids.add(n)
    require(not included & excluded_ids and included | excluded_ids == inventory,
            'module inventory has missing/extra/overlapping issues')
    criteria = unique(data.get('criteria'), 'id')
    for row in criteria.values():
        fields(row, ('id', 'source_ref', 'given', 'when', 'then', 'negative', 'recovery'))
        source_ref(row['source_ref'], sources)
        verification = row.get('verification')
        fields(verification, ('environment', 'procedure_ref', 'expected'))
        require(verification.get('kind') in KINDS, 'invalid proof kind')
        source_ref(verification['procedure_ref'], sources)
        strings(row.get('invariants'))
    requirements = unique(data.get('requirements'), 'id')
    coverage = set()
    for row in requirements.values():
        fields(row, ('id', 'source_ref'))
        source_ref(row['source_ref'], sources)
        ids = strings(row.get('acceptance_ids'))
        require(ids <= criteria.keys(), 'requirement references unknown acceptance')
        coverage |= ids
    require(coverage == criteria.keys(), 'requirement/acceptance coverage gap')
    resources = data.get('resources')
    require(isinstance(resources, list), 'explicit resources required')
    resource_ids = set()
    for row in resources:
        fields(row, ('id', 'owner', 'recovery_action', 'source_ref'))
        require(row['id'] not in resource_ids, 'duplicate resource')
        resource_ids.add(row['id'])
        source_ref(row['source_ref'], sources)
    coverage = set()
    for row in issues.values():
        fields(row, ('task_ref', 'body_sha256'))
        require(re.fullmatch('[0-9a-f]{64}', row['body_sha256']), 'invalid issue body digest')
        ids = strings(row.get('acceptance_ids'))
        require(ids <= criteria.keys(), 'issue references unknown acceptance')
        coverage |= ids
        for key in ('allowed_paths', 'forbidden_paths'):
            for value in strings(row.get(key)):
                scope_path(value, glob_root=False)
        deps = row.get('depends_on')
        require(isinstance(deps, list) and all(type(n) is int for n in deps) and
                len(set(deps)) == len(deps) and set(deps) <= included and
                row['number'] not in deps, 'invalid issue dependency')
        prereqs = row.get('prerequisites')
        require(isinstance(prereqs, list) and all(isinstance(x, str) for x in prereqs)
                and len(set(prereqs)) == len(prereqs) and set(prereqs) <= resource_ids,
                'unknown/duplicate prerequisite')
    require(coverage == criteria.keys(), 'orphan acceptance without delivery issue')
    visited, visiting = set(), set()

    def visit(n):
        require(n not in visiting, 'cyclic issue dependency')
        if n in visited:
            return
        visiting.add(n)
        for dep in issues[n]['depends_on']:
            visit(dep)
        visiting.remove(n)
        visited.add(n)

    for n in issues:
        visit(n)
    integration = strings(data.get('integration_acceptance_ids'))
    require(integration <= criteria.keys(), 'unknown module integration acceptance')
    require(all(criteria[c]['verification']['kind'] in {'integration', 'deployment', 'physical', 'operational'}
                for c in integration) or data['boundary'] == 'reviewed_design',
            'module closure needs integration proof, not unit/static substitution')
    require(any(criteria[c]['verification']['kind'] == BOUNDARY_KIND[data['boundary']] and
                criteria[c]['verification']['environment'] == data['boundary_environment']
                for c in integration), 'completion boundary lacks matching direct proof method/environment')
    authority = data.get('authority')
    fields(authority, ('record_ref',))
    require(numbers(authority.get('issue_numbers')) <= included, 'authority exceeds module')
    actions = strings(authority.get('actions'))
    require(actions <= {'implement', 'repository_write', 'merge', 'deploy', 'physical', 'operate'},
            'unknown authority action')
    fields(data.get('budget'), ('policy_ref',))
    limit = data['budget'].get('max_attempts_without_progress')
    require(type(limit) is int and 1 <= limit <= 2, 'invalid stall budget (maximum two)')
    review = data.get('review')
    fields(review, ('record_ref', 'content_sha256'))
    require(review.get('decision') == 'approved' and
            review['content_sha256'] == content_digest(data), 'missing/stale exact-version review')
    return data


def plan(data, observation, root, main_sha, now=None):
    require(observation.get('protocol') == 'module-observation-v1', 'wrong observation protocol')
    require(observation.get('contract_sha256') == content_digest(data), 'stale contract observation')
    fields(observation, ('observed_at', 'inventory_ref'))
    timestamp = datetime.fromisoformat(observation['observed_at'].replace('Z', '+00:00'))
    require(timestamp.tzinfo is not None, 'observation time needs timezone')
    age = ((now or datetime.now(timezone.utc)) - timestamp).total_seconds()
    require(0 <= age <= 900, 'stale/future observation: refresh authoritative readback')
    require(observation.get('main_sha') == main_sha, 'main changed: refresh all evidence')
    # Also checks that main is an available commit. Caller must authenticate live GitHub main.
    git_bytes(root, main_sha, 'AGENTS.md')
    for source in data['sources']:
        require(source['sha256'] == digest(git_bytes(root, main_sha, source['path'])),
                'frozen source drift on live main: ' + source['path'])
    require(numbers(observation.get('inventory_numbers')) == set(data['inventory_numbers']),
            'live module inventory drift: reconcile and obtain amendment if required')
    issues = unique(data['issues'], 'number')
    rows = unique(observation.get('issues'), 'number')
    require(rows.keys() == issues.keys(), 'issue observation missing/extra')
    resource_rows = observation.get('resources')
    require(isinstance(resource_rows, list), 'resource observations required')
    resources = unique(resource_rows, 'id') if resource_rows else {}
    require(resources.keys() == {r['id'] for r in data['resources']}, 'resource observation gap')
    for r in resources.values():
        require(r.get('state') in {'available', 'blocked', 'unknown'}, 'invalid resource state')
        fields(r, ('evidence_ref',))
    criteria = unique(data['criteria'], 'id')
    proof_rows = observation.get('proofs')
    require(isinstance(proof_rows, list), 'explicit proofs required')
    proofs = unique(proof_rows, 'acceptance_id') if proof_rows else {}
    require(proofs.keys() <= criteria.keys(), 'unknown acceptance proof')
    proven = set()
    for c, proof in proofs.items():
        require(proof.get('result') in {'PROVEN', 'UNPROVEN', 'FAILED', 'BLOCKED'}, 'invalid proof result')
        if proof['result'] != 'PROVEN':
            continue
        expected = criteria[c]['verification']
        require(proof.get('commit') == main_sha and proof.get('kind') == expected['kind'] and
                proof.get('environment') == expected['environment'], 'stale/wrong-boundary proof: ' + c)
        fields(proof, ('method_ref', 'independent_review_ref'))
        asset(root, proof.get('artifact'))
        proven.add(c)
    integrated, blockers = set(), {}
    active = []
    for n, row in rows.items():
        require(row.get('body_sha256') == issues[n]['body_sha256'], 'issue acceptance/body drift')
        require(row.get('state') in {'open', 'closed'}, 'invalid live issue state')
        require(row.get('delivery') in {'pending', 'active', 'suspended', 'integrated'}, 'invalid delivery state')
        if row['delivery'] == 'suspended':
            fields(row, ('candidate_ref',))
        attempts = row.get('attempts_without_progress')
        require(type(attempts) is int and attempts >= 0, 'invalid attempt count')
        block = row.get('blocker')
        if block is not None:
            fields(block, ('owner', 'next_action', 'evidence_ref'))
            blockers[n] = block
        if attempts >= data['budget']['max_attempts_without_progress']:
            blockers[n] = {'owner': 'executing_model', 'next_action': 'escalate stall with diagnostics'}
        if row['delivery'] == 'active':
            active.append(n)
        if row['delivery'] == 'integrated':
            fields(row, ('merge_sha', 'pr_ref', 'quality_ref', 'independent_review_ref', 'main_readback_ref'))
            git_bytes(root, row['merge_sha'], 'AGENTS.md')
            result = subprocess.run(['git', '-C', str(root), 'merge-base', '--is-ancestor',
                                     row['merge_sha'], main_sha], capture_output=True, timeout=10)
            require(result.returncode == 0, 'delivery not integrated in current main')
            require(block is None and n not in blockers, 'integrated issue still blocked')
            integrated.add(n)
        elif row['state'] == 'closed':
            blockers[n] = {'owner': 'executing_model', 'next_action': 'audit closed issue without delivery proof'}
    require(len(active) <= 1, 'only one active delivery candidate permitted')
    resource_defs = {r['id']: r for r in data['resources']}
    for n, issue in issues.items():
        missing = [r for r in issue['prerequisites'] if resources[r]['state'] != 'available']
        if missing and n not in blockers:
            blockers[n] = {'owner': [resource_defs[r]['owner'] for r in missing],
                           'next_action': [resource_defs[r]['recovery_action'] for r in missing],
                           'resources': missing, 'evidence_refs': [resources[r]['evidence_ref'] for r in missing]}
    # Dependency validity is transitive, including through previously integrated nodes.
    changed = True
    while changed:
        changed = False
        for n, issue in issues.items():
            missing = [d for d in issue['depends_on'] if d not in integrated or d in blockers or
                       not set(issues[d]['acceptance_ids']) <= proven]
            if missing and n not in blockers:
                blockers[n] = {'owner': 'executing_model',
                               'next_action': 'verify dependency delivery and current proof',
                               'dependencies': missing}
                changed = True
    ready = []
    for n, issue in issues.items():
        if n in integrated or n in blockers:
            continue
        if n not in data['authority']['issue_numbers'] or not {'implement', 'repository_write'} <= set(data['authority']['actions']):
            blockers[n] = {'owner': 'Human', 'next_action': 'resolve implementation authority'}
        elif any(d not in integrated or d in blockers or not set(issues[d]['acceptance_ids']) <= proven for d in issue['depends_on']):
            blockers[n] = {'owner': 'executing_model', 'next_action': 'verify dependency delivery and current proof'}
        else:
            ready.append(n)
    remaining = sorted(criteria.keys() - proven)
    if ready:
        resumable = [n for n in ready if rows[n]['delivery'] == 'suspended']
        selected = active[0] if active and active[0] in ready else min(resumable or ready)
        if active and active[0] != selected:
            action = {'kind': 'SUSPEND_ISSUE', 'issue': active[0], 'then_reconcile': True}
        else:
            action = {'kind': 'RESUME_ISSUE' if rows[selected]['delivery'] in {'active', 'suspended'} else 'ADMIT_ISSUE', 'issue': selected}
        state = 'READY_STATIC'
    elif integrated == issues.keys() and not remaining and not blockers:
        state, action = 'CLOSURE_CANDIDATE_STATIC', {'kind': 'INDEPENDENT_CLOSURE_READBACK'}
    elif integrated == issues.keys() and not blockers:
        state, action = 'EVIDENCE_REQUIRED', {'kind': 'VERIFY_MODULE', 'acceptance_ids': remaining}
    else:
        state, action = 'BLOCKED', {'kind': 'RESOLVE_BLOCKERS'}
    return {'state': state, 'next_action': action, 'ready_issues': sorted(ready),
            'blockers': blockers, 'remaining_acceptance_ids': remaining,
            'coverage': {'total': len(criteria), 'declared_proven': len(proven)}}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root', type=Path, default=ROOT)
    parser.add_argument('--contract', type=Path)
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--observations', type=Path)
    parser.add_argument('--locked-commit')
    parser.add_argument('--main-sha')
    args = parser.parse_args(argv)
    result = {'authentic_approval': 'NOT_VERIFIED', 'runtime': 'NOT_VERIFIED', 'execution_granted': False}
    try:
        require(bool(args.contract) != args.all, 'choose --contract or --all')
        root = args.repo_root.resolve()
        paths = list((root / 'doc/tasks').rglob('module-contract.json')) if args.all else [args.contract]
        for path in paths:
            path = root / path if not path.is_absolute() else path
            data = contract(path, root)
            if args.observations:
                require(not args.all and args.locked_commit and args.main_sha,
                        'planning requires one contract, approved locked commit and live main SHA')
                rel = path.absolute().relative_to(root).as_posix()
                require(path.read_bytes() == git_bytes(root, args.locked_commit, rel),
                        'contract changed since approved locked commit')
                result.update(plan(data, read_json(args.observations), root, args.main_sha))
        require(not args.observations or paths, 'planning contract missing')
        result.update(contract='PASS_STATIC_ONLY', checked=len(paths))
    except (ValueError, OSError, KeyError, TypeError, AttributeError, RecursionError,
            subprocess.SubprocessError) as exc:
        result.update(contract='FAIL', issues=[str(exc)])
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 2 if result['contract'] == 'FAIL' else 0


if __name__ == '__main__':
    raise SystemExit(main())
