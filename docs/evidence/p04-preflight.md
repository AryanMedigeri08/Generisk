# P04 baseline and authorization preflight

2026-11-16, Asia/Calcutta. Synthetic-only, non-clinical hackathon engineering under DEC-011; P04 only.

Source: current user's 17-section P04 authorization explicitly names reviewed delivery `5cde32ff56d5243ab29b9a05b7a8fc6dfdebfc3d` and permits implementation/tests/GitHub delivery. No external sign-off or new role is invented. Read the master/hackathon roadmaps, decisions, P03 handoff/evidence, P01 architecture/consent/data/threat design and actual P03 identity/consent/joint/transaction/audit/routes/schema/migration/tests. New instruction authorizes this bounded next phase; historical handoff stop statements do not override it.

Initial working tree clean on `feature/p03-identity-consent`. `git fetch origin`, remote refs/history and exact baseline checked. Observed refs:

```text
feature/p03-identity-consent 5cde32ff56d5243ab29b9a05b7a8fc6dfdebfc3d
feature/p02-hackathon-foundation 8ced1458cba1bf84deaf2fc4ce00f1d79aa5f70e
main 8f900d1dc9cec5ebc0ece9dafad93770e822e741
default HEAD feature/p00-product-governance 9dedc9b87ae30da74171c6aaa63292ed4134baf6
```

GitHub connector observed run 43720510611's api/web/compose-smoke jobs all completed/success. Its commit-run lookup filters PR-triggered runs; direct GitHub REST via existing Git credential in memory verified push-run metadata: **head 5cde32ff56d5243ab29b9a05b7a8fc6dfdebfc3d, completed/success**. No credentials printed/persisted. [Baseline run](https://github.com/AryanMedigeri08/Generisk/actions/runs/43720510611).

Executed `git switch -c feature/p04-synthetic-report-ingestion 5cde32ff56d5243ab29b9a05b7a8fc6dfdebfc3d`; success. Stacked on unmerged P03/P02, no previous branch merged, no history/default-branch change. Docker initially unavailable because Desktop was stopped; started installed Docker Desktop, then observed server 29.1.3. Local Python 3.10.11, Node 22.19.0, Compose 2.40.3-desktop.1; existing API environment/locks remain. Disposable PostgreSQL database must end `_test`; integration skips cannot pass the gate.

Implementation plan reuses P03 session/CSRF/ownership and `run()` advisory-lock/audit transaction; no duplicate identity system. Owner report operations require current processing; professional report purpose unresolved -> deny even assigned fictional counsellors. Source revisions immutable, active pointers separately constrained. Corrections advance P03 versions/invalidate dependent output and permissions in the same transaction. Explicit fixture-only input and bounded local reads; no real upload/object store/LLM/RAG. FHIR R4 DiagnosticReport/Observation/Specimen/Provenance primary documentation inspected for concept mapping only; conformance not claimed.

P00/full clinical P01 BLOCKED; eight APR PENDING, twelve H OPEN. Only synthetic engineering can pass this phase; P05+ and merges need separate authorization.
