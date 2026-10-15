import json
from pathlib import Path
import tempfile
import unittest
from check_browser_evidence import check, MOBILE_SKIP


class EvidenceTests(unittest.TestCase):
    def test_missing_runner_stale_and_omitted_cases_block(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / '.e2e').mkdir(); (root / 'test-results').mkdir()
            report = {'run': {'status': 'passed', 'exitCode': 0, 'vcs': {'commit': 'a'*40, 'dirty': False},
                'summary': dict(discovered=1, selected=1, executed=1, passed=1, failed=0, interrupted=0, flaky=0, skipped=0)}}
            old = {'stats': dict(expected=16, skipped=1, unexpected=0, flaky=0), 'suites': [{'specs':
                [{'title': str(i), 'tests': [{'results': [{'status': 'passed'}]}]} for i in range(16)] +
                [{'title': MOBILE_SKIP, 'tests': [{'results': [{'status': 'skipped'}]}]}]}]}
            new_path = root / '.e2e/report.json'
            new_path.write_text(json.dumps(report))
            (root / '.e2e/junit.xml').write_text('<testsuites/>')
            (root / 'test-results/legacy-results.json').write_text(json.dumps(old))
            self.assertEqual(check(root, 'a'*40)['legacy_passed'], 16)
            with self.assertRaises(AssertionError): check(root, 'b'*40)
            new_path.unlink()
            with self.assertRaises(FileNotFoundError): check(root, 'a'*40)
            report['run']['summary']['selected'] = 0
            new_path.write_text(json.dumps(report))
            with self.assertRaises(AssertionError): check(root, 'a'*40)
            report['run']['summary']['selected'] = 1
            new_path.write_text(json.dumps(report))
            old['suites'][0]['specs'][0]['tests'][0]['results'][0]['status'] = 'skipped'
            (root / 'test-results/legacy-results.json').write_text(json.dumps(old))
            with self.assertRaises(AssertionError): check(root, 'a'*40)
