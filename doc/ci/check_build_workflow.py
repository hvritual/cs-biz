#!/usr/bin/env python3
"""Offline structural contract for reusable Task Progression and Build Skill wiring.

This checker does not certify semantic intent preservation, true RED evidence,
Human approvals, business acceptance or remote CI.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
FILES = {
    ".agents/skills/sdlc-build/references/admission.md": ["reconcile", "admit_slice", "reconcile_failure", "close_slice", "handoff", "T0–T4"],
    ".agents/skills/sdlc-build/references/method.md": ["tdd", "preserve", "static", "existing_verified", "harness_required", "RED", "GREEN", "INCONCLUSIVE"],
    ".agents/skills/sdlc-build/SKILL.md": ["name: sdlc-build", "references/admission.md", "workflow.json"],
    "doc/ci/README.md": ["RISK-BASED-GATES.md", "--fast", "--full", "desktop:runtime"],
    "AGENTS.md": [".agents/skills/sdlc-build/SKILL.md", "doc/ci/RISK-BASED-GATES.md"],
}
def check(root=ROOT):
    problems = []
    for path, tokens in FILES.items():
        f = root / path
        if not f.is_file():
            problems.append(f"MISSING: {path}")
            continue
        source = f.read_text(encoding="utf-8")
        for token in tokens:
            if token.casefold() not in source.casefold():
                problems.append(f"MISSING_TOKEN: {path}: {token}")
    return problems

if __name__ == "__main__":
    errors = check()
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)
    print(f"PASS structural contract: {len(FILES)} files")
