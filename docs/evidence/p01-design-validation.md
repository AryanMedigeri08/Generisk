# Restricted P01 design validation evidence

**DESIGN-ONLY / NOT APPROVED** | 2026-11-15, Asia/Calcutta

## Scope, authorization and immutable commits

Baseline: `9dedc9b87ae30da74171c6aaa63292ed4134baf6`. Branch: `feature/p01-architecture-design`. Authorization checkpoint `97e3c3c43890301d3b2a60a9fefe447b05fb503d`; design snapshot `340bef5c240abea1a34871830c01b9b824cd730e`. Both checkpoint pushes succeeded. The final delivery adds this evidence, the review handoff and README review links. Its containing SHA is discovered with `git log -1 --format=%H -- docs/evidence/p01-design-validation.md` and reported in the final reply after a live remote comparison; this file does not claim to embed its own commit hash.

DEC-008 amendment v1 is restricted project-documentation permission based on [attributable founder self-attestation](p01-product-owner-authorization.md), not independent identity/authority verification or professional/legal clearance. P00 and full P01 remain BLOCKED; APR-01 through APR-08 PENDING; H01 through H12 OPEN. [Historical preflight](p01-authorization-preflight.md) and P00 records are preserved as history. No new law/standard-currentness review was performed.

## Baseline and branch verification

Actual read-only remote command before branch creation:

```powershell
git ls-remote --symref origin HEAD refs/heads/feature/p00-product-governance refs/heads/feature/p01-architecture-design
```

```text
ref: refs/heads/feature/p00-product-governance	HEAD
9dedc9b87ae30da74171c6aaa63292ed4134baf6	HEAD
9dedc9b87ae30da74171c6aaa63292ed4134baf6	refs/heads/feature/p00-product-governance
```

Exit 0. No existing remote P01 branch was returned. Local HEAD matched baseline; only the known untracked preflight record existed. `git switch -c feature/p01-architecture-design 9dedc9b87ae30da74171c6aaa63292ed4134baf6` succeeded. No default-branch change, rewrite or merge occurred. The P00 default branch remained unchanged at inspection.

## Tooling and executed commands

Repository working directory: `C:\Generisk`; PowerShell; Python 3.10.11; Git 2.56.0.windows.4; Node 22.19.0. No mmdc/workspace Mermaid parser was initially available. Global npm inventory did not provide a Mermaid CLI. Temporary diagram dependencies were installed outside the repository, with scripts disabled:

```powershell
$phaseToolRoot = Join-Path ([IO.Path]::GetTempPath()) 'amanah-p01-doc-validation'
New-Item -ItemType Directory -Path $phaseToolRoot -Force | Out-Null
npm.cmd install --prefix $phaseToolRoot --ignore-scripts --no-audit --no-fund mermaid@11 jsdom@26
```

Observed: install exit 0; 150 packages added in 32 seconds. Actual elevated install location was `C:\Users\aryan\AppData\Local\Temp\amanah-p01-doc-validation`. Installed Mermaid 11.17.2 and jsdom 26.1.0. A subsequent sandbox-relative temp lookup initially could not find the elevated install; the actual absolute location above was inspected and used. No repository package manifest, lockfile, dependency directory, service or model was created.

The helper listings below were materialized using PowerShell here-strings and `Set-Content -Encoding utf8` in a per-execution temporary directory. Exact invocations used:

```powershell
$phaseCheckRoot = Join-Path ([IO.Path]::GetTempPath()) 'amanah-p01-checks'
New-Item -ItemType Directory -Path $phaseCheckRoot -Force | Out-Null
python (Join-Path $phaseCheckRoot 'validate_p01_docs.py') --snapshot
node (Join-Path $phaseCheckRoot 'parse_mermaid.mjs')
python scripts/validate_p00.py
git diff --cached --check
```

Final delivery uses the same Python helper without `--snapshot`. Helper sources are supplied below for reproducibility; save them under the displayed temporary filenames. They are document checks, not application code, and were not committed as executable project files. The parser's tooling/root paths are machine-specific and must be adjusted if reproducing elsewhere.

## Snapshot observations and corrected finding

First snapshot document run: 19 changed Markdown files, 117 local links/anchors, **408 assertions: 407 passed, 1 failed**. Exact failure:

```text
FAIL: Missing blocked gate docs/adr/ADR-004-hosting-retention.md
```

Corrected ADR-004 by explicitly stating P00/full P01 BLOCKED. Reran the same helper; observed exit 0:

```text
P01 design documentation validation (snapshot mode)
Changed Markdown documents checked: 19; local links/anchors checked: 117
Core specifications: 9; draft ADRs: 4; ADR index: 1; Mermaid diagrams: 5
Requirements: 18 functional, 10 non-functional, 16 future acceptance scenarios; threats: 15
Governance: 8 APR PENDING; 12 H OPEN; P00/full P01 BLOCKED; no P02 handoff
Assertions: 408; passed: 408; failed: 0
Assurance: document consistency/scope only; no runtime, clinical, legal or security approval
```

