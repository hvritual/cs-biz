#!/usr/bin/env python3
"""Read-only intent-design-v2 handoff checks, never an approval/runtime authority."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[2]
SHA = re.compile(r'[0-9a-f]{40}')
ARTIFACTS = ('solution.md', 'requirements.md', 'design.md', 'journey.md', 'flow.mmd')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def content_digest(data):
    return digest(json.dumps({k: v for k, v in data.items() if k != 'review'},
                            ensure_ascii=False, sort_keys=True, separators=(',', ':'),
                            allow_nan=False).encode())


def require(ok, message):
    if not ok:
        raise ValueError(message)


def text(value):
    return isinstance(value, str) and bool(value.strip())


def relative(root, value):
    require(text(value) and '\\' not in value and '\x00' not in value,
            'invalid relative path')
    path = PurePosixPath(value)
    require(not path.is_absolute() and '..' not in path.parts and ':' not in value
            and not value.startswith('~'), 'path escapes allowed root')
    result = root / value
    require(result.resolve().is_relative_to(root.resolve()), 'path escapes allowed root')
    require(not any(p.is_symlink() for p in (result, *result.parents)
                    if p.is_relative_to(root)), 'symlink artifact prohibited')
    require(result.is_file() and 0 < result.stat().st_size <= 1_000_000,
            'missing, empty or oversized artifact: ' + value)
    return result


def pairs(rows):
    out = {}
    for key, value in rows:
        require(key not in out, 'duplicate JSON key: ' + key)
        out[key] = value
    return out


def read_json(path):
    require(path.is_file() and path.stat().st_size <= 250_000, 'missing/oversized JSON')
    data = json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=pairs,
                      parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite JSON')))
    require(isinstance(data, dict), 'JSON object required')
    return data


def git_bytes(root, commit, path):
    require(isinstance(commit, str) and SHA.fullmatch(commit), 'exact Git SHA required')
    # Validate path independently before passing an argument to git; never run a shell.
    scope_path(path, glob_root=False)
    kind = subprocess.run(['git', '-C', str(root), 'cat-file', '-t', commit],
                          capture_output=True, timeout=10)
    require(kind.returncode == 0 and kind.stdout.strip() == b'commit',
            'Git reference must identify a commit, not a tree/blob')
    run = subprocess.run(['git', '-C', str(root), 'show', f'{commit}:{path}'],
                         capture_output=True, timeout=10)
    require(run.returncode == 0, 'Git source unavailable: ' + path)
    require(len(run.stdout) <= 1_000_000, 'oversized Git source')
    return run.stdout


def asset(task, row):
    require(isinstance(row, dict), 'asset reference must be object')
    path = relative(task, row.get('path'))
    require(row.get('sha256') == digest(path.read_bytes()), 'stale artifact: ' + row['path'])
    return path


def scope_path(value, glob_root=True):
    require(text(value) and not any(c in value for c in ('\\', '\x00', ':'))
            and not value.startswith(('~', '/')), 'invalid handoff/source path')
    path = PurePosixPath(value)
    require(path.parts and '..' not in path.parts and '.' not in path.parts
            and value.rstrip('/') == path.as_posix(), 'noncanonical handoff/source path')
    if not glob_root:
        require(not any(c in path.parts[0] for c in '*?['), 'scope needs concrete root')
    return path


def intent_pointer(spec, pointer):
    require(text(pointer) and pointer.startswith('/'), 'intent_ref must be a JSON pointer')
    value = spec
    for segment in pointer[1:].split('/'):
        require(not re.search(r'~(?![01])', segment), 'invalid JSON pointer escape')
        key = segment.replace('~1', '/').replace('~0', '~')
        if isinstance(value, dict):
            require(key in value, 'intent_ref target missing')
            value = value[key]
        elif isinstance(value, list):
            require(re.fullmatch(r'0|[1-9][0-9]*', key) and int(key) < len(value),
                    'intent_ref target missing')
            value = value[int(key)]
        else:
            raise ValueError('intent_ref target missing')
    require(value is not None, 'intent_ref target missing')


def frontend_snapshot(root, commit):
    # Include runtime dependencies and locks, not only the listed preview Vue file.
    changed = subprocess.run(['git', '-C', str(root), 'diff', '--no-ext-diff',
                              '--no-textconv', '--quiet', commit, '--', 'frontend'],
                             capture_output=True, timeout=10)
    untracked = subprocess.run(['git', '-C', str(root), 'ls-files', '--others',
                                '--exclude-standard', '-z', '--', 'frontend'],
                               capture_output=True, timeout=10)
    require(changed.returncode == 0 and untracked.returncode == 0 and not untracked.stdout,
            'frontend snapshot changed since preview candidate')


def check(task, root):
    task, root = task.resolve(), root.resolve()
    data = read_json(relative(task, 'design-loop.json'))
    require(data.get('protocol') == 'intent-design-v2', 'wrong design protocol')
    require(text(data.get('task_ref')), 'task authority missing')
    require(re.fullmatch(r'r[0-9]{3,}', str(data.get('revision', ''))), 'revision missing')
    raw = asset(task, data['raw'])
    require(text(data['raw'].get('source_ref')), 'raw source missing')
    asset(task, data['optimized_prompt'])
    intent = read_json(asset(task, data['intent']))
    raw_text = raw.read_text(encoding='utf-8')
    trace = data.get('trace')
    require(isinstance(trace, list) and trace, 'raw-to-design trace missing')
    seen = set()
    for row in trace:
        require(isinstance(row, dict) and text(row.get('requirement_id'))
                and row['requirement_id'] not in seen, 'invalid/duplicate trace ID')
        seen.add(row['requirement_id'])
        require(text(row.get('raw_quote')) and row['raw_quote'] in raw_text,
                'trace quote is not raw source')
        intent_pointer(intent, row.get('intent_ref'))
        for field in ('acceptance_ids', 'design_refs'):
            require(isinstance(row.get(field), list) and row[field]
                    and all(text(x) for x in row[field]), 'incomplete requirement trace')
    knowledge = data.get('knowledge')
    require(isinstance(knowledge, list) and knowledge, 'project knowledge missing')
    for row in knowledge:
        require(isinstance(row, dict), 'invalid knowledge reference')
        require(row.get('status') in {'accepted', 'proposed', 'superseded', 'conflict',
                                     'documented', 'current_source', 'unknown'}, 'invalid knowledge status')
        require(row.get('use') in {'constraint', 'option', 'background', 'current_fact'}, 'invalid knowledge use')
        require(text(row.get('locator')) and text(row.get('relevance')), 'knowledge location/relevance missing')
        original = git_bytes(root, row.get('commit'), row.get('path'))
        require(row.get('sha256') == digest(original), 'knowledge digest mismatch')
        if row['use'] == 'constraint':
            require(row['status'] == 'accepted', 'unaccepted ADR cannot become constraint')
        if row['use'] == 'current_fact':
            require(row['status'] == 'current_source' and
                    row['sha256'] == digest(relative(root, row['path']).read_bytes()),
                    'historical source cannot prove current capability')
    for name in ('conditions', 'preferences'):
        require(isinstance(data.get(name), list) and data[name], name + ' must be evaluated')
        ids = set()
        for row in data[name]:
            require(isinstance(row, dict) and text(row.get('id')) and row['id'] not in ids,
                    'invalid/duplicate ' + name + ' ID')
            ids.add(row['id'])
            require(row.get('status') in {'available', 'missing', 'unknown', 'not_applicable'},
                    'invalid condition/preference status')
            require(type(row.get('blocking')) is bool and text(row.get('source_ref')),
                    'condition/preference provenance missing')
            require(not (row['blocking'] and row['status'] in {'missing', 'unknown'}),
                    'blocking condition/preference unresolved')
            if row['status'] in {'missing', 'unknown'}:
                require(text(row.get('owner')) and text(row.get('next_action')),
                        'unavailable condition needs owner and next action')
            if row['status'] == 'not_applicable':
                require(text(row.get('reason')), 'inapplicability needs reason')
    require(isinstance(data.get('decisions'), list), 'decision tree missing')
    ids = set()
    for row in data['decisions']:
        require(isinstance(row, dict) and text(row.get('id')) and row['id'] not in ids,
                'invalid/duplicate decision ID')
        ids.add(row['id'])
        for key in ('trigger', 'question', 'recommendation', 'answer_ref'):
            require(text(row.get(key)), 'decision missing ' + key)
        require(isinstance(row.get('options'), list) and len(row['options']) >= 2
                and all(text(x) for x in row['options'])
                and len(set(row['options'])) == len(row['options']), 'decision alternatives missing')
        require(row.get('answer') in row['options'], 'decision answer unresolved')
    artifacts = data.get('artifacts')
    require(isinstance(artifacts, dict), 'design pack missing')
    require(all(name in artifacts for name in ARTIFACTS), 'mandatory design pack missing')
    for name, expected in artifacts.items():
        require(expected == digest(relative(task, name).read_bytes()),
                'design pack stale/missing: ' + name)
    for row in trace:
        for ref in row['design_refs']:
            path = ref.split('#', 1)[0]
            require(path in artifacts, 'design_ref target missing from design pack')
            relative(task, path)
    require(type(data.get('frontend_change')) is bool, 'frontend classification missing')
    handoff = data['handoff']
    require(isinstance(handoff, dict) and handoff.get('owner') == 'executing_model_outside_workflow',
            'execution responsibility must remain outside design workflow')
    for key in ('allowed_paths', 'forbidden_paths', 'acceptance_ids'):
        require(isinstance(handoff.get(key), list) and handoff[key]
                and all(text(x) for x in handoff[key]), 'handoff missing ' + key)
    traced_ac = {ac for row in trace for ac in row['acceptance_ids']}
    require(traced_ac == set(handoff['acceptance_ids']), 'handoff drops/adds traced acceptance')
    require(text(handoff.get('execution_authority_ref')), 'execution authority must be explicit, including none')
    require(handoff.get('auto_execute') is False, 'design workflow cannot dispatch implementation')
    for path in handoff['forbidden_paths']:
        scope_path(path)
    scopes = [scope_path(p, glob_root=False) for p in handoff['allowed_paths']]
    ui_paths = any(p.parts[0] == 'frontend' for p in scopes)
    require(not ui_paths or data['frontend_change'], 'frontend paths contradict non-UI classification')
    preview = data['preview']
    require(isinstance(preview, dict), 'preview missing')
    if data['frontend_change']:
        require(preview.get('kind') == 'in_project' and
                preview.get('root') == 'frontend/apps/console', 'in-project frontend preview required')
        for key in ('route', 'command'):
            require(text(preview.get(key)), 'preview missing ' + key)
        asset(task, preview['scenarios_ref'])
        asset(task, preview['production_isolation_ref'])
        require(artifacts.get('ux-analysis.yaml') == digest(relative(task, 'ux-analysis.yaml').read_bytes()),
                'UX analysis missing/stale')
        assets = preview.get('source_assets')
        require(isinstance(assets, dict) and assets, 'project preview source assets missing')
        require(any(p.endswith('.vue') for p in assets), 'Vue preview source missing')
        for path, expected in assets.items():
            require(path.startswith('frontend/apps/console/'), 'preview source outside existing frontend')
            require(expected == digest(relative(root, path).read_bytes()) ==
                    digest(git_bytes(root, preview.get('candidate_sha'), path)),
                    'preview source changed since runtime candidate')
        require(isinstance(preview.get('reuse_refs'), list) and preview['reuse_refs'], 'project reuse evidence missing')
        for path in preview['reuse_refs']:
            require(path.startswith('frontend/'), 'reuse must reference frontend')
            relative(root, path)
        frontend_snapshot(root, preview['candidate_sha'])
        runtime = read_json(asset(task, preview['browser_evidence']))
        require(runtime.get('candidate_sha') == preview['candidate_sha'] and
                runtime.get('source_assets') == assets and runtime.get('route') == preview['route']
                and runtime.get('scenarios_ref') == preview['scenarios_ref']
                and runtime.get('production_isolation_ref') == preview['production_isolation_ref'],
                'runtime evidence targets stale preview')
        require(runtime.get('result') == 'pass' and isinstance(runtime.get('scenarios'), list)
                and runtime['scenarios'] and all(text(x) for x in runtime['scenarios']),
                'preview browser journey not verified')
        asset(task, runtime['log'])
    else:
        require(preview.get('kind') == 'not_applicable' and text(preview.get('reason')),
                'non-UI needs explicit preview inapplicability')
    review = data['review']
    require(isinstance(review, dict) and review.get('decision') == 'approved'
            and review.get('scope') == 'design' and text(review.get('record_ref')),
            'complete design review reference required (not authenticated here)')
    require(review.get('revision') == data['revision'] and
            review.get('content_sha256') == content_digest(data), 'review targets stale design pack')
    return data


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--task', required=True, type=Path)
    parser.add_argument('--repo-root', type=Path, default=ROOT)
    args = parser.parse_args(argv)
    errors = []
    try:
        check(args.task, args.repo_root)
    except (ValueError, OSError, KeyError, TypeError, AttributeError, RecursionError,
            subprocess.SubprocessError) as exc:
        errors.append(str(exc))
    print(json.dumps({'contract': 'FAIL' if errors else 'PASS_STATIC_ONLY',
                      'authentic_approval': 'NOT_VERIFIED', 'runtime': 'NOT_VERIFIED',
                      'execution_granted': False, 'issues': errors}, ensure_ascii=False, indent=2))
    return 2 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
