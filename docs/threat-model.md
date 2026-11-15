# Proposed privacy and security threat model

**DESIGN-ONLY / NOT APPROVED** | Draft 0.1 | 2026-11-15, Asia/Calcutta

Scope: [DEC-008 amendment v1](DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation). This is threat analysis and proposed verification, not a tested secure system. P00 and full P01 remain BLOCKED.

## Assumptions and dependencies

No runtime or real data exists. Threats concern a proposed future service with individual/partner users, qualified reviewers, support staff and suppliers. All H01-H12 remain OPEN; reviewer identities/control acceptance are PENDING under APR-01 through APR-08. Assets and flows are [D01-D09 / F01-F09](data-flows.md); trust boundaries TB1-TB3 are in [architecture](architecture.md).

## Assets, adversaries and trust boundaries

Assets: private identity/genetic findings, independent consent evidence, relationship metadata, provenance, reviewed output, credentials, approved knowledge and audit integrity. Adversaries include unauthenticated attackers, a coercive or curious partner, authorized users trying other identifiers, compromised staff/accounts, overprivileged support and malicious/stale retrieved content. Accidental mistranslation, policy bugs and supplier misconfiguration also cause harm.

Crossing TB1 to TB2 never conveys authorization by itself. TB2 to TB3 requires least privilege and consistent resource/consent checks. Identity, future referral/notification suppliers and hosting access add distinct external boundaries requiring contract/location/approval review; they are not currently connected. The educational corpus must never become a route to clinical stores.

STRIDE categories below are Spoofing, Tampering, Repudiation, Information disclosure, Denial of service and Elevation of privilege. Severity remains that of related H entries; no likelihood estimates or residual-risk acceptance are invented.

## Threat and control proposals