Mermaid parser output, exit 0:

```text
PASS docs/architecture.md#1
PASS docs/consent-matrix.md#1
PASS docs/data-flows.md#1
PASS docs/rag-architecture.md#1
PASS docs/ux-workflows.md#1
Mermaid 11.17.2 / jsdom 26.1.0: 5/5 diagrams parsed; no render/runtime assurance
```

The unchanged `scripts/validate_p00.py` passed 179/179 after the authorization checkpoint, then 199/199 after adding the design index. Its assertion count grows with links; it is not a clinical test count. Staged whitespace checks returned exit 0. Git emitted normal LF-to-CRLF conversion warnings, not whitespace failures.

## Reproducible temporary Python helper

```python
"""Temporary document-only verification; never application/clinical assurance."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path("C:/Generisk").resolve()
BASE = "9dedc9b87ae30da74171c6aaa63292ed4134baf6"
core = ["requirements", "architecture", "data-flows", "consent-matrix",
        "threat-model", "ux-workflows", "api-outline",
        "accessibility-localization", "rag-architecture"]
design = [f"docs/{name}.md" for name in core] + [
    "docs/adr/README.md", "docs/adr/ADR-001-modular-monolith.md",
    "docs/adr/ADR-002-consent-authorization.md",
    "docs/adr/ADR-003-knowledge-clinical-separation.md",
    "docs/adr/ADR-004-hosting-retention.md"]
governance = ["README.md", "docs/DECISIONS.md", "docs/governance-approval-register.md",
    "docs/evidence/p01-authorization-preflight.md",
    "docs/evidence/p01-product-owner-authorization.md"]
delivery = ["docs/evidence/p01-design-validation.md", "handoffs/P01-design-only-review.md"]
snapshot = "--snapshot" in sys.argv
paths = design + governance + ([] if snapshot else delivery)
allowed = set(design + governance + delivery)
checks = 0
errors = []
links = 0
diagrams = 0
fence = chr(96) * 3

def check(ok, message):
    global checks
    checks += 1
    if not ok:
        errors.append(message)

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()

for name in paths:
    file = ROOT / name
    check(file.is_file(), f"Missing {name}")
    body = file.read_text(encoding="utf-8") if file.is_file() else ""
    check(body.startswith("# ") and len(body) > 300, f"Missing title/content {name}")
    check("DESIGN-ONLY / NOT APPROVED" in body, f"Missing design label {name}")
    check(len(re.findall(r"^" + fence, body, re.M)) % 2 == 0, f"Unbalanced fences {name}")
    if name in design:
        check("## Assumptions and dependencies" in body, f"Missing assumptions {name}")
        check(re.search(r"^## .*review gaps", body, re.I | re.M), f"Missing review gaps {name}")
        check(re.search(r"APR-0[1-8]", body) and re.search(r"H(?:0[1-9]|1[0-2])", body), f"Missing APR/H traceability {name}")
        check("BLOCKED" in body, f"Missing blocked gate {name}")
    diagrams += len(re.findall(r"^" + fence + r"mermaid\s*\n", body, re.M))
    prose = re.sub(r"^" + fence + r"[^\n]*\n.*?^" + fence + r"[ \t]*$", "", body, flags=re.M | re.S)
    for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", prose):
        if re.match(r"[a-z]+://", target):
            continue
        relative, _, anchor = target.partition("#")
        destination = (file.parent / relative).resolve()
        check(destination.is_relative_to(ROOT), f"Escaping link {name}: {target}")
        check(destination.is_file(), f"Broken link {name}: {target}")
        if anchor and destination.is_file():
            headings = re.findall(r"^#+\s+(.+)$", destination.read_text(encoding="utf-8-sig"), re.M)
            slugs = {re.sub(r"[^\w\s-]", "", heading.lower()).replace(" ", "-") for heading in headings}
            check(anchor in slugs, f"Missing anchor {name}: {target}")
        links += 1

rows = lambda body, prefix: {m.group(1): m.group(0) for m in re.finditer(r"^\| (" + prefix + r"\d{2}) \|.*$", body, re.M)}
apr = rows((ROOT / "docs/regulatory-applicability.md").read_text(encoding="utf-8"), "APR-")
risk = rows((ROOT / "docs/risk-register.md").read_text(encoding="utf-8"), "H")
review = (ROOT / "docs/governance-approval-register.md").read_text(encoding="utf-8")
review_apr, review_h = rows(review, "APR-"), rows(review, "H")
check(set(apr) == set(review_apr) == {f"APR-{n:02}" for n in range(1, 9)}, "Approval IDs mismatch")
check(all("PENDING" in apr[k] and "PENDING" in review_apr[k] for k in apr), "Approval closed without evidence")
check(set(risk) == set(review_h) == {f"H{n:02}" for n in range(1, 13)}, "Hazard IDs mismatch")
check(all("OPEN" in risk[k] and "OPEN" in review_h[k] for k in risk), "Hazard closed without evidence")
check(sum("Critical" in row for row in risk.values()) == 7, "Hazard severity changed")
decision = (ROOT / "docs/DECISIONS.md").read_text(encoding="utf-8")
check("## DEC-008 amendment v1" in decision and "**Current status:** ACCEPTED / ACTIVE FOR RESTRICTED DOCUMENTATION ONLY" in decision, "Missing restricted activation")
auth = (ROOT / "docs/evidence/p01-product-owner-authorization.md").read_text(encoding="utf-8")
check("Aryan Medigeri" in auth and "self-attested" in auth and "not independently verified" in auth, "Attribution/verification limits missing")
check(BASE in auth and "2026-12-15 23:59" in auth and "Signing time: **not supplied**" in auth, "Authorization baseline/expiry/time limits missing")
check("Full P01: BLOCKED" in review and "P00 gate: BLOCKED" in review, "Governance gates changed")

requirements = (ROOT / "docs/requirements.md").read_text(encoding="utf-8")
for prefix, count in [("FR-", 18), ("AC-", 16), ("NFR-", 10)]:
    check(set(rows(requirements, prefix)) == {f"{prefix}{n:02}" for n in range(1, count + 1)}, f"Missing {prefix} entries")
threats = (ROOT / "docs/threat-model.md").read_text(encoding="utf-8")
for word in ["Spoofing", "Tampering", "Repudiation", "Information disclosure", "Denial of service", "Elevation of privilege"]:
    check(word in threats, f"STRIDE coverage missing: {word}")
check(len(re.findall(r"^\| T\d{2} /", threats, re.M)) == 15, "Expected 15 threat entries")
check(diagrams == 5, "Expected five static Mermaid diagrams")
check(git("branch", "--show-current") == "feature/p01-architecture-design", "Wrong branch")
check(git("merge-base", "HEAD", BASE) == BASE, "Baseline ancestry changed")
tracked = set(filter(None, git("diff", "--name-only", BASE).splitlines()))
untracked = set(filter(None, git("ls-files", "--others", "--exclude-standard").splitlines()))
check(tracked | untracked == set(paths), "Change scope differs from expected Markdown-only set")
protected = subprocess.run(["git", "diff", "--exit-code", BASE, "--", ".", *[":!" + name for name in sorted(allowed)]], cwd=ROOT, capture_output=True, text=True)
check(protected.returncode == 0, "Protected P00/application paths changed")
check(not (ROOT / "handoffs/P01-to-P02.md").exists(), "Unapproved P01-to-P02 handoff exists")
if not snapshot:
    handoff = (ROOT / delivery[1]).read_text(encoding="utf-8")
    match = re.search(r"Design snapshot: " + chr(96) + r"([0-9a-f]{40})" + chr(96), handoff)
    check(match is not None, "Missing exact design snapshot SHA")
    if match:
        check(git("cat-file", "-t", match.group(1)) == "commit", "Design snapshot commit absent")
    check("Full P01 gate: BLOCKED" in handoff, "Missing blocked full P01 gate")
    for section in ["Completed deliverables", "Validation evidence", "Unresolved decisions", "Next actions"]:
        check(section in handoff, f"Missing handoff section {section}")

print(f"P01 design documentation validation ({'snapshot' if snapshot else 'delivery'} mode)")
print(f"Changed Markdown documents checked: {len(paths)}; local links/anchors checked: {links}")
print("Core specifications: 9; draft ADRs: 4; ADR index: 1; Mermaid diagrams: 5")
print("Requirements: 18 functional, 10 non-functional, 16 future acceptance scenarios; threats: 15")
print("Governance: 8 APR PENDING; 12 H OPEN; P00/full P01 BLOCKED; no P02 handoff")
print(f"Assertions: {checks}; passed: {checks-len(errors)}; failed: {len(errors)}")
print("Assurance: document consistency/scope only; no runtime, clinical, legal or security approval")
for error in errors:
    print("FAIL: " + error)
sys.exit(1 if errors else 0)
```

