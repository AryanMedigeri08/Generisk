# AMAN Genome (Generisk)

AMAN Genome is a synthetic genetics education and care-navigation demo. Start with two sample reports, try a hands-on inheritance lesson, then take a list of questions to a simulated counselling visit. The public journey works without an account or model key.

**Synthetic demonstration. Not for clinical use.** All people, reports, samples, laboratories and facilities are fictional. Public gene names and condition references are attributed in the [demo panel sources](data/public/SOURCES.md).

## Run locally

Install Docker Desktop with Linux containers (or Docker Engine with Compose v2). From the repository root run:

```sh
docker compose up --build -d --wait --wait-timeout 180
```

Open **[Start the guided example](http://localhost:13000/start)**. Choose the two carrier samples to try the four possible inheritance pairings, or choose an untested sample to explore what the test leaves unknown.

| Feature | What to try |
| --- | --- |
| [Education Studio](http://localhost:13000/learn) | Explore seven interactive lessons on carriers, inheritance, uncertainty and choices. |
| [Prepare for a visit](http://localhost:13000/journey) | Choose questions, explore a sample family history and download a consultation checklist in English or Arabic. |
| [Care Atlas](http://localhost:13000/care-atlas) | **Personal** finds simulated services. **Ecosystem** shows referral connections. **Policy** compares access before and after adding a site. |
| [Private workspace](http://localhost:13000/workspace) | Use separate browser profiles for partners A and B. Import a fixture, grant consent and try a shared assessment. Each partner controls processing, comparison and disclosure independently. |
| [Public panel](http://localhost:13000/panel) and [Atlas Data](http://localhost:13000/care-atlas/data) | Inspect the attributed gene panel or download the synthetic service-planning dataset. |

The local workspace offers one-click sample accounts. Hosted accounts use organizer-issued passwords. Changing a report preserves its previous revision and invalidates permissions and outputs tied to that revision.

```sh
python scripts/smoke_stack.py
docker compose down
```

Stopping Compose preserves the database volume. Local defaults are web port `13000`, API port `18000` and PostgreSQL port `15432`. See [.env.example](.env.example) for overrides and [local development](docs/local-development.md) for native setup.

## Deploy on Vercel and Render

**[Follow the deployment plan](docs/deployment.md)** for the environment variables, provider setup, judge credentials, release checks and rollback steps.

| Component | Host | Configuration |
| --- | --- | --- |
| Next.js frontend and same-origin API proxy | Vercel | Root directory `apps/web`, Node.js 22.x, [vercel.json](apps/web/vercel.json) |
| FastAPI and Alembic migrations | Render Docker web service | Repository-root build context, [API Dockerfile](services/api/Dockerfile), [render.yaml](render.yaml) |
| PostgreSQL 17 | Render Postgres | Same region as the API, internal connection string, external database access disabled |

The browser sends workspace requests to its own Vercel origin. The server-side proxy forwards approved routes to Render. FastAPI checks the configured frontend origin, session, CSRF token and resource permissions. The hosted demo uses HTTPS cookies. The optional reading suggestion feature works with curated defaults when a model is unavailable.

## Development and verification

Node.js 22.13+ and Python 3.10+ are used for native development. Run the frontend checks from the repository root:

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

The backend dependencies are pinned in [requirements.lock](services/api/requirements.lock). Integration tests require a **separate disposable PostgreSQL database whose name ends in `_test`**. They run migrations up and down. The [testing strategy](docs/testing-strategy.md) and [CI workflow](.github/workflows/ci.yml) cover database, browser, accessibility and Compose checks.

## Product and review materials

- [Feature guide](docs/AMAN-Genome-Feature-Guide.docx), [demo walkthrough](docs/aman-genome-demo.md), [Education Studio](docs/education-studio.md) and [prototype screenshots](docs/screenshots/).
- [Solution plan](GENERISK_SOLUTION.md), [engineering decisions](docs/DECISIONS.md), [risk contract](docs/risk-contract.md), and [phase handoffs](handoffs/).
- [Intended use](docs/intended-use.md), [clinical safety plan](docs/clinical-safety-plan.md), [risk register](docs/risk-register.md) and [governance approval register](docs/governance-approval-register.md). Clinical-production readiness remains **BLOCKED**; APR-01 through APR-08 are pending and H01 through H12 remain open.
