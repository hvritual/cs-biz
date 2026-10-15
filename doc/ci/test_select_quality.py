import subprocess
import tempfile
from pathlib import Path
import unittest
from select_quality import plan, tier_for


def entries(*paths):
    return [(p, ('100644', '100644')) for p in paths]


class SelectionTests(unittest.TestCase):
    def test_document_assets_and_backend_isolation(self):
        self.assertEqual(tier_for(entries('doc/tasks/F0.md', 'doc/tasks/a.json')), 'docs')
        self.assertEqual(tier_for(entries('backend/internal/platform/authz/check.go', 'backend/doc/auth.md')), 'backend')

    def test_risk_escalation_counterexamples(self):
        for path in ['frontend/apps/console/src/styles/desktop.css', 'frontend/apps/console/src/locales/langs/en-US/auth.json',
                     'frontend/tests/e2e/a.e2e.ts', 'frontend/pnpm-lock.yaml', 'backend/go.mod',
                     'backend/new_server.go', 'backend/deploy/a.yaml', 'doc/ci/a.md', 'doc/workflow/a.md',
                     '.github/workflows/quality.yml', '.agents/skills/a/SKILL.md', 'AGENTS.md', 'unknown.txt']:
            self.assertEqual(tier_for(entries('doc/tasks/a.md', path)), 'full', path)
        self.assertEqual(tier_for([]), 'full')
        for mode in ['100755', '120000', '160000']:
            self.assertEqual(tier_for([('doc/a.md', ('100644', mode))]), 'full')
        self.assertEqual(tier_for(entries('backend/internal/platform/authz/a.go', 'frontend/app.ts')), 'full')

    def test_real_git_rename_and_stale_base(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=root).decode().strip()
            git('init', '-q'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid')
            (root / 'code.py').write_text('code')
            git('add', '.'); git('commit', '-qm', 'base'); base = git('rev-parse', 'HEAD')
            (root / 'doc').mkdir(); git('mv', 'code.py', 'doc/code.md'); git('commit', '-qm', 'rename')
            head = git('rev-parse', 'HEAD')
            result = plan(base, head, root)
            self.assertEqual(result['tier'], 'full')
            self.assertIn('code.py', result['paths'])
            with self.assertRaises(subprocess.CalledProcessError):
                plan(head, base, root)
            with self.assertRaises(ValueError):
                plan('main', head, root)


if __name__ == '__main__':
    unittest.main()
