#!/usr/bin/env python3
"""Read-only, portable goal routing; verifies bindings, never tools or authority.

The host Agent retrieves facts, writes artifacts and performs authorized actions.
This program never executes artifact commands, fetches URLs or mutates task state.
"""
from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys

PACKAGE = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text(value):
    return isinstance(value, str) and bool(value.strip())


def strings(value, label, empty=False):
    require(isinstance(value, list) and (empty or value) and all(map(text, value))
            and len(set(value)) == len(value), label + ': expected unique strings')
    return set(value)


def fields(value, required, optional=()):
    require(isinstance(value, dict), 'expected object')
    require(set(required) <= value.keys(), 'missing fields: ' + str(set(required) - value.keys()))
    require(value.keys() <= set(required) | set(optional), 'unknown fields: ' + str(value.keys() - set(required) - set(optional)))


def digest(value):
    data = value if isinstance(value, bytes) else json.dumps(value, ensure_ascii=False,
        sort_keys=True, separators=(',', ':'), allow_nan=False).encode()
    return hashlib.sha256(data).hexdigest()


def unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'duplicate JSON key: ' + key)
        result[key] = value
    return result


def path(root, name):
    require(text(name) and '\\' not in name and ':' not in name and '\x00' not in name,
            'invalid artifact path')
    parts = PurePosixPath(name)
    require(not parts.is_absolute() and '..' not in parts.parts and not name.startswith('~'),
            'artifact path escapes task')
    result = root / name
    require(result.resolve().is_relative_to(root.resolve()) and result.is_file(), 'missing/outside artifact: ' + name)
    current = root
    for part in parts.parts:
        current /= part
        require(not current.is_symlink(), 'symlink artifact: ' + name)
    return result


def load(filename):
    return json.loads(filename.read_text(encoding='utf-8'), object_pairs_hook=unique_pairs,
                      parse_constant=lambda value: (_ for _ in ()).throw(ValueError('invalid JSON constant: ' + value)))


def asset(root, ref, parsed=False):
    fields(ref, ('path', 'sha256'))
    filename = path(root, ref['path'])
    require(re.fullmatch('[0-9a-f]{64}', ref['sha256']) and digest(filename.read_bytes()) == ref['sha256'],
            'stale artifact: ' + ref['path'])
    return load(filename) if parsed else ref


def basis(goal):
    # Attempts do not rewrite the meaning of previously produced work. They are
    # cumulative host observations, not an authenticated quota/CAS mechanism.
    return digest({key: value for key, value in goal.items() if key not in ('records', 'budget')})


def bound(root, goal, kind):
    ref = goal['records'].get(kind)
    if ref is None:
        return None
    data = asset(root, ref, True)
    require(isinstance(data, dict), 'stage record must be an object: ' + kind)
    require(data.get('basis_sha256') == basis(goal), 'goal/source/feedback drift: ' + kind)
    return data


def source_ids(value, known, label, empty=False):
    require(strings(value, label, empty) <= known, 'unknown source: ' + label)


def decision(root, item, known):
    fields(item, ('id', 'kind', 'owner', 'facts', 'source_ids', 'missing', 'options',
                  'recommended', 'impact', 'action_needed', 'response'))
    require(all(text(item[key]) for key in ('id', 'kind', 'owner', 'missing', 'impact', 'action_needed')),
            'decision needs owner, gap, impact and concrete action')
    strings(item['facts'], 'decision facts')
    source_ids(item['source_ids'], known, 'decision source_ids')
    options = item['options']
    require(isinstance(options, list) and len(options) >= 2, 'decision needs alternatives')
    ids = []
    for option in options:
        fields(option, ('id', 'description', 'tradeoffs'))
        require(all(text(option[k]) for k in option), 'empty decision option')
        ids.append(option['id'])
    require(len(set(ids)) == len(ids) and item['recommended'] in ids, 'invalid decision recommendation')
    response = item['response']
    if response is not None:
        fields(response, ('option_id', 'record_ref'))
        require(response['option_id'] in ids, 'response chose unknown option')
        asset(root, response['record_ref'])
    return response is None


