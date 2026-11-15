"""Dependency-free P00 document validation, not clinical/legal assurance."""

from pathlib import Path
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
errors = []
checks = 0


def check(condition, message):
    global checks
    checks += 1
    if not condition:
        errors.append(message)


primary = [
    "docs/product-charter.md",
    "docs/intended-use.md",
    "docs/clinical-safety-plan.md",
    "docs/regulatory-applicability.md",
    "docs/risk-register.md",
]
support = ["README.md", "docs/DECISIONS.md", "docs/evidence/regulatory-source-check.md"]
require_handoff = "--snapshot" not in sys.argv
documents = primary + support + (["handoffs/P00-to-P01.md"] if require_handoff else [])
contents = {}
for name in documents:
    path = ROOT / name
    check(path.is_file(), f"Missing document: {name}")
    body = path.read_text(encoding="utf-8") if path.is_file() else ""
    contents[name] = body
    check(len(body.strip()) >= 300, f"Empty/insubstantial document: {name}")
    check(body.startswith("# "), f"Missing document title: {name}")

for name in primary:
    check("2026-11-15" in contents[name], f"Missing version date: {name}")

check("synthetic-only" in contents[primary[0]].lower(), "Missing synthetic-only policy")
check("Risk is not diagnosis." in contents[primary[1]], "Missing risk/diagnosis boundary")
check("No marriage-compatibility binary labels" in contents[primary[1]], "Missing marriage-label restriction")
check("UNASSIGNED" in contents[primary[2]], "Missing safety ownership gap")
check("not improvise" in contents[primary[2]], "Missing empty-knowledge boundary")
check("not claim compliance" in (ROOT / "START_PHASE_00_PROMPT.md").read_text(encoding="utf-8"), "Supplied phase scope missing")
for item in ("REG-01", "REG-02", "REG-03", "REG-04"):
    check(item in contents[primary[3]], f"Missing applicability topic: {item}")
for number in range(1, 9):
    approval_id = f"APR-{number:02}"
    check(f"| {approval_id} |" in contents[primary[3]], f"Missing approval entry: {approval_id}")
hazards = re.findall(r"^\| (H\d{2}) \|", contents[primary[4]], re.MULTILINE)
check(len(hazards) == 12 and len(set(hazards)) == 12, "Expected twelve unique hazard rows")
for number in range(1, 13):
    hazard_id = f"H{number:02}"
    check(hazard_id in contents[primary[2]], f"Safety plan lacks hazard reference: {hazard_id}")
    row = next((line for line in contents[primary[4]].splitlines() if line.startswith(f"| {hazard_id} |")), "")
    check("OPEN" in row and "unknown" in row.lower(), f"Missing unresolved status/likelihood: {hazard_id}")

# Local-link checks deliberately avoid network claims. Anchor existence is checked.
for name, body in contents.items():
    for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", body):
        if re.match(r"[a-z]+://", target):
            continue
        relative, _, anchor = target.partition("#")
        destination = ((ROOT / name).parent / relative).resolve()
        check(destination.is_relative_to(ROOT), f"Link escapes repository: {name}: {target}")
        deferred = not require_handoff and destination in {
            ROOT / "handoffs/P00-to-P01.md", ROOT / "docs/evidence/p00-validation.txt"
        }
        if deferred:
            continue
        check(destination.is_file(), f"Broken local link: {name}: {target}")
        if anchor and destination.is_file():
            headings = re.findall(r"^#+\s+(.+)$", destination.read_text(encoding="utf-8"), re.MULTILINE)
            slugs = {re.sub(r"[^\w\s-]", "", h.lower()).replace(" ", "-") for h in headings}
            check(anchor in slugs, f"Missing local anchor: {name}: {target}")

if require_handoff:
    handoff = contents["handoffs/P00-to-P01.md"]
    for number in range(1, 11):
        check(f"## {number}. " in handoff, f"Missing handoff section {number}")
    check("**Gate:** BLOCKED" in handoff, "P00 gate must remain BLOCKED pending expert review")
    check("P01 has not started" in handoff, "Missing P01 execution boundary")
    match = re.search(r"Implementation snapshot: `([0-9a-f]{40})`", handoff)
    check(match is not None, "Missing exact immutable implementation commit")
    if match:
        result = subprocess.run(["git", "cat-file", "-t", match.group(1)], cwd=ROOT, text=True, capture_output=True)
        check(result.returncode == 0 and result.stdout.strip() == "commit", "Snapshot commit does not exist")

print(f"P00 documentation validation ({'snapshot' if not require_handoff else 'delivery'} mode)")
print(f"Documents checked: {len(documents)}")
print(f"Hazard entries: {len(hazards)}; approval entries: 8")
print(f"Assertions: {checks}; passed: {checks - len(errors)}; failed: {len(errors)}")
print("Assurance scope: document integrity only; no clinical/legal/bilingual approval.")
for error in errors:
    print(f"FAIL: {error}")
sys.exit(1 if errors else 0)
