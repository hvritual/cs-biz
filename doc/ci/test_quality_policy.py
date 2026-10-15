from pathlib import Path
import shutil
import tempfile
import unittest
from check_quality_policy import check

ROOT = Path(__file__).resolve().parents[2]


class QualityPolicyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        shutil.copytree(ROOT / '.github/workflows', self.root / '.github/workflows')

    def tearDown(self):
        self.tmp.cleanup()

    def test_real_source(self):
        self.assertEqual(check(self.root), [])

    def test_independent_counterexamples(self):
        file = self.root / '.github/workflows/quality.yml'
        original = file.read_text()
        for old, new in [
            ('git show "$base:doc/ci/select_quality.py"', 'cat doc/ci/select_quality.py'),
            ('tier=full', 'tier=docs'),
            ('corepack pnpm test:e2e\n', 'corepack pnpm test:e2e:journey\n'),
            ('include-hidden-files: true', 'include-hidden-files: false'),
            ("main == e['BASE_SHA']", 'True'),
            ("pr['head']['sha'] == e['HEAD_SHA']", 'True'),
            ("e['BACKEND_RESULT'] ==", "e['BACKEND_RESULT'] !="),
            ('needs: [classify, backend, frontend]', 'needs: classify'),
            ('  quality-gate:\n', '  quality-gate:\n    # actions/checkout candidate\n'),
            ('run: corepack pnpm build\n', 'run: corepack pnpm build\n      - run: corepack pnpm build\n'),
            ('run: corepack pnpm test:e2e\n', 'if: false\n        run: corepack pnpm test:e2e\n'),
            ('run: corepack pnpm test:e2e\n', 'continue-on-error: true\n        run: corepack pnpm test:e2e\n'),
        ]:
            self.assertIn(old, original)
            file.write_text(original.replace(old, new, 1))
            self.assertTrue(check(self.root), (old, new))
        file.write_text(original)
        old_pipeline = self.root / '.github/workflows/frontend.yml'
        old_pipeline.write_text(old_pipeline.read_text().replace('on:\n', 'on:\n  push:\n', 1))
        self.assertTrue(check(self.root))


if __name__ == '__main__':
    unittest.main()
