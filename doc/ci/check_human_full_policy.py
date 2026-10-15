#!/usr/bin/env python3
"""Fail-closed static checks for the retained optional manual Full endpoint.

Automatic risk-based quality is governed by check_quality_policy.py; these
checks retain manual dispatch/receipt safety and the local Fast default.

No actual Human identity, Environment reviewer setting or GitHub ruleset can be
attested by a repository file. This is a source-safety checker, NOT a merge permit.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys

FULL = ".github/workflows/frontend-full.yml"
CHECK = "doc/ci/check.sh"
PACKAGE = "frontend/package.json"
AUTO = [
    ".github/workflows/frontend.yml",
    ".github/workflows/frontend-targeted.yml",
    ".github/workflows/backend.yml",
    ".github/workflows/repository.yml",
    ".github/workflows/sdlc-skills.yml",
]
BANNED = (
    "corepack pnpm check:full",
    "pnpm check:full",
    "bash doc/ci/check.sh --full",
)

def workflow_triggers(content: str) -> list[str]:
    # Existing workflows use the standard block-style 'on:' (not YAML aliases).
    # Unexpected formatting fails closed; no untrusted parse fallback.
    start = re.search(r"(?m)^on:\s*$", content)
    if not start:
        raise ValueError("workflow event block missing/unsupported")
    rest = content[start.end():]
    end = re.search(r"(?m)^\S", rest)
    if end is None:
        raise ValueError("workflow event block lacks an end")
    block = rest[:end.start()]
    result = re.findall(r"(?m)^  ([A-Za-z_]+):", block)
    if not result:
        raise ValueError("no workflow events recognized")
    return result

def check(root: Path) -> list[str]:
    errors = []
    def read(name: str) -> str:
        return (root / name).read_text(encoding="utf-8")

    try:
        full = read(FULL)
        trigger = workflow_triggers(full)
        if trigger != ["workflow_dispatch"]:
            errors.append("FULL_NOT_MANUAL_ONLY:" + ",".join(trigger))
        needed = [
            "pr_number:", "candidate_sha:",
            "github.event.sender.type == 'User'",
            "github.ref == 'refs/heads/main'",
            "environment: full-ci-human-approval",
            "manual_full_dispatch.py preflight",
            "manual_full_dispatch.py receipt",
            "needs: frontend-validation",
            "refs/pull/",
            "corepack pnpm check:full",
            "frontend-manual-full-receipt-",
        ]
        for token in needed:
            if token not in full:
                errors.append("FULL_MISSING_CONTRACT:" + token)
        if "cancel-in-progress: true" in full:
            errors.append("HUMAN_RUN_CAN_BE_CANCELLED_AUTOMATICALLY")
        # Scan every workflow, including future files. A new automatic workflow
        # cannot bypass Human-only control by choosing an unknown filename.
        workflow_dir = root / ".github" / "workflows"
        files = sorted([*workflow_dir.glob("*.yml"), *workflow_dir.glob("*.yaml")])
        if not files:
            errors.append("NO_WORKFLOWS")
        for file in files:
            name = file.relative_to(root).as_posix()
            if name == FULL:
                continue
            content = read(name)
            for command in BANNED:
                if re.search(r"(?m)^\s*(?:-\s*)?run:\s*.*" + re.escape(command), content) or (
                    re.search(r"(?m)^\s+" + re.escape(command), content)
                ):
                    errors.append("OTHER_WORKFLOW_RUNS_FULL:" + name)
        s = read(CHECK)
        if 'mode="${1:---fast}"' not in s:
            errors.append("ROOT_DEFAULT_NOT_FAST")
        pkg = json.loads(read(PACKAGE))
        scripts = pkg.get("scripts", {})
        if scripts.get("check") != "pnpm check:fast":
            errors.append("FRONTEND_DEFAULT_NOT_FAST")
        if "pnpm check:fast" not in scripts.get("check:full","") or "pnpm test:e2e" not in scripts.get("check:full",""):
            errors.append("FULL_MUST_STILL_MEAN_REAL_FULL")
        if "pnpm test:e2e" in scripts.get("check:fast", ""):
            errors.append("FAST_MUST_NOT_INCLUDE_FULL_E2E")
    except (OSError,ValueError,TypeError,KeyError) as exc:
        errors.append("POLICY_SOURCE_UNREADABLE:" + str(exc))
    return errors

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    issues = check(args.repo_root)
    print(json.dumps({
        "static_source_control": "PASS_STATIC_ONLY" if not issues else "BLOCKED",
        "issues": issues,
        "human_environment_configured": "NOT_VERIFIED",
        "branch_protection_configured": "NOT_VERIFIED",
        "github_full_receipt_verified": "NOT_VERIFIED"
    }, ensure_ascii=False))
    return 2 if issues else 0

if __name__ == "__main__":
    sys.exit(main())