def assessment(root, goal, known):
    data = bound(root, goal, 'assessment')
    if data is None:
        return None, []
    fields(data, ('basis_sha256', 'route', 'background', 'impact', 'goals', 'flows',
                  'options', 'recommended', 'requirements', 'criteria', 'decisions'))
    require(data['route'] in ('research', 'software', 'operation'), 'unknown task route')
    require(text(data['background']) and text(data['impact']), 'proposal needs background/impact')
    strings(data['goals'], 'goals'); strings(data['flows'], 'flows')
    require(isinstance(data['options'], list) and len(data['options']) >= 2, 'proposal needs compared options')
    options = []
    for option in data['options']:
        fields(option, ('id', 'description', 'tradeoffs', 'counterevidence', 'source_ids'))
        require(all(text(option[k]) for k in ('id', 'description', 'tradeoffs', 'counterevidence')), 'empty proposal option')
        source_ids(option['source_ids'], known, 'option sources'); options.append(option['id'])
    require(len(set(options)) == len(options) and data['recommended'] in options, 'invalid proposal recommendation')
    require(isinstance(data['decisions'], list), 'expected decisions list')
    pending = [item['id'] for item in data['decisions'] if decision(root, item, known)]
    strings([item['id'] for item in data['decisions']], 'decision IDs', empty=True)
    require(isinstance(data['criteria'], list), 'expected criteria list')
    criteria = []
    for item in data['criteria']:
        fields(item, ('id', 'given', 'when', 'then', 'negative', 'recovery', 'verification', 'environment'))
        require(all(text(item[k]) for k in item), 'vague acceptance criterion')
        criteria.append(item['id'])
    strings(criteria, 'criterion IDs', empty=bool(pending))
    require(isinstance(data['requirements'], list) and data['requirements'], 'requirements missing')
    covered = set()
    for item in data['requirements']:
        fields(item, ('id', 'classification', 'rationale', 'source_ids', 'criterion_ids'))
        require(text(item['id']) and text(item['rationale']), 'requirement needs necessity rationale')
        require(item['classification'] in ('explicit', 'derived', 'optional'), 'invalid requirement classification')
        source_ids(item['source_ids'], known, 'requirement sources')
        linked = strings(item['criterion_ids'], 'requirement criteria', empty=item['classification'] == 'optional' or bool(pending))
        require(linked <= set(criteria), 'unknown criterion')
        if item['classification'] != 'optional':
            covered |= linked
        if item['classification'] == 'derived':
            require(linked, 'derived work needs an acceptance obligation')
    strings([item['id'] for item in data['requirements']], 'requirement IDs')
    require(covered == set(criteria), 'criterion lacks required work')
    return data, pending


def architecture(root, goal, known):
    data = bound(root, goal, 'architecture')
    if data is None:
        return None
    fields(data, ('basis_sha256', 'assessment_sha256', 'current_state', 'patterns', 'compatibility', 'roadmap', 'decisions'))
    require(data['assessment_sha256'] == goal['records']['assessment']['sha256'], 'stale product proposal in architecture')
    strings(data['current_state'], 'actual technical state')
    require(data['patterns'] and data['compatibility'] and data['roadmap'], 'architecture needs patterns, fit and roadmap')
    for item in data['patterns']:
        fields(item, ('name', 'fit', 'limitations', 'source_ids'))
        require(all(text(item[k]) for k in ('name', 'fit', 'limitations')), 'architecture pattern lacks tradeoffs')
        source_ids(item['source_ids'], known, 'pattern sources')
    for item in data['compatibility']:
        fields(item, ('area', 'disposition', 'reason', 'source_ids'))
        require(item['disposition'] in ('reuse', 'adapt', 'gap') and text(item['area']) and text(item['reason']), 'invalid compatibility claim')
        source_ids(item['source_ids'], known, 'compatibility sources')
    prior = set()
    for item in data['roadmap']:
        fields(item, ('id', 'depends_on', 'outcome', 'verification', 'resources'))
        require(text(item['id']) and item['id'] not in prior and text(item['outcome']) and text(item['verification']), 'invalid roadmap unit')
        require(strings(item['depends_on'], 'roadmap dependencies', empty=True) <= prior, 'unknown/cyclic roadmap dependency')
        strings(item['resources'], 'roadmap resources', empty=True); prior.add(item['id'])
    require(isinstance(data['decisions'], list), 'expected architecture decisions')
    pending = [item['id'] for item in data['decisions'] if decision(root, item, known)]
    strings([item['id'] for item in data['decisions']], 'architecture decision IDs', empty=True)
    return pending


