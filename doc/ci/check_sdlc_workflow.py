#!/usr/bin/env python3
"""Read-only structure checks for the current cs-biz workflow entrypoints.

A successful check is NOT semantic correctness, authenticated human approval,
CI qualification or permission to change/merge/deploy code.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKILLS = ("sdlc-design", "sdlc-build", "sdlc-deploy", "sdlc-workflow", "intent-to-outcome-closure")

def structure(root: Path) -> list[str]:
    errors = []
    for skill in SKILLS:
        f = root / ".agents" / "skills" / skill / "SKILL.md"
        if not f.is_file():
            errors.append(f"missing skill: {skill}")
        elif not re.search(r"(?m)^name: " + re.escape(skill) + r"\s*$", f.read_text(encoding="utf-8")):
            errors.append(f"invalid frontmatter: {skill}")
    for name in ["AGENTS.md", "doc/README.md", "doc/roadmap.md", "doc/templates/task.md",
                 "doc/workflow/SDLC-ADOPTION.md", "doc/ci/RISK-BASED-GATES.md",
                 ".agents/skills/sdlc-design/references/intent-design-v2.md",
                 ".agents/skills/sdlc-design/references/design-handoff-v2.md",
                 ".agents/skills/sdlc-workflow/references/module-outcome-v1.md",
                 "doc/ci/check_design_workflow.py", "doc/ci/check_module_workflow.py",
                 ".agents/skills/sdlc-workflow/references/current-protocols.md"]:
        if not (root / name).is_file():
            errors.append(f"missing project authority: {name}")
    guide = root / "AGENTS.md"
    if guide.is_file():
        content = guide.read_text(encoding="utf-8")
        for name in SKILLS:
            if name not in content:
                errors.append(f"AGENTS missing skill routing: {name}")
    return errors

def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", required=True, choices=("structure",))
    ap.add_argument("--repo-root", type=Path, default=ROOT)
    args = ap.parse_args(argv)
    issues = []
    try:
        issues = structure(args.repo_root)
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as e:
        issues.append(str(e))
    print(json.dumps({"static_contract": "FAIL" if issues else "PASS_STATIC_ONLY",
                      "authentic_approval": "NOT_VERIFIED", "remote_ci": "NOT_VERIFIED",
                      "issues": issues}, ensure_ascii=False, indent=2))
    return 2 if issues else 0

if __name__ == "__main__":
    sys.exit(main())