## Reproducible temporary Mermaid helper

```javascript
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";
const tooling = "C:/Users/aryan/AppData/Local/Temp/amanah-p01-doc-validation";
const require = createRequire(path.join(tooling, "package.json"));
const {JSDOM} = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const {default: mermaid} = await import(pathToFileURL(require.resolve("mermaid")).href);
mermaid.initialize({startOnLoad: false, securityLevel: "strict"});
const root = "C:/Generisk";
const fence = String.fromCharCode(96).repeat(3);
let count = 0;
function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith(".md") ? [full] : [];
  });
}
for (const file of [...walk(path.join(root, "docs")), ...walk(path.join(root, "handoffs"))].sort()) {
  const content = fs.readFileSync(file, "utf8");
  const blocks = [...content.matchAll(new RegExp("^" + fence + "mermaid[ \\t]*\\r?\\n([\\s\\S]*?)^" + fence + "[ \\t]*$", "gm"))];
  for (const [index, block] of blocks.entries()) {
    await mermaid.parse(block[1], {suppressErrors: false});
    console.log("PASS " + path.relative(root, file).replaceAll("\\", "/") + "#" + (index + 1));
    count += 1;
  }
}
if (count !== 5) throw new Error("Expected 5 Mermaid diagrams; observed " + count);
const version = require("mermaid/package.json").version;
const domVersion = require("jsdom/package.json").version;
console.log("Mermaid " + version + " / jsdom " + domVersion + ": " + count + "/5 diagrams parsed; no render/runtime assurance");
dom.window.close();
```

