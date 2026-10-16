#!/usr/bin/env python3
"""Read-only intent-design-v2 handoff checks, never an approval/runtime authority."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path, PurePosixPath

ROOT = next((p for p in Path(__file__).resolve().parents if (p / 'AGENTS.md').is_file()), Path.cwd())
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
