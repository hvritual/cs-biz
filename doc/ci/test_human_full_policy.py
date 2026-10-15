#!/usr/bin/env python3
"""Negative fixtures for Human-only Full CI source protections."""
from pathlib import Path
import shutil
import tempfile
import unittest
from check_human_full_policy import FULL, AUTO, CHECK, PACKAGE, check

HERE = Path(__file__).resolve().parents[2]

class HumanFullPolicyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for rel in [FULL, CHECK, PACKAGE, *AUTO]:
            target = self.root / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(HERE / rel, target)
    def tearDown(self):
        self.temp.cleanup()
    def mutate(self, rel, from_, to):
        f = self.root / rel
        raw = f.read_text(encoding="utf-8")
        self.assertIn(from_, raw)
        f.write_text(raw.replace(from_,to,1),encoding="utf-8")
    def expect(self, name):
        problems=check(self.root)
        self.assertTrue(any(name in p for p in problems),problems)

    def test_actual_baseline(self):
        self.assertEqual(check(self.root), [])

    def test_pr_automatic_trigger_fails(self):
        self.mutate(FULL, "on:\n  workflow_dispatch:","on:\n  pull_request:\n  workflow_dispatch:")
        self.expect("FULL_NOT_MANUAL_ONLY")

    def test_workflow_call_trigger_fails(self):
        self.mutate(FULL, "on:\n  workflow_dispatch:","on:\n  workflow_call:\n  workflow_dispatch:")
        self.expect("FULL_NOT_MANUAL_ONLY")

    def test_schedule_trigger_fails(self):
        self.mutate(FULL, "on:\n  workflow_dispatch:","on:\n  schedule:\n  workflow_dispatch:")
        self.expect("FULL_NOT_MANUAL_ONLY")

    def test_auto_fast_workflow_cannot_call_full(self):
        self.mutate(AUTO[0], "corepack pnpm check:fast","corepack pnpm check:full")
        self.expect("OTHER_WORKFLOW_RUNS_FULL")

    def test_new_workflow_automatically_runs_full_fails(self):
        new = self.root / ".github/workflows/unregistered.yml"
        new.write_text("name: New workflow\non:\n  push:\njobs:\n  wrong:\n    runs-on: ubuntu-latest\n    steps:\n      - run: corepack pnpm check:full\n", encoding="utf-8")
        self.expect("OTHER_WORKFLOW_RUNS_FULL")

    def test_missing_manual_receipt_fails(self):
        self.mutate(FULL, "manual_full_dispatch.py receipt","echo receipt success")
        self.expect("FULL_MISSING_CONTRACT")

    def test_missing_human_environment_fails(self):
        self.mutate(FULL, "environment: full-ci-human-approval","environment: unsecured")
        self.expect("FULL_MISSING_CONTRACT")

    def test_default_frontend_check_must_not_be_full(self):
        self.mutate(PACKAGE, '"check": "pnpm check:fast"', '"check": "pnpm check:full"')
        self.expect("FRONTEND_DEFAULT_NOT_FAST")

    def test_default_root_check_must_not_be_full(self):
        self.mutate(CHECK, 'mode="${1:---fast}"', 'mode="${1:---full}"')
        self.expect("ROOT_DEFAULT_NOT_FAST")

    def test_full_still_runs_real_e2e(self):
        self.mutate(PACKAGE, '"check:full": "pnpm check:fast && pnpm build && pnpm test:e2e"',
                    '"check:full": "pnpm check:fast && pnpm build"')
        self.expect("FULL_MUST_STILL_MEAN_REAL_FULL")

    def test_non_block_style_trigger_fails_closed(self):
        self.mutate(FULL, "on:\n  workflow_dispatch:", "on: [workflow_dispatch]")
        self.expect("POLICY_SOURCE_UNREADABLE")

if __name__ == "__main__":
    unittest.main()
