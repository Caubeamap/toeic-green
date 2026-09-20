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

if command -v python3 >/dev/null 2>&1; then
  python_command=(python3)
elif command -v python >/dev/null 2>&1; then
  python_command=(python)
elif command -v python.exe >/dev/null 2>&1; then
  python_command=(python.exe)
elif command -v py.exe >/dev/null 2>&1; then
  python_command=(py.exe -3)
else
  printf 'FAIL: Python 3 is required for CloudFormation tests\n' >&2
  exit 1
fi

for test_file in "$TEST_DIR"/test-*.py; do
  printf '==> %s\n' "$(basename "$test_file")"
  if "${python_command[@]}" "$test_file"; then
    printf 'PASS %s\n' "$(basename "$test_file")"
  else
    printf 'FAIL %s\n' "$(basename "$test_file")" >&2
    failed=$((failed + 1))
  fi
done

printf '==> cfn-lint\n'
if command -v cfn-lint >/dev/null 2>&1; then
  cfn_lint_command=(cfn-lint)
elif command -v cfn-lint.exe >/dev/null 2>&1; then
  cfn_lint_command=(cfn-lint.exe)
else
  cfn_lint_command=()
fi

if (( ${#cfn_lint_command[@]} == 0 )); then
  printf 'SKIP cfn-lint (not installed)\n'
else
  template_path="$TEST_DIR/../cloudformation.yml"
  if [[ "${cfn_lint_command[0]}" == *.exe ]] && command -v wslpath >/dev/null 2>&1; then
    template_path="$(wslpath -w "$template_path")"
  fi
fi

if (( ${#cfn_lint_command[@]} > 0 )) && "${cfn_lint_command[@]}" "$template_path"; then
  printf 'PASS cfn-lint\n'
elif (( ${#cfn_lint_command[@]} > 0 )); then
  printf 'FAIL cfn-lint\n' >&2
  failed=$((failed + 1))
fi

if (( failed > 0 )); then
  printf '%d test file(s) failed\n' "$failed" >&2
  exit 1
fi
