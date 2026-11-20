# AMAN Genome synthetic demo

Start the stack from the repository root with Docker Desktop running.

```powershell
docker compose up --build -d --wait --wait-timeout 180
```

## Demo walkthrough

1. Open [Journey Studio](http://localhost:13000/journey). Retrieve “Test scope and uncertainty,” select a question, and turn on the fictional family graph. Enter a reported example for the grandparent. Switch to Arabic and inspect the right-to-left layout. Download the consultation summary, then clear the page. The file contains only the selected stock questions and fictional history labels.
2. Open [Workspace](http://localhost:13000/workspace) with a fictional account from the sign-in page. Grant processing, select a gene-level synthetic scenario and grant processing again for the new input version. Grant “own demo assessment” and calculate. Open “linked fictional care journey” and plan and complete a demo visit. Withdrawing the assessment hides the linked itinerary. Independent consent and disclosure still govern the existing two-account shared calculation.
3. Open [Care Atlas](http://localhost:13000/care-atlas). In Ecosystem, toggle service layers and inspect referral connections. In Policy, place a 7 km counselling site in South Ridge, add a second site in North Dunes, then enable telehealth. A site can be dragged or relocated with the district selector. Try the road-distance and waiting-time assumptions to see how they change reach.
4. Open [Atlas Data](http://localhost:13000/care-atlas/data) for JSON, GeoJSON, seven CSV tables and a PostgreSQL seed package. Generate the same release with Node 22 using `node --experimental-strip-types scripts/generate_atlas.mjs`. The export contains 60 facility fixtures, 24 zones, 110 links, 1,000 person fixtures, 600 gene-level examples, 240 pathways and 24 scenario configurations. Generated person IDs have no relationship to workspace accounts.

## Data and model boundaries

- The visible map uses 12 fictional anchor facilities and six districts. The larger package includes satellite facilities and subzones. Its projected GeoJSON coordinates are for interchange demonstrations. Neither dataset describes service availability anywhere in the UAE.
- Policy assigns district populations to their centres. The default model uses straight-line distances. The optional multiplier is 1.35 and the remote scenario assumes 60% reach where in-person access is unavailable. Modeled monthly slots are reported separately and do not increase geographic coverage. The model has no live routing, demand forecast or appointment integration.
- The workspace rechecks the authenticated result and its binding when opening a result-linked itinerary. Only a preset goes to the embedded map. Family edits, itinerary milestones and selected preparation questions live in React memory. Clearing them does not remove the workspace’s independently managed consent and audit records. Downloaded files remain under the user’s control.
- Journey Studio has English and Arabic UI and educational copy. Atlas, workspace and P07 lesson controls remain English. The educational cards use original summaries of MedlinePlus Genetics pages on [test interpretation](https://medlineplus.gov/genetics/understanding/testing/interpretingresults/), [inheritance](https://medlineplus.gov/genetics/understanding/inheritance/riskassessment/) and [genetic consultations](https://medlineplus.gov/genetics/understanding/consult/expectations/). The card wording and translations are demo content awaiting expert review. [NLM reuse terms](https://medlineplus.gov/about/using/usingcontent/).
- Public educational retrieval works by four bounded topic IDs. The optional Ollama adapter can choose a companion card from an allowlist. It receives public summaries only and cannot add claims or handle a report. Set `ATLAS_OLLAMA_URL` to a local Ollama base URL and `ATLAS_OLLAMA_MODEL` to an installed model. Compose on Docker Desktop can use `http://host.docker.internal:11434` if Ollama is configured to accept the container connection. Missing configuration, timeout or invalid output returns the curated default. See [Ollama generate API](https://docs.ollama.com/api/generate).
- Use the download SQL only in a disposable PostgreSQL database or schema. The live app generates public fixture responses directly. Existing private workspace tables remain separate.