def operation(root, goal, proposed):
    plan = bound(root, goal, 'operation')
    if plan is None:
        return None
    fields(plan, ('basis_sha256', 'assessment_sha256', 'environment', 'as_of', 'target_predicate',
                  'inventory_ref', 'targets', 'exclusions', 'operation_id', 'expected', 'verification', 'recovery', 'criterion_ids'))
    require(plan['assessment_sha256'] == goal['records']['assessment']['sha256'], 'stale operation assessment')
    require(all(text(plan[k]) for k in ('environment', 'target_predicate', 'operation_id', 'expected', 'verification', 'recovery')), 'operation plan incomplete')
    observed = datetime.fromisoformat(plan['as_of'])
    require(observed.tzinfo is not None, 'inventory observation needs timezone')
    inventory = asset(root, plan['inventory_ref'], True)
    ids = strings(inventory['ids'], 'complete inventory', empty=True)
    targets = strings(plan['targets'], 'targets', empty=True)
    excluded = []
    for item in plan['exclusions']:
        fields(item, ('id', 'reason', 'decision_ref'))
        require(text(item['reason']), 'exclusion needs reason')
        asset(root, item['decision_ref']); excluded.append(item['id'])
    excluded = strings(excluded, 'excluded IDs', empty=True)
    require(not targets & excluded and targets | excluded == ids, 'inventory denominator mismatch')
    require(strings(plan['criterion_ids'], 'operation criteria') == {c['id'] for c in proposed['criteria']}, 'operation lost acceptance')
    require(all(c['environment'] == plan['environment'] for c in proposed['criteria']), 'operation acceptance environment mismatch')
    return plan


