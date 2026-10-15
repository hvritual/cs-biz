#!/usr/bin/env python3
"""Require both runner reports, baseline coverage and exact tester-army source."""
import argparse
import json
from pathlib import Path

MOBILE_SKIP = 'mobile: usable navigation and full-width customer drawer without page overflow'


def check(frontend, head):
    new = json.loads((frontend / '.e2e/report.json').read_text())['run']
    old = json.loads((frontend / 'test-results/legacy-results.json').read_text())
    # Mandatory files are checked individually, not with upload-artifact's any-path semantics.
    assert (frontend / '.e2e/junit.xml').stat().st_size > 0, 'missing tester-army junit'
    assert new['status'] == 'passed' and new['exitCode'] == 0, 'tester-army failed'
    assert new['vcs']['commit'] == head and not new['vcs']['dirty'], 'tester-army source mismatch'
    counts = new['summary']
    assert counts['discovered'] == counts['selected'] == counts['executed'] == counts['passed'] >= 1, 'new runner omitted tests'
    assert all(counts[k] == 0 for k in ('failed', 'interrupted', 'flaky', 'skipped')), 'new runner incomplete'
    stats = old['stats']
    assert stats['expected'] >= 16 and stats['skipped'] == 1, 'legacy baseline coverage lost'
    assert stats['unexpected'] == stats['flaky'] == 0, 'legacy failed/flaky'
    skipped = []
    executed = 0
    def walk(suite):
        nonlocal executed
        for spec in suite.get('specs', []):
            for test in spec['tests']:
                results = test['results']
                assert len(results) == 1, 'no retries to mask flaky'
                status = results[0]['status']
                assert status in ('passed', 'skipped'), 'legacy incomplete result'
                if status == 'skipped': skipped.append(spec['title'])
                else: executed += 1
        for child in suite.get('suites', []): walk(child)
    for suite in old['suites']: walk(suite)
    assert skipped == [MOBILE_SKIP] and executed == stats['expected'], 'unexpected skip or report count mismatch'
    return {'head': head, 'tester_army': counts, 'legacy_passed': executed, 'legacy_skipped': skipped}


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--frontend', type=Path, required=True)
    p.add_argument('--head', required=True)
    args = p.parse_args()
    print(json.dumps(check(args.frontend, args.head), ensure_ascii=False))
