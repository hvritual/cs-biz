#!/usr/bin/env python3
"""Check the current repository layout and simple relative Markdown file links.

Python 3.10+, standard library only. This is not a runtime/application gate.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[2]
REQUIRED_DIRECTORIES = (
    "frontend", "frontend/deploy", "frontend/ci", "frontend/doc",
    "backend", "backend/deploy", "backend/ci", "backend/doc",
    "doc", "doc/ci", "doc/architecture", "doc/contracts", "doc/product",
    "doc/journeys", "doc/templates", "doc/tasks", "doc/research", "doc/evidence",
)
REQUIRED_FILES = (
    "README.md", "AGENTS.md", ".github/workflows/repository.yml",
    "frontend/README.md", "frontend/deploy/README.md", "frontend/ci/README.md",
    "frontend/doc/README.md", "backend/README.md", "backend/deploy/README.md",
    "backend/ci/README.md", "backend/doc/README.md", "doc/README.md",
    "doc/architecture/README.md", "doc/architecture/repository-layout.md",
    "doc/architecture/adr/0001-frontend.md", "doc/product/scope.md",
    "doc/contracts/README.md", "doc/contracts/access-context.md",
    "doc/journeys/README.md", "doc/journeys/SAAS-01-tenant-onboarding.md",
    "doc/templates/task.md", "doc/tasks/README.md", "doc/roadmap.md",
    "doc/research/vue-admin-selection.md", "doc/ci/README.md",
    "doc/evidence/README.md", "doc/evidence/sources-2026-10-12.json",
)
IGNORED = {".git", "node_modules", "dist", ".venv", "__pycache__", ".artifacts"}
# The repository uses ordinary inline links, without whitespace in destinations.
LINK = re.compile(r"!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+\"[^\"]*\")?\)")
FENCE = re.compile(r"(?ms)^```[^\n]*\n.*?^```\s*$")


def check(root: Path) -> tuple[list[str], int]:
    errors: list[str] = []
    for rel in REQUIRED_DIRECTORIES:
        path = root / rel
        if not path.is_dir() or path.is_symlink():
            errors.append(f"required directory missing or symlinked: {rel}")
    for rel in REQUIRED_FILES:
        path = root / rel
        if not path.is_file() or path.is_symlink():
            errors.append(f"required file missing or symlinked: {rel}")
            continue
        if not path.read_text(encoding="utf-8").strip():
            errors.append(f"required file empty: {rel}")

    source_path = root / "doc/evidence/sources-2026-10-12.json"
    if source_path.is_file():
        try:
            data = json.loads(source_path.read_text(encoding="utf-8"))
            if data.get("target", {}).get("repository") != "hvritual/cs-biz":
                errors.append("source record must identify hvritual/cs-biz")
            candidates = data.get("candidates", [])
            if not isinstance(candidates, list) or len(candidates) < 3:
                errors.append("source record must include at least three candidates")
            else:
                for candidate in candidates:
                    if not isinstance(candidate, dict) or not re.fullmatch(
                        r"[0-9a-f]{40}", str(candidate.get("observed_commit", ""))
                    ):
                        errors.append("candidate source is missing a full observed commit")
        except (ValueError, TypeError, AttributeError) as exc:
            errors.append(f"invalid source JSON: {exc}")

    link_count = 0
    for doc in sorted(root.rglob("*.md")):
        if any(part in IGNORED for part in doc.relative_to(root).parts):
            continue
        if doc.is_symlink():
            errors.append(f"Markdown symlink not supported: {doc.relative_to(root)}")
            continue
        body = FENCE.sub("", doc.read_text(encoding="utf-8"))
        for match in LINK.finditer(body):
            destination = urlsplit(match.group(1).strip("<>"))
            if destination.scheme or destination.netloc or not destination.path:
                continue
            link_count += 1
            target = (doc.parent / unquote(destination.path)).resolve()
            if not target.is_relative_to(root) or not target.exists():
                errors.append(
                    f"broken or out-of-repository link: {doc.relative_to(root)}"
                    f" -> {match.group(1)}"
                )
    return errors, link_count


def main() -> int:
    try:
        errors, link_count = check(ROOT)
    except (OSError, UnicodeError, ValueError) as exc:
        print(f"FAIL: repository cannot be checked: {exc}", file=sys.stderr)
        return 1
    if errors:
        print("FAIL: repository structure and documentation", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(
        f"PASS: {len(REQUIRED_DIRECTORIES)} required directories, "
        f"{len(REQUIRED_FILES)} required files, {link_count} relative file links"
    )
    print("Scope: repository structure and documentation only; no application/runtime validation.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
