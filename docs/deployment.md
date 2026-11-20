# Deploy the AMAN Genome demo

Use one Vercel project for Next.js, one Render Docker web service for FastAPI and one Render Postgres database. The goal is a browser-accessible **synthetic hackathon demo**. Anyone with the frontend URL can explore the public lessons. The organizer issues separate credentials for the private sample accounts.

## 1. Select a release and reserve the web address

1. Push the release commit to GitHub and check its CI results. Use the same commit on both providers. For a feature-branch rehearsal, select that branch in both dashboards. For the shared demo, use the reviewed commit on `main`.
2. In Vercel, choose **Add New → Project**, import `AryanMedigeri08/Generisk`, select **Next.js** and set **Root Directory** to `apps/web`. Select Node.js **22.x**. Enable **Include source files outside of the Root Directory in the Build Step**. The app imports synthetic teaching fixtures from the repository-level `data/` directory and uses the root npm workspace lockfile.
3. Use the install and build commands in [apps/web/vercel.json](../apps/web/vercel.json). Leave the framework output directory at its default. Create the project and copy its stable **Production** HTTPS domain from **Settings → Domains**. An initial deployment can establish this address before the API exists; the public guided example is available, and API-backed features need step 3 below.

Use the stable address, such as `https://your-project.vercel.app`, with **no trailing slash, path or wildcard**. A new preview URL per commit cannot serve as the canonical origin. [Vercel monorepo configuration](https://vercel.com/docs/monorepos) · [Vercel build configuration](https://vercel.com/docs/deployments/configure-a-build)

## 2. Provision Render

1. Choose **New → Blueprint**, connect the same repository and branch, and select [render.yaml](../render.yaml) at the repository root. Review the resource plans and region before applying. The blueprint requests a single free web service and a free PostgreSQL 17 database in Frankfurt. If your workspace already uses its free database allowance, choose an eligible workspace or explicitly approve a different plan.
2. At the prompt for **AMANAH_WEB_ORIGIN**, paste the exact Vercel production origin from step 1. Apply the blueprint. Render creates an internal database connection and four distinct random passwords. The database has an empty external IP allowlist.
3. Keep the Docker build context at the repository root. The image includes Alembic migrations, the panel and the fixture library. At startup it applies migrations, seeds demonstration data, provisions accounts and listens on Render’s assigned `PORT`. The readiness probe is `/health/ready`.
4. Copy the **actual HTTPS service URL** that Render assigns. Open `/health/ready` on that host and confirm `status: ok`, `database: ready` and `demo_only: true`.

The free web service can sleep after 15 minutes of inactivity. Its first request can exceed the frontend timeout while it wakes. Open the readiness URL before judging, wait for a successful response, then reload the frontend. Free Render Postgres currently expires 30 days after creation. For a longer demo, choose a suitable database plan and backup policy before expiry. [Render Blueprint reference](https://render.com/docs/blueprint-spec) · [Render free-tier limits](https://render.com/docs/free)

## 3. Connect Vercel to the API

Set these **server-side Production** variables in Vercel, then redeploy the same commit. Example domains below are placeholders.

| Variable | Example value |
| --- | --- |
| `API_INTERNAL_URL` | `https://your-api.onrender.com` — the actual Render service origin |
| `DEMO_WEB_ORIGIN` | `https://your-project.vercel.app` — exactly the value of Render’s `AMANAH_WEB_ORIGIN` |

Vercel functions use Render’s public HTTPS address. Browsers use the Vercel proxy at `/api/p03/`. Do not add `NEXT_PUBLIC_` prefixes, a database connection string or demo passwords to Vercel. No cross-site cookie settings or permissive CORS policy are needed. Leave model variables unset for the default curated experience. To use optional Groq reading suggestions later, set `GROQ_API_KEY` and `GROQ_MODEL` on Vercel only, then redeploy.

| Render variable | How it is supplied |
| --- | --- |
| `AMANAH_DATABASE_URL` | Internal database connection from the blueprint, normalized to the psycopg driver at startup |
| `AMANAH_WEB_ORIGIN` | Operator enters the single canonical Vercel origin |
| `AMANAH_HOSTED_DEMO`, `AMANAH_DEMO_ONLY`, `AMANAH_COOKIE_SECURE` | All `true` in the blueprint |
| `AMANAH_PASSWORD_A`, `AMANAH_PASSWORD_B`, `AMANAH_PASSWORD_COUNSELLOR`, `AMANAH_PASSWORD_SUPPORT` | Render generates each independently |

Give each judge only the credentials needed for their role. Pair `demo-a` with `AMANAH_PASSWORD_A` and `demo-b` with `AMANAH_PASSWORD_B`. Share them privately. For a hosted demo, the local one-click credentials printed in older local walkthroughs do not work. Rotating a password in Render and redeploying updates its stored hash and revokes that account’s previous sessions. An ordinary restart with the same passwords preserves sessions until they expire.

## 4. Accept the release

| Check | Expected result |
| --- | --- |
| Render `/health/live` and `/health/ready` | Both return HTTP 200. Readiness reports a working database connection. |
| Vercel `/api/demo` and `/panel` | The snapshot reports API online, database ready and two synthetic cases. The public panel shows the 12-gene panel with sources. |
| Vercel `/start` | Complete the two-carrier sample in English, switch to Arabic, select a visit question and download it. No account or API key is needed. |
| Vercel `/workspace` in two separate browser profiles | The hosted sign-in form is visible. A local fixture password fails. The corresponding organizer-issued passwords sign in to separate A and B workspaces. The session cookie is host-only, HttpOnly and Secure. |
| Report and consent | As A, grant processing, import a synthetic fixture and renew consent for the new version. B cannot read A’s raw report. Sign out and confirm the workspace requires sign-in again. |
| Vercel `/care-atlas` | Select Policy and place the default South Ridge counselling site at 7 km. The model shows 59,000 additional simulated residents within reach. |

Record the commit SHA, both provider deployment IDs, the stable frontend URL and the acceptance results before sharing it. Demo accounts are shared state: different people using `demo-a` see the same fictional account. A separate rehearsal or preview that needs sign-in should have its own Render database, credentials and exact frontend origin. Keep production API variables out of unrelated preview deployments.

## 5. Troubleshoot or roll back

- **Build cannot find a fixture or lockfile.** Check the Vercel root directory, outside-root build access and workspace install command. On Render, leave the Docker context at the repository root.
- **The panel is unavailable or the proxy returns 503.** Check Render readiness first, then check Vercel’s `API_INTERNAL_URL` and redeploy after correcting it.
- **Login returns 403.** Open the configured production domain. Compare both web-origin variables character for character. A preview domain, trailing slash or HTTP origin will fail. Redeploy after changing environment settings.
- **Login returns 401.** Use the password for that specific hosted account. Confirm the latest Render startup completed account provisioning. Repeated failures may briefly trigger the login rate limit.
- **Roll back a bad release.** Promote the last known-good Vercel deployment and redeploy the compatible Render API commit against the same database. Recheck readiness, login and the guided example. Review schema compatibility before rolling back code after a migration. Preserve the database and avoid automatic Alembic downgrades.