def check(task, live_baseline=None):
    goal = load(path(task, 'goal.json'))
    fields(goal, ('protocol', 'goal_id', 'revision', 'mode', 'baseline_sha', 'raw_ref', 'feedback_refs',
                  'authority_ref', 'requested_boundary', 'required_channels', 'sources', 'searches', 'budget', 'records'))
    require(goal['protocol'] == 'goal-progress-v1' and text(goal['goal_id'])
            and re.fullmatch(r'r[0-9]{3,}', goal['revision']), 'invalid goal identity')
    require(goal['mode'] in ('real', 'example') and re.fullmatch('[0-9a-f]{40}', goal['baseline_sha']), 'invalid goal baseline/mode')
    require(live_baseline is None or live_baseline == goal['baseline_sha'], 'live baseline drift; re-assess affected evidence')
    require(text(goal['authority_ref']), 'authority source missing')
    require(goal['requested_boundary'] in ('reviewed_design', 'integrated_main', 'deployed', 'operational'), 'invalid completion boundary')
    asset(task, goal['raw_ref'])
    require(isinstance(goal['feedback_refs'], list), 'expected feedback refs')
    for ref in goal['feedback_refs']:
        asset(task, ref)
    channels = strings(goal['required_channels'], 'required discovery channels')
    known = set()
    for item in goal['sources']:
        fields(item, ('id', 'channel', 'locator', 'version', 'artifact_ref'))
        require(all(text(item[k]) for k in ('id', 'channel', 'locator', 'version')) and item['id'] not in known, 'invalid/duplicate source')
        asset(task, item['artifact_ref']); known.add(item['id'])
    searched = set()
    for item in goal['searches']:
        fields(item, ('channel', 'query', 'status', 'source_ids', 'reason'))
        require(text(item['channel']) and text(item['query']) and text(item['reason']), 'search needs query and result/limitation')
        require(item['status'] in ('observed', 'unavailable', 'not_applicable'), 'invalid discovery status')
        source_ids(item['source_ids'], known, 'search sources', empty=item['status'] != 'observed')
        selected = [s for s in goal['sources'] if s['id'] in item['source_ids']]
        require(all(s['channel'] == item['channel'] for s in selected), 'discovery channel/source mismatch')
        # A relevance note for an optional channel is not completed discovery
        # for a channel explicitly retained in the required set.
        if item['status'] == 'observed':
            searched.add(item['channel'])
    budget = goal['budget']
    fields(budget, ('policy_ref', 'max_without_progress', 'attempts_without_progress'))
    require(text(budget['policy_ref']) and type(budget['max_without_progress']) is int and 1 <= budget['max_without_progress'] <= 2
            and type(budget['attempts_without_progress']) is int and budget['attempts_without_progress'] >= 0, 'invalid progress budget')
    require(isinstance(goal['records'], dict) and goal['records'].keys() <= {'assessment', 'architecture', 'operation', 'execution'}, 'unknown goal record')
    # Bind every submitted artifact. Route-specific validation follows below;
    # no downstream record can override an unresolved earlier decision.
    for kind in goal['records']:
        bound(task, goal, kind)
    proposed, pending = assessment(task, goal, known)
    require(proposed is not None or not (goal['records'].keys() - {'assessment'}), 'downstream record without assessment')
    arch_pending, plan = None, None
    if proposed is not None:
        if proposed['route'] == 'software':
            require(not (goal['records'].keys() & {'operation', 'execution'}), 'software evidence must use existing stage/module validators')
            arch_pending = architecture(task, goal, known)
        elif proposed['route'] == 'operation':
            require('architecture' not in goal['records'], 'architecture record on operation route')
            plan = operation(task, goal, proposed)
        else:
            require(not (goal['records'].keys() - {'assessment'}), 'downstream record on research route')
    next_action, resources = 'DISCOVER', ['references/goal-coordination.md']
    if pending:
        next_action = 'HUMAN_DECISION'
    elif channels - searched:
        next_action = 'PREPARE_RESOURCE_DECISION' if budget['attempts_without_progress'] >= budget['max_without_progress'] else 'DISCOVER'
    elif proposed is None:
        next_action = 'COMPARE_PROPOSALS'
    elif proposed['route'] == 'research':
        next_action = 'REVIEW_RESEARCH'
    elif proposed['route'] == 'software':
        next_action = 'ARCHITECTURE' if arch_pending is None else 'HUMAN_DECISION' if arch_pending else 'ROUTE_SOFTWARE'
        pending = arch_pending or []
    else:
        next_action = 'PLAN_OPERATION' if plan is None else 'REVIEW_OPERATION'
    if 'execution' in goal['records']:
        require(proposed is not None and not pending and not channels - searched, 'execution before discovery/decisions')
        require(proposed['route'] == 'operation', 'software evidence must use existing stage/module validators')
        plan = operation(task, goal, proposed)
        require(plan is not None, 'execution without prepared operation')
        run = bound(task, goal, 'execution')
        fields(run, ('basis_sha256', 'plan_sha256', 'operation_id', 'environment', 'authority_record_ref', 'status', 'results', 'proofs'))
        require(run['plan_sha256'] == goal['records']['operation']['sha256'] and run['operation_id'] == plan['operation_id']
                and run['environment'] == plan['environment'], 'execution plan/operation/environment drift')
        require(run['status'] in ('prepared', 'submitted', 'unknown', 'failed', 'verified'), 'invalid execution state')
        if run['status'] != 'prepared':
            require(goal['requested_boundary'] == 'operational', 'operation effect exceeds requested completion boundary')
            asset(task, run['authority_record_ref'])
        require(isinstance(run['results'], list), 'operation results missing')
        seen = set()
        for result in run['results']:
            fields(result, ('id', 'status', 'evidence_ref'))
            require(result['id'] in plan['targets'] and result['id'] not in seen
                    and result['status'] in ('passed', 'unchanged', 'failed', 'unknown'), 'invalid/duplicate target result')
            asset(task, result['evidence_ref']); seen.add(result['id'])
        if run['status'] == 'verified':
            require(seen == set(plan['targets']) and all(r['status'] in ('passed', 'unchanged') for r in run['results']), 'incomplete operation readback')
        require(isinstance(run['proofs'], list), 'criterion proof list missing')
        proved = set()
        for proof in run['proofs']:
            fields(proof, ('criterion_id', 'environment', 'observed_at', 'evidence_ref'))
            require(proof['criterion_id'] in plan['criterion_ids'] and proof['criterion_id'] not in proved
                    and proof['environment'] == plan['environment'], 'criterion proof identity/environment mismatch')
            require(datetime.fromisoformat(proof['observed_at']).tzinfo is not None, 'proof needs observation timezone')
            asset(task, proof['evidence_ref']); proved.add(proof['criterion_id'])
        if run['status'] == 'verified':
            require(proved == set(plan['criterion_ids']), 'incomplete criterion proof')
        next_action = {'prepared': 'REVIEW_OPERATION', 'submitted': 'READBACK_OPERATION', 'unknown': 'READBACK_OPERATION',
                       'failed': 'REPAIR_OPERATION', 'verified': 'VERIFY_OUTCOME_EXTERNALLY'}[run['status']]
        if run['status'] == 'failed' and (seen != set(plan['targets']) or any(r['status'] == 'unknown' for r in run['results'])):
            next_action = 'READBACK_OPERATION'
    if budget['attempts_without_progress'] >= budget['max_without_progress'] and next_action not in ('HUMAN_DECISION', 'READBACK_OPERATION', 'VERIFY_OUTCOME_EXTERNALLY'):
        next_action = 'PREPARE_RESOURCE_DECISION'
    selected = {'ARCHITECTURE': ('architecture', ['assessment'], ['../sdlc-design/agents/architecture.md']),
                'ROUTE_SOFTWARE': ('goal', ['assessment', 'architecture'], ['../sdlc-workflow/SKILL.md'])}
    role, input_names, resources = selected.get(next_action, ('goal',
        ['assessment', 'architecture'] if pending and arch_pending else
        ['assessment', 'operation', 'execution'] if next_action in ('REVIEW_OPERATION', 'READBACK_OPERATION', 'REPAIR_OPERATION', 'VERIFY_OUTCOME_EXTERNALLY') else
        ['assessment'], ['references/goal-coordination.md']))
    return {'contract': 'PASS_STATIC_ONLY', 'state': 'EXAMPLE_ONLY' if goal['mode'] == 'example' else 'ROUTE_CANDIDATE_STATIC',
            'goal_id': goal['goal_id'], 'revision': goal['revision'], 'basis_sha256': basis(goal),
            'next_action': next_action, 'pending_decisions': pending, 'missing_channels': sorted(channels - searched),
            'role': role, 'resources': resources, 'inputs': {kind: goal['records'][kind] for kind in input_names if kind in goal['records']},
            'authentic_approval': 'NOT_VERIFIED', 'runtime': 'NOT_VERIFIED', 'execution_granted': False,
            'proof_boundary': 'Host must authenticate decisions, current resources and actual outcomes; this checker cannot.'}


