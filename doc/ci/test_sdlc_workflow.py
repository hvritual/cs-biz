#!/usr/bin/env python3
import importlib.util
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("sdlc_check", HERE / "check_sdlc_workflow.py")
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)

class WorkflowContractTests(unittest.TestCase):
    def test_reject_absolute(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError): checker.child(Path(d), "/etc/passwd")

    def test_reject_traversal(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError): checker.child(Path(d), "../outside")

    def test_absent_intent(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError): checker.intent(Path(d))

    def test_unresolved_decision(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "intent.json"
            p.write_text('{"objective":"o","original_request":"o","authorization":"draft_only","hard_constraints":[],"unresolved_decisions":["policy"],"decision":"READY"}')
            self.assertIn("material decisions not resolved", checker.intent(Path(d)))

    def test_external_needs_separate_permission(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "intent.json"
            p.write_text('{"objective":"o","original_request":"o","authorization":"external_action","hard_constraints":[],"unresolved_decisions":[],"decision":"READY"}')
            self.assertTrue(any("separate authorization" in s for s in checker.intent(Path(d))))

    def test_positive_intent_is_only_static(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "intent.json"
            p.write_text('{"objective":"o","original_request":"o","authorization":"draft_only","hard_constraints":[],"unresolved_decisions":[],"decision":"READY"}')
            self.assertEqual(checker.intent(Path(d)), [])

    def test_stale_preview(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "intent.json").write_text('{"objective":"o","original_request":"o","authorization":"draft_only","hard_constraints":[],"unresolved_decisions":[],"decision":"READY"}')
            (root / "design-preview.json").write_text('{"intent_sha256":"bad","assets":{},"revisions":[]}')
            (root / "design-approval.json").write_text('{"artifacts":{},"preview_sha256":"bad"}')
            self.assertIn("preview bound to stale intent", checker.design(root))

if __name__ == "__main__":
    unittest.main()
