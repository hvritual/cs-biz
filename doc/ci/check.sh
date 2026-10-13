#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
mode="${1:---full}"

case "$mode" in
  --fast|--full|--desktop) ;;
  *) echo "Usage: bash doc/ci/check.sh [--fast|--full|--desktop]" >&2; exit 2 ;;
esac

python3 "$root/doc/ci/check_repository.py"
(
  cd "$root/frontend"
  case "$mode" in
    --fast) corepack pnpm check:fast ;;
    --full) corepack pnpm check:full ;;
    --desktop) corepack pnpm check:desktop:runtime ;;
  esac
)
