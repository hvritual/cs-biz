#!/usr/bin/env python3
"""Offline structural contract for reusable Task Progression and Build Skill wiring.

This checker does not certify semantic intent preservation, true RED evidence,
Human approvals, business acceptance or remote CI.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
FILES = {
    ".agents/skills/task-progression/SKILL.md": ["name: task-progression", "reconcile", "admit_slice", "close_slice", "handoff", "T4"],
    ".agents/skills/sdlc-build/SKILL.md": ["name: sdlc-build", "task-progression", "tdd", "preserve", "static", "existing_verified", "harness_required", "RED", "GREEN", "INCONCLUSIVE"],
    "doc/workflow/project-profile.md": ["AGENTS.md", "NO-STALL-GATES.md", "--fast", "--full", "desktop:runtime"],
    "doc/workflow/build-loop-pilot.md": ["scope reduction", "Older", "Fast", "Mock"],
    "AGENTS.md": [".agents/skills/sdlc-build/SKILL.md", ".agents/skills/task-progression/SKILL.md"],
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
