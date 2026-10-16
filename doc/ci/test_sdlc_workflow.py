#!/usr/bin/env python3
"""Keep current structure admission; reject retired compatibility modes."""
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SPEC = importlib.util.spec_from_file_location("sdlc_check", HERE / "check_sdlc_workflow.py")
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)


class WorkflowContractTests(unittest.TestCase):
    def test_current_repository_structure(self):
        self.assertEqual(checker.structure(ROOT), [])

    def test_missing_current_authorities_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            errors = checker.structure(Path(directory))
        for authority in ("missing skill: sdlc-design", "intent-design-v2.md", "current-protocols.md"):
            self.assertTrue(any(authority in error for error in errors), authority)

    def test_retired_modes_cannot_admit_new_work(self):
        for mode in ("intent", "design", "build"):
            with self.subTest(mode=mode):
                result = subprocess.run(
                    [sys.executable, str(HERE / "check_sdlc_workflow.py"), "--mode", mode],
                    capture_output=True, text=True, check=False,
                )
                self.assertEqual(result.returncode, 2)
                self.assertIn("invalid choice", result.stderr)


if __name__ == "__main__":
    unittest.main()
