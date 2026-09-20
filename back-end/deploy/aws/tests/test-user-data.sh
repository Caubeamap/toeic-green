#!/usr/bin/env bash
set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_TMP="$(mktemp -d)"
trap 'rm -rf "$TEST_TMP"' EXIT

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

if command -v python3 >/dev/null 2>&1; then
  python_command=(python3)
elif command -v python >/dev/null 2>&1; then
  python_command=(python)
elif command -v python.exe >/dev/null 2>&1; then
  python_command=(python.exe)
elif command -v py.exe >/dev/null 2>&1; then
  python_command=(py.exe -3)
else
  fail 'Python 3 is required to extract CloudFormation UserData'
fi

prepare_script() {
  local root="$1" output="$2"
  mkdir -p "$root/etc"
  : > "$root/etc/fstab"
  "${python_command[@]}" - "$TEST_DIR/test-cloudformation.py" "$output" "$root" <<'PY'
from pathlib import Path
import runpy
import sys

namespace = runpy.run_path(sys.argv[1])
template = namespace["TEMPLATE"]
resources = template["Resources"]
launch_template = resources.get("ApiLaunchTemplate")
if launch_template:
    user_data = launch_template["Properties"]["LaunchTemplateData"]["UserData"]["Fn::Base64"]["Fn::Sub"]
else:
    user_data = resources["ApiInstance"]["Properties"]["UserData"]["Fn::Base64"]["Fn::Sub"]

root = sys.argv[3].replace("\\", "/")
replacements = {
    "/opt/aws/bin/cfn-signal": "cfn-signal",
    "/usr/local/lib/docker/cli-plugins": root + "/usr/local/lib/docker/cli-plugins",
    "/opt/toeic-green": root + "/opt/toeic-green",
    "/swapfile": root + "/swapfile",
    "/etc/fstab": root + "/etc/fstab",
    "${AWS::StackName}": "test-stack",
    "${AWS::Region}": "ap-northeast-1",
    "${RepositoryUrl}": "https://github.com/Caubeamap/toeic-green.git",
    "${RepositoryBranch}": "main",
}
for original, replacement in replacements.items():
    user_data = user_data.replace(original, replacement)
Path(sys.argv[2]).write_text(user_data, encoding="utf-8", newline="\n")
PY
  chmod 0755 "$output"
}

stub_dir="$TEST_TMP/stubs"
mkdir -p "$stub_dir"
cat > "$stub_dir/command-stub" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail

command_name="$(basename "$0")"
printf '%s %s\n' "$command_name" "$*" >> "$STUB_STATE/commands.log"

case "$command_name" in
  dnf)
    [[ "${STUB_DNF_FAIL:-false}" == false ]] || exit 42
    ;;
  systemctl)
    ;;
  docker)
    if [[ "$*" == 'compose version --short' ]]; then
      printf '2.39.4\n'
    fi
    ;;
  curl)
    output=''
    while (( $# > 0 )); do
      if [[ "$1" == --output ]]; then
        shift
        output="$1"
      fi
      shift
    done
    [[ -n "$output" ]]
    printf 'verified compose fixture\n' > "$output"
    ;;
  sha256sum)
    checksum_input="$(cat)"
    [[ "$*" == -c\ - ]]
    [[ "$checksum_input" == *49082844b87f03cdcd5f5bbef1ba8c9c897b7a2dfb80cea18d61ec8ca6117e0c* ]]
    ;;
  fallocate)
    : > "${!#}"
    ;;
  mkswap)
    printf 'mkswap\n' >> "$STUB_STATE/mkswap.log"
    ;;
  swapon)
    if [[ "${1:-}" == --show=NAME ]]; then
      [[ -f "$STUB_STATE/swap-active" ]]
    else
      : > "$STUB_STATE/swap-active"
    fi
    ;;
  git)
    [[ "${1:-}" == clone ]]
    printf 'clone\n' >> "$STUB_STATE/git-clone.log"
    mkdir -p "${!#}/.git"
    ;;
  sleep)
    ;;
  cfn-signal)
    printf '%s\n' "$*" >> "$STUB_STATE/signals.log"
    ;;
  *)
    printf 'Unexpected stub command: %s\n' "$command_name" >&2
    exit 1
    ;;
esac
STUB
chmod 0755 "$stub_dir/command-stub"
for command_name in dnf systemctl docker curl sha256sum fallocate mkswap swapon git sleep cfn-signal; do
  ln -s command-stub "$stub_dir/$command_name"
done

success_root="$TEST_TMP/success-root"
success_state="$TEST_TMP/success-state"
success_script="$TEST_TMP/success-user-data.sh"
mkdir -p "$success_state"
prepare_script "$success_root" "$success_script"

for _ in 1 2; do
  PATH="$stub_dir:$PATH" STUB_STATE="$success_state" bash "$success_script"
done

[[ "$(grep -c -- '--exit-code 0' "$success_state/signals.log")" -eq 2 ]] || \
  fail 'successful bootstrap did not signal success on both runs'
[[ "$(wc -l < "$success_state/git-clone.log")" -eq 1 ]] || \
  fail 'repeated bootstrap cloned the repository more than once'
[[ "$(wc -l < "$success_state/mkswap.log")" -eq 1 ]] || \
  fail 'repeated bootstrap initialized swap more than once'
[[ "$(grep -Fxc "$success_root/swapfile none swap sw 0 0" "$success_root/etc/fstab")" -eq 1 ]] || \
  fail 'repeated bootstrap duplicated the swap fstab entry'

failure_root="$TEST_TMP/failure-root"
failure_state="$TEST_TMP/failure-state"
failure_script="$TEST_TMP/failure-user-data.sh"
mkdir -p "$failure_state"
prepare_script "$failure_root" "$failure_script"

set +e
PATH="$stub_dir:$PATH" STUB_STATE="$failure_state" STUB_DNF_FAIL=true \
  bash "$failure_script"
failure_status=$?
set -e

[[ "$failure_status" -eq 42 ]] || fail "bootstrap failure returned $failure_status instead of 42"
grep -Fq -- '--exit-code 42' "$failure_state/signals.log" || \
  fail 'failed bootstrap did not signal the failing exit code'