## Final delivery observations

Actual final invocations (same helper sources above, no snapshot flag):

```powershell
python (Join-Path $phaseCheckRoot 'validate_p01_docs.py')
node (Join-Path $phaseCheckRoot 'parse_mermaid.mjs')
python scripts/validate_p00.py
```

Observed document result, exit 0:

```text
P01 design documentation validation (delivery mode)
Changed Markdown documents checked: 21; local links/anchors checked: 139
Core specifications: 9; draft ADRs: 4; ADR index: 1; Mermaid diagrams: 5
Requirements: 18 functional, 10 non-functional, 16 future acceptance scenarios; threats: 15
Governance: 8 APR PENDING; 12 H OPEN; P00/full P01 BLOCKED; no P02 handoff
Assertions: 468; passed: 468; failed: 0
Assurance: document consistency/scope only; no runtime, clinical, legal or security approval
```

Final Mermaid rerun returned exit 0 and the same five PASS lines and `5/5 diagrams parsed` output recorded above. It verifies syntax only; no diagram layout or patient-facing interface was rendered.

Observed P00 result, exit 0:

```text
P00 documentation validation (delivery mode)
Documents checked: 9
Hazard entries: 12; approval entries: 8
Assertions: 203; passed: 203; failed: 0
Assurance scope: document integrity only; no clinical/legal/bilingual approval.
```

`git diff --check` returned exit 0; normal CRLF conversion warnings only. `git diff --exit-code` against the baseline for supplied inputs, original five P00 artifacts, P00 handoff/evidence/validator, `.gitignore` and `Github.txt` returned no diff, exit 0. The comprehensive check separately asserted that no path outside the 21 allowed Markdown paths changed. No P01-to-P02 handoff exists.

Final pre-staging working-tree output:

```text
## feature/p01-architecture-design...origin/feature/p01-architecture-design
 M README.md
?? docs/evidence/p01-design-validation.md
?? handoffs/P01-design-only-review.md
```

The design snapshot had already been pushed; the remaining three delivery changes above are checked/staged before their commit/push. The first final staged whitespace check returned exit 2 for `docs/evidence/p01-design-validation.md:302: new blank line at EOF`; no delivery commit occurred on that attempt. The extra trailing blank line was removed and staging/whitespace verification repeated before commit. The final reply reports the actual delivery SHA, live remote comparison and clean working-tree status. No advance claim of a successful final push is made inside this self-containing record.

## Reviewer gaps and assurance limits

Document checks validate labels, structure, local links/anchors, enumerated APR/H traceability/status, baseline ancestry, protected-path preservation and a Markdown-only change set. Mermaid parsing checks grammar acceptance only; it does not verify rendered layout, accessibility or clinical workflow correctness. No application or API is implemented, and no negative authorization/race test, clinical case, RAG/model call/evaluation, penetration test, Arabic/RTL UI run, accessibility audit, deployment or integration test occurred. The sixteen acceptance scenarios remain proposed future tests.

All eight expert approval items remain PENDING; all twelve hazards OPEN, seven Critical/five High with unknown likelihood and unaccepted residual risk. No reviewer appointment/signature or externally verified identity is invented. Operator/professional responsibilities, current authoritative legal sources, classification, hosting/remote access, lawful purposes, retention, content, bilingual comprehension and escalation/provider arrangements remain unresolved. Full P01 cannot pass its lawful-purpose/owner/retention/journey-review gates.

Review [the restricted handoff](../../handoffs/P01-design-only-review.md), [governance register](../governance-approval-register.md) and [DEC-008 amendment](../DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation). Next scope is only review/revision of the authorized provisional documents before expiry/withdrawal; implementation, full-phase advancement, P02, real data and merging need separate applicable authorization/review.
