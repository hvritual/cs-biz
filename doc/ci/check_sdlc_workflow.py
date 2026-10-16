#!/usr/bin/env python3
"""Read-only, fail-closed structural checks for the cs-biz SDLC adapters.

A successful check is NOT semantic correctness, authenticated human approval,
CI qualification or permission to change/merge/deploy code.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[2]
SKILLS = ("prompt-optimizer", "sdlc-design", "sdlc-build",
          "task-progression", "engineering-language", "sdlc-workflow", "b2b-product-ux",
          "intent-to-outcome-closure")
AUTH = ("read_only", "draft_only", "code_change", "external_action")
STAGES = ("intent", "design", "build")

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def child(base: Path, name: str) -> Path:
    if not isinstance(name, str) or not name or "\\" in name or "\x00" in name:
        raise ValueError("invalid artifact path")
    p = PurePosixPath(name)
    if p.is_absolute() or ".." in p.parts or ":" in name or name.startswith("~"):
        raise ValueError("path is not task-relative")
    dest = (base / name).resolve()
    if not dest.is_relative_to(base.resolve()):
        raise ValueError("artifact path escapes task")
    return dest

def obj(path: Path) -> dict:
    if not path.is_file() or path.stat().st_size > 200_000:
        raise ValueError("missing or oversized artifact: " + path.name)
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("artifact must be JSON object")
    return data

def structure(root: Path) -> list[str]:
    errors = []
    for skill in SKILLS:
        f = root / ".agents" / "skills" / skill / "SKILL.md"
        if not f.is_file():
            errors.append(f"missing skill: {skill}")
        elif not re.search(r"(?m)^name: " + re.escape(skill) + r"\s*$", f.read_text(encoding="utf-8")):
            errors.append(f"invalid frontmatter: {skill}")
    for name in ["AGENTS.md", "doc/workflow/project-profile.md",
                 "doc/ci/NO-STALL-GATES.md", "doc/templates/task.md",
                 "doc/workflow/INTENT-DESIGN-WORKFLOW.md",
                 "doc/workflow/DESIGN-HANDOFF-CONTRACT.md",
                 "doc/ci/check_design_workflow.py", "doc/ci/check_module_workflow.py",
                 "doc/workflow/MODULE-OUTCOME-CONTRACT.md"]:
        if not (root / name).is_file():
            errors.append(f"missing project authority: {name}")
    guide = root / "AGENTS.md"
    if guide.is_file():
        content = guide.read_text(encoding="utf-8")
        for name in ["sdlc-workflow", "prompt-optimizer", "sdlc-design", "sdlc-build",
                     "task-progression", "engineering-language", "b2b-product-ux",
                     "intent-to-outcome-closure"]:
            if name not in content:
                errors.append(f"AGENTS missing skill routing: {name}")
    return errors

def intent(task: Path) -> list[str]:
    issues = []
    spec = obj(task / "intent.json")
    if not isinstance(spec.get("objective"), str) or not spec["objective"].strip():
        issues.append("intent objective missing")
    if not isinstance(spec.get("original_request"), str) or not spec["original_request"].strip():
        issues.append("raw user request missing")
    if spec.get("authorization") not in AUTH:
        issues.append("invalid authorization")
    if not isinstance(spec.get("hard_constraints"), list):
        issues.append("hard constraints not explicitly listed")
    decisions = spec.get("unresolved_decisions", [])
    if not isinstance(decisions, list):
        issues.append("invalid unresolved decisions")
    elif decisions:
        issues.append("material decisions not resolved")
    if spec.get("decision") != "READY":
        issues.append("intent not READY for review")
    if spec.get("authorization") == "external_action":
        issues.append("external action needs separate authorization beyond intent")
    # No human approval is authenticated here.
    return issues

def design(task: Path) -> list[str]:
    issues = intent(task)
    p = obj(task / "design-preview.json")
    if p.get("intent_sha256") != sha(task / "intent.json"):
        issues.append("preview bound to stale intent")
    assets = p.get("assets", {})
    if not isinstance(assets, dict) or not assets:
        issues.append("preview assets missing")
    else:
        for name in ("journey.md", "flow.mmd", "demo.html"):
            try:
                a = child(task, name)
                if not a.is_file() or assets.get(name) != sha(a):
                    issues.append(f"preview asset missing/stale: {name}")
                if name.endswith(".mmd") and a.is_file() and "flowchart" not in a.read_text(encoding="utf-8"):
                    issues.append("flowchart missing")
            except (ValueError, OSError):
                issues.append(f"illegal preview asset: {name}")
    rev = p.get("revisions", [])
    if not isinstance(rev, list):
        issues.append("invalid revision manifest")
    else:
        seen = set()
        for row in rev:
            if not isinstance(row, dict) or row.get("round") in seen or not row.get("round"):
                issues.append("invalid or duplicate revision")
                continue
            seen.add(row["round"])
            for name, expected in row.get("sealed_assets", {}).items():
                try:
                    f = child(task, name)
                    if not f.is_file() or sha(f) != expected:
                        issues.append(f"sealed revision changed: {name}")
                except (ValueError, OSError):
                    issues.append(f"invalid revision path: {name}")
            if not row.get("feedback_ref") or not row.get("change_contract_ref"):
                issues.append("revision lacks feedback/change contract")
    r = obj(task / "design-approval.json")
    for name in ("requirements.md", "design.md"):
        path = child(task, name)
        if not path.is_file() or r.get("artifacts", {}).get(name) != sha(path):
            issues.append(f"approved design artifact stale: {name}")
    if r.get("preview_sha256") != sha(task / "design-preview.json"):
        issues.append("design approval stale preview")
    if not r.get("human_record_ref") or not r.get("reviewer"):
        issues.append("no human approval reference (still untrusted)")
    return issues

def build(task: Path) -> list[str]:
    issues = design(task)
    build_manifest = obj(task / "build-manifest.json")
    if build_manifest.get("design_approval_sha256") != sha(task / "design-approval.json"):
        issues.append("build bound to stale design")
    candidate = build_manifest.get("candidate_sha")
    if not isinstance(candidate, str) or not re.fullmatch("[0-9a-f]{40}", candidate):
        issues.append("no exact candidate SHA")
    slices = build_manifest.get("slices")
    if not isinstance(slices, list) or not slices:
        issues.append("no Build slices")
    else:
        for s in slices:
            if not isinstance(s, dict):
                issues.append("invalid slice"); continue
            if s.get("mode") not in {"tdd","preserve","static","existing_verified","harness_required"}:
                issues.append("invalid Build mode")
            if not s.get("acceptance_ids"):
                issues.append("slice missing acceptance IDs")
            if not s.get("evidence_refs"):
                issues.append("slice without evidence")
            if s.get("status") in ("passed", "complete") and not s.get("independent_review_ref"):
                issues.append("self-approved slice prohibited")
    # CI cannot be authenticated from this local JSON; host must verify external status.
    return issues

def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", required=True, choices=("structure",) + STAGES)
    ap.add_argument("--task", type=Path)
    ap.add_argument("--repo-root", type=Path, default=ROOT)
    args = ap.parse_args(argv)
    issues = []
    try:
        issues = structure(args.repo_root)
        if args.mode != "structure":
            if args.task is None:
                issues.append("--task required")
            else:
                task = args.task.resolve()
                if not task.is_dir():
                    issues.append("task directory missing")
                else:
                    issues += {"intent": intent, "design": design, "build": build}[args.mode](task)
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as e:
        issues.append(str(e))
    print(json.dumps({"static_contract": "FAIL" if issues else "PASS_STATIC_ONLY",
                      "authentic_approval": "NOT_VERIFIED", "remote_ci": "NOT_VERIFIED",
                      "issues": issues}, ensure_ascii=False, indent=2))
    return 2 if issues else 0

if __name__ == "__main__":
    sys.exit(main())