| ID / STRIDE | Threat / affected flow | Proposed control | Future negative verification | Traceability |
|---|---|---|---|---|
| T01 / Spoofing | Stolen/forged session or impersonated clinician, F01/F06 | Validate identity/session; strong staff authentication, separate credential/assignment checks, approved recovery | Wrong issuer/audience, revoked session, unverified professional and missing assignment denied | APR-01/APR-05/APR-07; H05/H10; AC-07 |
| T02 / Tampering | Forwarded/replayed invite or altered counterpart/purpose, F02/F03 | Intended-recipient binding, opaque token digest, single use, explicit scoped confirmation; TTL PENDING | Reuse/recipient change/token swap cannot link cases or grant permission | APR-04/APR-05; H02/H03/H06; AC-04/AC-05 |
| T03 / Repudiation | Edited or untraceable consent/review evidence, F03/F09 | Versioned attributable event, immutable history and restricted writer; legal evidence requirements PENDING | Prior event alteration detected; scope/version/action traceable without clinical payload | APR-03/APR-04/APR-05; H05/H06; AC-13 |
| T04 / Information disclosure | Findings in logs, URLs, notifications, caches or exports, F01-F09 | Minimize fields; no sensitive URL/body telemetry; private noncacheable responses; no bulk/download export initially | Inspect error/log/notification/cache surfaces for prohibited content using fictional data | APR-04/APR-05; H02/H05/H07; AC-03/AC-12 |
| T05 / Denial of service | Policy/audit/content/identity outage degrades into bypass | Fail closed on sensitive actions; approved fallback for general education; bounded workload/retry policies | Dependency failures expose no payload or stale permissions; no invented content | APR-05/APR-06; H01/H05/H11/H12; AC-02/AC-13 |
| T06 / Elevation of privilege | Admin/staff role bypasses clinical or audit scopes, F06/F07/F09 | Separate roles/purpose/assignment; deny clinical admin defaults; approved audit-review role | Admin cannot query records, link partners, approve consent or read unrestricted audit | APR-04/APR-05; H02/H05/H10; AC-07/AC-12 |
| T07 / Spoofing + disclosure | Coercive partner controls device or completes another person's choice, F02/F03/F05 | Independent authenticated decisions, private neutral state, safe withdrawal/navigation; no relationship judgement | Shared-device/private-flow review; refusal reason and findings not exposed | APR-02/APR-04/APR-06/APR-07; H02/H03/H06; AC-06 |
| T08 / Information disclosure | Joint status, refusal timing, small cohorts or error differences reveal partner findings | Purpose-bound audiences; common externally visible unavailable state; suppress identifying metrics | Compare authorized/unauthorized/error/timing/status outputs; define acceptable non-enumeration thresholds with reviewers | APR-04/APR-05; H02/H05; AC-03/AC-06 |
| T09 / Elevation + disclosure | IDOR by changing case/assessment/object identifiers, F01/F04/F05 | Ownership/assignment/relationship check for every nested object and object stream | Cross-account and nested-object requests denied uniformly; no count/filename leakage | APR-04/APR-05; H02/H05; AC-03/AC-07 |
| T10 / Tampering + elevation | Query/template/script or retrieved prompt injection | Validate inputs and encode display; parameterized future persistence; untrusted retrieval cannot invoke tools/change policy | Malformed input/markup and malicious retrieved directives cause no execution, unauthorized access or invented claim | APR-05/APR-06; H01/H05/H12; AC-16 |
| T11 / Tampering + disclosure | Revocation/read/write race or stale policy cache, F03/F05 | Versioned consent/resource/output state; authoritative recheck at sensitive commit/read; invalidate jobs and caches | Interleave withdrawal and result release; no post-revocation-authorized disclosure | APR-04/APR-05; H02/H06; AC-08 |
| T12 / Tampering | Corrected/wrong-person report or expired content silently reused, F04/F05/F08 | Provenance/source eligibility, supersession invalidation, independent clinical review | Unsupported/amended inputs block output; withdrawn content never returned | APR-02/APR-06/APR-07; H01/H04/H09/H12; AC-09/AC-10 |
| T13 / Information disclosure | Supplier support/backup/foreign remote access moves data unexpectedly | No supplier approval by diagram; map locations/subprocessors/access and obtain legal/security decisions | Review actual configuration/contracts and access/backup paths before any real data | APR-01/APR-03/APR-04/APR-05; H05/H07/H10 |
| T14 / Tampering + disclosure | RTL/mistranslation changes consent meaning or hides an important action | Reviewed language versions, semantic order, safe mixed-script identifiers, no automatic clinical translation | Arabic/English comprehension and assistive-tech evaluations; refusal equally available | APR-02/APR-06; H03/H04/H08; AC-14 |
| T15 / Repudiation + denial | Audit outage/full storage or overbroad audit exposes details | Minimal restricted audit, monitored durability; sensitive action cannot succeed without required event | Simulate audit failure and restricted-read denial; event content contains no findings/secrets | APR-04/APR-05; H05/H06; AC-13 |

## Abuse-case walkthrough

For fictional `syn-person-a`, changing an output ID to another person's output must not reveal its existence, filename, review status or content. The server checks output ownership/audience, pair, both scoped permissions, input/output versions and professional review. If A withdraws while B is requesting the joint output, the final authoritative check must deny post-withdrawal access. Neither endpoint error nor partner status explains who withdrew or why. A generic response alone cannot prove timing resistance; actual implementation needs measured adversarial tests.

An approved-content item containing instructions to fetch patient records is data, never policy. KnowledgeProvider has no clinical-store capability. Filtering, source approval and output constraints remain necessary even if retrieved text cites a plausible source. Empty/missing sources require safe unavailability, not free-form completion.

## Review gaps

No SAST/DAST, penetration test, authorization/race test, intrusion simulation or runtime prompt-injection test was run. Controls are design proposals; zero threats/hazards are closed. Security/privacy leads must approve priorities and test thresholds; clinical/legal reviewers must assess coercion, inference and residual harms. [Governance](governance-approval-register.md), [consent](consent-matrix.md) and [ADR-003](adr/ADR-003-knowledge-clinical-separation.md) are dependencies. Full P01 is BLOCKED.
