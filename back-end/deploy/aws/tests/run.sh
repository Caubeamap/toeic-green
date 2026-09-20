#!/usr/bin/env bash
set -uo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

failed=0
for test_file in "$TEST_DIR"/test-*.sh; do
  printf '==> %s\n' "$(basename "$test_file")"
  if bash "$test_file"; then
    printf 'PASS %s\n' "$(basename "$test_file")"
  else
    printf 'FAIL %s\n' "$(basename "$test_file")" >&2
    failed=$((failed + 1))
  fi
done

if (( failed > 0 )); then
  printf '%d test file(s) failed\n' "$failed" >&2
  exit 1
fi
