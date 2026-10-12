#!/usr/bin/env bash
set -euo pipefail

task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
python3 "$task_root/doc/ci/check_repository.py"
(
  cd "$task_root/frontend"
  corepack pnpm check
)
