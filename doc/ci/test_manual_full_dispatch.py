#!/usr/bin/env python3
"""Regression fixtures for Human Full CI dispatch authentication and PR binding."""
import importlib.util
from pathlib import Path
import unittest

MODULE = Path(__file__).with_name("manual_full_dispatch.py")
spec = importlib.util.spec_from_file_location("manual_full_dispatch", MODULE)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def event(sha="a" * 40, sender_type="User", actor="alice"):
    return {"sender": {"login": actor, "type": sender_type},
            "inputs": {"pr_number": "42", "candidate_sha": sha}}


def pr(sha="a" * 40, draft=False, state="open", base_ref="main"):
    return {"number": 42, "state": state, "draft": draft,
            "head": {"sha": sha, "repo": {"full_name": "hvritual/cs-biz"}},
            "base": {"ref": base_ref, "sha": "b" * 40,
                     "repo": {"full_name": "hvritual/cs-biz"}}}


class ManualFullDispatchTests(unittest.TestCase):
    def check_event(self, value=None, **kwargs):
        return gate.validate_event(value or event(), repository="hvritual/cs-biz",
                                   actor="alice", event_name=kwargs.get("event_name", "workflow_dispatch"),
                                   default_branch="main")

    def test_valid_human_event(self):
        self.assertEqual(self.check_event(), (42, "a" * 40))

    def test_push_cannot_dispatch(self):
        with self.assertRaisesRegex(ValueError, "workflow_dispatch"):
            self.check_event(event_name="push")

    def test_bot_sender_rejected(self):
        with self.assertRaisesRegex(ValueError, "Human"):
            self.check_event(event(sender_type="Bot"))

    def test_sender_login_mismatch_rejected(self):
        with self.assertRaisesRegex(ValueError, "Human"):
            self.check_event(event(actor="bot-account"))

    def test_short_sha_rejected(self):
        with self.assertRaisesRegex(ValueError, "40-character"):
            self.check_event(event(sha="abcd"))

    def test_invalid_pr_number_rejected(self):
        e=event();e["inputs"]["pr_number"]="not-number"
        with self.assertRaisesRegex(ValueError,"PR number"):
            self.check_event(e)

    def test_valid_bound_pr(self):
        self.assertEqual(gate.validate_pr(pr(), repository="hvritual/cs-biz", number=42,
                      sha="a"*40, default_branch="main")["candidate_sha"], "a"*40)

    def test_stale_pr_head_rejected(self):
        with self.assertRaisesRegex(ValueError,"STALE_CANDIDATE"):
            gate.validate_pr(pr(sha="f"*40), repository="hvritual/cs-biz",
                             number=42, sha="a"*40, default_branch="main")

    def test_draft_pr_rejected(self):
        with self.assertRaisesRegex(ValueError,"not open"):
            gate.validate_pr(pr(draft=True), repository="hvritual/cs-biz",
                             number=42, sha="a"*40, default_branch="main")

    def test_closed_pr_rejected(self):
        with self.assertRaisesRegex(ValueError,"not open"):
            gate.validate_pr(pr(state="closed"), repository="hvritual/cs-biz",
                             number=42, sha="a"*40, default_branch="main")

    def test_other_base_rejected(self):
        with self.assertRaisesRegex(ValueError,"base"):
            gate.validate_pr(pr(base_ref="develop"), repository="hvritual/cs-biz",
                             number=42, sha="a"*40, default_branch="main")

    def test_other_repo_base_rejected(self):
        example=pr()
        example["base"]["repo"]["full_name"]="someone/else"
        with self.assertRaisesRegex(ValueError,"base"):
            gate.validate_pr(example, repository="hvritual/cs-biz",
                             number=42, sha="a"*40, default_branch="main")


if __name__ == "__main__":
    unittest.main()
