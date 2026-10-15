#!/usr/bin/env python3
"""Classify a complete base/head diff; run this from trusted main, never PR code."""
import argparse
import json
from pathlib import PurePosixPath
import re
import subprocess


def allowed(path):
    p = PurePosixPath(path)
    if any(part.startswith('.') or part == 'AGENTS.md' for part in p.parts):
        return False
    if path.startswith(('doc/ci/', 'doc/workflow/', 'doc/templates/')):
        return False
    if path in ('README.md', 'LICENSE', 'LICENSE.md', 'CHANGELOG.md'):
        return True
    return (path.startswith(('doc/', 'frontend/doc/', 'backend/doc/'))
            and p.suffix.lower() in {'.md', '.txt', '.json', '.yaml', '.yml',
                                     '.mmd', '.svg', '.png', '.jpg', '.jpeg', '.webp'})


def classify(base, head, cwd=None):
    if not all(re.fullmatch(r'[0-9a-f]{40}', ref) for ref in (base, head)):
        raise ValueError('full base/head SHA required')
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=cwd)
    # Require latest main to be included. A stale/diverged candidate must rebase/merge first.
    subprocess.run(['git', 'merge-base', '--is-ancestor', base, head], cwd=cwd, check=True)
    raw = git('diff', '--raw', '--no-renames', '-z', base, head).split(b'\0')
    paths, blocked = [], []
    for i in range(0, len(raw) - 1, 2):
        meta, path = raw[i].decode().split(), raw[i + 1].decode('utf-8', errors='strict')
        paths.append(path)
        modes = (meta[0][1:], meta[1])
        if not allowed(path) or any(mode not in ('000000', '100644') for mode in modes):
            blocked.append(path)
    return {'base': base, 'head': head, 'classification':
            'DOCS_ONLY' if paths and not blocked else 'REVIEW_REQUIRED',
            'paths': paths, 'blocked': blocked}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    parser.add_argument('--head', required=True)
    args = parser.parse_args()
    try:
        result = classify(args.base, args.head)
    except (ValueError, OSError, subprocess.CalledProcessError, UnicodeError) as exc:
        print(json.dumps({'classification': 'REVIEW_REQUIRED', 'error': str(exc)}))
        return 2
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result['classification'] == 'DOCS_ONLY' else 2


if __name__ == '__main__':
    raise SystemExit(main())
