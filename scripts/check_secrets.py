"""Limited tracked-content credential checks; no match values are printed."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKEN = re.compile(
    r"gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}"
    r"|AKIA[0-9A-Z]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}"
)
PRIVATE_KEY = re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")
URL_PASSWORD = re.compile(r"://[^\s/:]+:([^\s@]+)@")
ASSIGNMENT = re.compile(
    r"(?i)(?:api[_-]?key|client[_-]?secret|password|token)[\"']?\s*[:=]\s*[\"']?([^\s\"',}]+)"
)
PLACEHOLDERS = {
    "demo-local-only",
    "${POSTGRES_PASSWORD:-demo-local-only}",
    "${POSTGRES_PASSWORD:-demo-local-only",
}


def find_issues(content: str) -> list[str]:
    issues: list[str] = []
    if TOKEN.search(content):
        issues.append("credential-token-pattern")
    if PRIVATE_KEY.search(content):
        issues.append("private-key-header")
    for match in URL_PASSWORD.finditer(content):
        value = match.group(1)
        if value not in PLACEHOLDERS and "${" not in value:
            issues.append("non-placeholder-url-password")
    for match in ASSIGNMENT.finditer(content):
        value = match.group(1)
        if (
            len(value) >= 12
            and value not in PLACEHOLDERS
            and not value.startswith(("${", "$", "{", "[", 'r"'))
        ):
            # Only high-entropy-looking literals; ordinary documentation identifiers aren't secrets.
            if (
                re.search(r"[A-Z]", value)
                and re.search(r"[a-z]", value)
                and re.search(r"[0-9]", value)
            ):
                issues.append("credential-assignment-pattern")
    return sorted(set(issues))


def main() -> int:
    paths = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
    failures: list[str] = []
    checked = 0
    for name in filter(None, paths):
        path = ROOT / name
        if not path.is_file():
            continue
        if path.name.startswith(".env") and path.name != ".env.example":
            failures.append(f"{name}: tracked environment file")
        data = path.read_bytes()
        if b"\0" in data:
            continue
        checked += 1
        for issue in find_issues(data.decode("utf-8-sig", errors="replace")):
            failures.append(f"{name}: {issue}")
    for finding in failures:
        print("FAIL: " + finding)
    print(f"Tracked-content credential scan: {checked} text files; {len(failures)} findings")
    print("Limited patterns only; not a comprehensive secret/PHI detector.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
