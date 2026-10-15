import subprocess
import tempfile
from pathlib import Path
import unittest
from check_docs_only import allowed, classify


class DocsOnlyTests(unittest.TestCase):
    def test_paths(self):
        for path in ['README.md', 'doc/tasks/a.json', 'doc/architecture/a.md', 'frontend/doc/a.png']:
            self.assertTrue(allowed(path), path)
        for path in ['AGENTS.md', 'doc/AGENTS.md', 'doc/ci/a.md', 'doc/workflow/a.md',
                     'doc/templates/a.md', '.agents/skills/a/SKILL.md', 'backend/main.go',
                     'frontend/package.json', 'doc/a.py', 'doc/.hidden/a.md', '.github/workflows/a.yml']:
            self.assertFalse(allowed(path), path)

    def test_complete_git_diff(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=root).decode().strip()
            git('init', '-q'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test')
            (root / 'README.md').write_text('base')
            git('add', '.'); git('commit', '-qm', 'base'); base = git('rev-parse', 'HEAD')
            self.assertEqual(classify(base, base, root)['classification'], 'REVIEW_REQUIRED')
            (root / 'README.md').write_text('docs')
            git('commit', '-qam', 'docs'); head = git('rev-parse', 'HEAD')
            self.assertEqual(classify(base, head, root)['classification'], 'DOCS_ONLY')
            (root / 'code.py').write_text('code')
            git('add', '.'); git('commit', '-qm', 'mixed')
            self.assertEqual(classify(base, git('rev-parse', 'HEAD'), root)['classification'], 'REVIEW_REQUIRED')
            mixed = git('rev-parse', 'HEAD')
            git('mv', 'code.py', 'code.md'); git('commit', '-qm', 'rename')
            self.assertIn('code.py', classify(mixed, git('rev-parse', 'HEAD'), root)['blocked'])
            (root / 'README.md').chmod(0o755)
            git('commit', '-qam', 'executable')
            self.assertIn('README.md', classify(base, git('rev-parse', 'HEAD'), root)['blocked'])
            (root / 'README.md').unlink(); (root / 'README.md').symlink_to('code.md')
            git('add', '.'); git('commit', '-qm', 'symlink')
            self.assertIn('README.md', classify(base, git('rev-parse', 'HEAD'), root)['blocked'])
            with self.assertRaises(subprocess.CalledProcessError):
                classify(git('rev-parse', 'HEAD'), head, root)


if __name__ == '__main__':
    unittest.main()
