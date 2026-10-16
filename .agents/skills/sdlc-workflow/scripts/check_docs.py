#!/usr/bin/env python3
"""Read-only first-party document routing/ownership checks, never semantic approval.

Markdown support is ordinary inline relative file links; no remote/anchor checks.
Historical tasks/evidence and vendored product sources are deliberately not loaded.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[4]
CONFIG = '.agents/skills/sdlc-workflow/references/project-docs.json'
LINK = re.compile(r'!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^\"]*")?\)')
FENCE = re.compile(r'(?ms)^```[^\n]*\n.*?^```\s*$')
STAGES = ('design', 'build', 'deploy')


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def inside(root, name):
    if not isinstance(name, str) or not name or '\\' in name or ':' in name:
        raise ValueError('invalid repository path')
    path = root / name
    if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('unsafe repository path: ' + name)
    return path


def documents(root):
    names = {'README.md', 'AGENTS.md', '.github/PULL_REQUEST_TEMPLATE.md'}
    for side in ('frontend', 'backend'):
        names.update((side + '/README.md', side + '/AGENTS.md', side + '/ci/README.md'))
        for directory in ('doc', 'deploy'):
            names.update(p.relative_to(root).as_posix() for p in (root/side/directory).rglob('*.md'))
    for p in (root/'doc').rglob('*.md'):
        rel = p.relative_to(root).as_posix()
        if not rel.startswith(('doc/tasks/', 'doc/evidence/')) or rel in ('doc/tasks/README.md','doc/evidence/README.md'):
            names.add(rel)
    names.update(p.relative_to(root).as_posix() for p in (root/'.agents/skills').rglob('*.md'))
    return names


def check(root):
    root = root.resolve()
    config = load(inside(root, CONFIG))
    if config.get('protocol') != 'project-docs-v1':
        raise ValueError('unsupported document map')
    errors = []
    names = documents(root)
    for name in config['entrypoints'] + config['navigation']:
        if not inside(root,name).is_file():
            errors.append('MISSING_ENTRY: ' + name)
    actual = {p.parent.name for p in (root/'.agents/skills').glob('*/SKILL.md')}
    if actual != set(config['public_skills']):
        errors.append('PUBLIC_SKILL_SET: ' + repr(sorted(actual)))
    expected_skills = {'.agents/skills/' + s + '/SKILL.md' for s in config['public_skills']}
    graph = {name:set() for name in names}
    for stage in STAGES:
        prefix = '.agents/skills/sdlc-' + stage + '/'
        manifest = load(inside(root, prefix + 'workflow.json'))
        refs = [manifest['agent_instructions']]
        for step in manifest['steps']:
            expected_skills.add(prefix + step['skill'])
            refs += [step['skill'], *step.get('resources', [])]
        for ref in refs:
            target = prefix + ref
            if not inside(root,target).is_file():
                errors.append('BROKEN_WORKFLOW_RESOURCE: ' + target)
            if target in names:
                graph.setdefault(prefix+'SKILL.md',set()).add(target)
    actual_skills = {p.relative_to(root).as_posix() for p in (root/'.agents/skills').rglob('SKILL.md')}
    if expected_skills != actual_skills:
        errors.append('UNOWNED_OR_MISSING_CAPABILITY: ' + repr(sorted(expected_skills ^ actual_skills)))
    for item in config['retired']:
        if inside(root,item['path']).exists():
            errors.append('RETIRED_ENTRY_PRESENT: ' + item['path'])
        if not item.get('reason') or not re.fullmatch('[0-9a-f]{40}',item.get('last_present_commit','')):
            errors.append('INVALID_RETIREMENT: ' + item['path'])
        if not inside(root,item['replacement']).exists():
            errors.append('MISSING_REPLACEMENT: ' + item['replacement'])
    exemptions = set(config['historical_reference_docs']) | set(config['historical_docs'])
    for name in sorted(names):
        path = inside(root,name)
        if not path.is_file():
            errors.append('MISSING_DOCUMENT: ' + name)
            continue
        body = path.read_text(encoding='utf-8')
        if not body.strip():
            errors.append('EMPTY_DOCUMENT: ' + name)
        if name not in exemptions:
            for item in config['retired']:
                if item['path'] in body:
                    errors.append('ACTIVE_RETIRED_REFERENCE: ' + name + ' -> ' + item['path'])
        for match in LINK.finditer(FENCE.sub('',body)):
            url = urlsplit(match.group(1).strip('<>'))
            if url.scheme or url.netloc or not url.path:
                continue
            target = (path.parent / unquote(url.path)).resolve()
            if not target.is_relative_to(root) or not target.exists():
                errors.append('BROKEN_LINK: ' + name + ' -> ' + match.group(1))
            else:
                rel = target.relative_to(root).as_posix()
                if rel in names:
                    graph[name].add(rel)
    reached = set()
    pending = list(config['entrypoints'])
    while pending:
        name = pending.pop()
        if name in reached:
            continue
        reached.add(name)
        pending.extend(graph.get(name,set()) - reached)
    errors += ['UNREACHABLE_DOCUMENT: ' + name for name in sorted(names - reached)]
    # Known execution facts described by the CI map. Behavior changes require a
    # governed docs-map update; this is not natural-language truth verification.
    package = load(inside(root,'frontend/package.json'))
    if package['scripts'].get('check') != 'pnpm check:fast':
        errors.append('COMMAND_DRIFT: frontend check no longer maps to documented Fast')
    command = inside(root,'doc/ci/check.sh').read_text()
    for token in ('mode="${1:---fast}"','bash "$root/backend/ci/check.sh"','--fast) corepack pnpm check:fast','--full) corepack pnpm check:full'):
        if token not in command:
            errors.append('COMMAND_DRIFT: root check scope changed: ' + token)
    risk_path = inside(root,'.agents/skills/sdlc-build/references/admission.md')
    risk = risk_path.read_text() if risk_path.is_file() else ''
    risk_terms = ('T0 engineering or docs', 'T1 presentation', 'T2 interaction',
                  'T3 backend capability', 'T4 human business task',
                  'Permissions, tenant scope, money, remote device control, deletion, quotas',
                  'cannot be classed below T3', 'human-triggered business operation uses T4',
                  'Risk unknown -> investigate, never default to low')
    for token in risk_terms:
        if token not in risk:
            errors.append('BUILD_RISK_DEFINITION_MISSING: ' + token)
    return {'contract':'FAIL' if errors else 'PASS_STATIC_ONLY',
            'documents':len(names),'reachable':len(names & reached),
            'public_skills':len(actual),'capabilities':len(expected_skills)-len(config['public_skills']),
            'retired_entries':len(config['retired']),'issues':errors,
            'semantic_freshness':'NOT_VERIFIED','authentic_approval':'NOT_VERIFIED','execution_granted':False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root',type=Path,default=ROOT)
    args = parser.parse_args()
    try:
        result = check(args.repo_root)
    except (ValueError,OSError,KeyError,TypeError) as exc:
        result = {'contract':'FAIL','issues':[str(exc)],'execution_granted':False}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 2 if result['contract']=='FAIL' else 0


if __name__ == '__main__':
    sys.exit(main())
