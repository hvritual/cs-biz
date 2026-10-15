#!/usr/bin/env python3
"""Verify a Human-dispatched Frontend Full qualification against a live PR head.

This runs from the trusted default-branch workflow, NOT candidate source code.
It verifies GitHub provenance and exact SHA; environment required reviewers
must be configured separately by a repository admin.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.request import Request, urlopen

HEX40 = re.compile(r"[0-9a-f]{40}\Z")
REPOSITORY = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\Z")


def validate_event(event: dict, *, repository: str, actor: str,
                   event_name: str, default_branch: str) -> tuple[int, str]:
    if event_name != "workflow_dispatch":
        raise ValueError("Full CI must be started via workflow_dispatch")
    sender = event.get("sender") or {}
    if sender.get("type") != "User" or sender.get("login") != actor or not actor:
        raise ValueError("Human GitHub sender required; bot/unknown dispatch rejected")
    if not REPOSITORY.fullmatch(repository):
        raise ValueError("invalid repository")
    if default_branch != "main":
        raise ValueError("expected protected main as workflow authority")
    data = event.get("inputs") or {}
    try:
        number = int(str(data.get("pr_number", "")))
    except ValueError as exc:
        raise ValueError("invalid PR number") from exc
    if number <= 0 or number > 1_000_000_000:
        raise ValueError("PR number out of range")
    sha = str(data.get("candidate_sha", "")).strip()
    if not HEX40.fullmatch(sha):
        raise ValueError("candidate SHA must be a full 40-character lowercase hex")
    return number, sha


def validate_pr(pr: dict, *, repository: str, number: int, sha: str,
                default_branch: str) -> dict:
    if pr.get("number") != number or pr.get("state") != "open" or pr.get("draft"):
        raise ValueError("PR is not open or is still draft")
    base = pr.get("base") or {}
    if base.get("ref") != default_branch or (base.get("repo") or {}).get("full_name") != repository:
        raise ValueError("PR base must be main in this repository")
    head = pr.get("head") or {}
    if head.get("sha") != sha:
        raise ValueError("STALE_CANDIDATE: PR head no longer matches Human selected SHA")
    head_repo = (head.get("repo") or {}).get("full_name")
    if not head_repo:
        raise ValueError("PR head repository missing")
    return {"pr_number": number, "candidate_sha": sha,
            "base_sha": base.get("sha"), "head_repository": head_repo}


def fetch_pr(repository: str, number: int, token: str) -> dict:
    if not token:
        raise ValueError("GITHUB_TOKEN missing; cannot validate PR")
    req = Request(
        f"https://api.github.com/repos/{repository}/pulls/{number}",
        headers={"Accept": "application/vnd.github+json",
                 "Authorization": "Bearer " + token,
                 "X-GitHub-Api-Version": "2022-11-28"},
    )
    with urlopen(req, timeout=15) as response:
        return json.load(response)


def checkout_sha(path: Path) -> str:
    proc = subprocess.run(
        ["git", "-C", str(path), "rev-parse", "--verify", "HEAD"],
        text=True, capture_output=True, timeout=15, check=True,
    )
    return proc.stdout.strip()


def main() -> int:
    cli = argparse.ArgumentParser()
    cli.add_argument("phase", choices=("preflight", "receipt"))
    cli.add_argument("--candidate-dir", type=Path)
    cli.add_argument("--output", type=Path)
    args = cli.parse_args()
    try:
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
        repo = os.environ["GITHUB_REPOSITORY"]
        actor = os.environ["GITHUB_ACTOR"]
        name = os.environ["GITHUB_EVENT_NAME"]
        branch = os.environ.get("GITHUB_DEFAULT_BRANCH", "main")
        number, sha = validate_event(event, repository=repo, actor=actor,
                                     event_name=name, default_branch=branch)
        bound = validate_pr(fetch_pr(repo, number, os.environ.get("GH_TOKEN", "")),
                            repository=repo, number=number, sha=sha, default_branch=branch)
        if args.phase == "receipt":
            if args.candidate_dir is None or args.output is None:
                raise ValueError("receipt requires --candidate-dir and --output")
            if checkout_sha(args.candidate_dir) != sha:
                raise ValueError("CHECKOUT_MISMATCH: tested commit differs from requested SHA")
            receipt = {
                "schema": "cs-biz-human-full-v1",
                "repository": repo,
                **bound,
                "human_trigger_actor": actor,
                "event": "workflow_dispatch",
                "workflow_ref": os.environ.get("GITHUB_WORKFLOW_REF", ""),
                "run_id": os.environ["GITHUB_RUN_ID"],
                "run_attempt": os.environ["GITHUB_RUN_ATTEMPT"],
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "qualification": "full-tests-command-completed-pr-head-revalidated",
            }
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n",
                                   encoding="utf-8")
            print("PASS: frozen PR SHA bound to successful manual Full command; receipt written")
        else:
            print(f"PASS: Human {actor} requested PR #{number} at exact SHA {sha}")
        return 0
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
