#!/usr/bin/env python3
"""Trusted-base change selection. Unknown or unsafe changes always select full."""
import argparse
import json
from pathlib import Path
import re
import subprocess


def doc_path(path):
    from pathlib import PurePosixPath
    p = PurePosixPath(path)
    return (not any(x.startswith('.') or x == 'AGENTS.md' for x in p.parts)
            and not path.startswith(('doc/ci/', 'doc/workflow/', 'doc/templates/'))
            and (path in ('README.md', 'LICENSE', 'LICENSE.md', 'CHANGELOG.md')
                 or (path.startswith(('doc/', 'frontend/doc/', 'backend/doc/'))
                     and p.suffix.lower() in {'.md', '.txt', '.json', '.yaml', '.yml', '.mmd', '.svg', '.png', '.jpg', '.jpeg', '.webp'})))


def tier_for(entries):
    if not entries or any(mode not in ('000000', '100644') for _, modes in entries for mode in modes):
        return 'full'
    paths = [path for path, _ in entries]
    if all(doc_path(p) for p in paths):
        return 'docs'
    # Current frontend uses its local Mock services, not this standalone Go library.
    # API/server/deploy/new backend surfaces are unknown and select full.
    if all(doc_path(p) or (p.startswith('backend/internal/platform/authz/') and p.endswith('.go')) for p in paths):
        return 'backend'
    return 'full'


def plan(base, head, repo='.'):
    if not all(re.fullmatch('[0-9a-f]{40}', x) for x in (base, head)):
        raise ValueError('exact base/head SHA required')
    subprocess.run(['git', 'merge-base', '--is-ancestor', base, head], cwd=repo, check=True)
    raw = subprocess.check_output(['git', 'diff', '--raw', '--no-renames', '-z', base, head], cwd=repo).split(b'\0')
    entries = []
    for i in range(0, len(raw) - 1, 2):
        meta = raw[i].decode().split()
        entries.append((raw[i + 1].decode('utf-8', errors='strict'), (meta[0][1:], meta[1])))
    tier = tier_for(entries)
    return {'base': base, 'head': head, 'tier': tier,
            'backend': tier in ('backend', 'full'), 'frontend': tier == 'full',
            'paths': [p for p, _ in entries]}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--base', required=True)
    p.add_argument('--head', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--github-output')
    args = p.parse_args()
    result = plan(args.base, args.head)
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    if args.github_output:
        with open(args.github_output, 'a') as stream:
            stream.write(f"tier={result['tier']}\nbackend={str(result['backend']).lower()}\nfrontend={str(result['frontend']).lower()}\n")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