def recovery_hint(task):
    """Preserve a read-only lead after source/main drift; never re-sign old work.

    This is not execution admission. The host must authenticate the original
    service operation before using its id to inspect an uncertain outcome.
    """
    try:
        goal = load(path(task, 'goal.json'))
        run_ref, plan_ref = goal['records']['execution'], goal['records']['operation']
        run, plan = asset(task, run_ref, True), asset(task, plan_ref, True)
        require(isinstance(run, dict) and isinstance(plan, dict), 'invalid recovery records')
        require(run['plan_sha256'] == plan_ref['sha256'] and run['operation_id'] == plan['operation_id']
                and run['environment'] == plan['environment'] and text(run['operation_id']) and text(run['environment']), 'unbound recovery identity')
        if run['status'] in ('unknown', 'submitted', 'failed'):
            return {'next_action': 'READBACK_OPERATION', 'operation_id': run['operation_id'], 'environment': run['environment'],
                    'inputs': {'operation': plan_ref, 'execution': run_ref}, 'authenticity': 'NOT_VERIFIED',
                    'constraint': 'Read-only reconciliation lead; no retry, mutation, re-signing or completion claim.'}
    except (ValueError, TypeError, KeyError, OSError):
        pass
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--task', required=True, type=Path)
    parser.add_argument('--live-baseline')
    args = parser.parse_args()
    try:
        result = check(args.task.resolve(), args.live_baseline)
    except (ValueError, TypeError, KeyError, OSError) as exc:
        print(json.dumps({'contract': 'FAIL', 'issues': [str(exc)], 'execution_granted': False,
                          'recovery_hint': recovery_hint(args.task.resolve())}, ensure_ascii=False))
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
