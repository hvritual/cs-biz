#!/usr/bin/env python3
from pathlib import Path
import tempfile
import unittest
from check_build_workflow import FILES, check

class WorkflowCheckerTests(unittest.TestCase):
    def fill(self, root):
        for name, tokens in FILES.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("\n".join(tokens), encoding="utf-8")

    def test_full_fixture(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.fill(root)
            self.assertEqual(check(root), [])

    def test_missing_skill_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.fill(root)
            (root / ".agents/skills/sdlc-build/SKILL.md").unlink()
            self.assertTrue(any("MISSING:" in p for p in check(root)))

    def test_missing_integration_hook_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.fill(root)
            (root / "AGENTS.md").write_text("unrelated", encoding="utf-8")
            self.assertTrue(any("MISSING_TOKEN:" in p for p in check(root)))

if __name__ == "__main__":
    unittest.main()
