# P07 Education Studio

Synthetic demonstration. Educational estimate. Not a diagnosis. Not for clinical use. English only; all nine cards are `demo-unreviewed`. Source retrieval is attribution evidence, not clinical approval. DEC-014 and ADR-010 authorize this phase; P00/full clinical P01 remain BLOCKED, APR-01–08 PENDING and H01–12 OPEN.

## Routes and modules

`/learn` and its seven static lesson routes are public. Home and `/workspace` link to Learn. Visited module IDs stay in the Learn layout's React memory, with a clear button; reloading clears them. No answers, options, analytics, cookies or progress records are stored.

| Module / route under `/learn/` | Interaction |
| --- | --- |
| M1 `genes-and-copies` | Two copies, tap/button reveal; shape plus text |
| M2 `carriers` | GeneKeys copy passing, drag or keyboard buttons; three presets; four-pair table |
| M3 `couple-chance` | Seeded Next100, ten-run strip and independent OnePregnancy draws with bounded history |
| M4 `relatives-share-genes` | Simplified FamilyTree, six relationship tokens, explicit teaching q presets; absolute server frequencies before F/relative comparison |
| M5 `test-limits` | NegativeBar c/d teaching presets, native meters and uncertain-result card with no estimate |
| M6 `options` | Four equal neutral cards, no selected route; memory-only questions checklist; UAE availability caveat |
| M7 `your-result` | Fictional own/shared/unavailable previews; ResultExplainer also renders the authenticated workspace output |

The family tree illustrates shared paths, including the intervening generations for cousin relationships; it is not a pedigree editor or a family-history assessment. A regression test checks generation nodes for each relationship token. One hundred dots represent different fictional families, one pregnancy each. The fixed single-gene recessive model does not describe every gene, condition or person.

## Content and language boundary

`apps/web/src/content/en/` contains one module JSON per lesson, `ui.json` (including glossary), `risk-messages.json` and `sources.json`. `card.schema.json` specifies the card contract. `loader.ts` checks module/card structure, known sources/glossary, version, language, widget and unreviewed metadata. `locale.tsx` supplies a `ContentBundle` through context; lesson components read it instead of embedding prose.

Each card requires `card_id`, semantic `version`, `language`, `reading_level` (`simple`/`detail`), `title`, `body[]`, controlled `widget`, `sources[]`, `review_status: demo-unreviewed`, `source_check` and `glossary_terms[]`. Current content: seven modules, nine simple cards, six retrieved primary sources, 22 engine message keys and seven caveat codes. Source notes and licences are in [SOURCES.md](../data/public/SOURCES.md). No source is `not_verified` in this delivery; wording remains unreviewed.

To add a card, add original short wording to its module JSON, a unique `mN-...` ID, version/review metadata, verified source IDs and known glossary terms. Select an existing widget or explicitly authorize a new interaction. Update source records and SOURCES.md for new references. Run the content tests: missing metadata, unknown IDs, forbidden phrases, simple sentences over 25 words and missing engine keys fail. Source verification must not be upgraded to expert approval.

To add a language in a separately authorized phase, mirror the English module/UI/message/source keys under its language directory; extend `Language`, loader selection and card language/schema validation. Provide translated content through `ContentProvider`, and set document `lang`/`dir` for that route. Widget components already consume the context; the injected-bundle unit test checks that boundary. Review translated terminology, reading level, wrapping and RTL diagrams before enabling it. Arabic, TTS, locale navigation and a translation fallback policy are not implemented in P07.

## Number and privacy boundaries

`lib/learn/mendelian.ts` alone owns the fixed 1/4, 1/2, 1/4 model. GeneKeys selects its copy combinations; seeded simulation only samples/counts those cells. No gene-specific, residual or population risk formula runs in the browser.

FamilyTree/NegativeBar explicitly POST teaching presets to the existing `/api/p03/risk/whatif` proxy and FastAPI `/api/v1/risk/whatif`; proxy allowlist and backend are unchanged. Requests omit credentials and carry no report, identity or progress data. q/c/d values are clearly labelled assumptions, never claimed population frequencies or laboratory detection rates. Exact fractions and k-in-n values come from the server; native meter geometry uses returned k/n directly. Selection changes abort pending work and clear old results; not-sure, failure and unsupported states do not retain numeric results.

ResultExplainer maps `gen-risk-1` states, messages and caveats to content text. Unknown contracts/keys fail closed. Unavailable stays neutral; uncertain/unresolved states show no numeric estimate. Original codes/fractions remain in workspace technical details. P06 consent scope, binding pins, stale invalidation, explicit recomputation and authentication remain in place; no new release surface is introduced.

## Verification and limitations

Unit checks cover content lint/exhaustiveness, fixed model outcomes and deterministic sampling, exact mocked server rendering (13/8000 versus 1/2500; residual 1/241), stale asynchronous responses, unavailable behavior and locale injection. Browser checks cover all public lessons, real proxy calls, keyboard GeneKeys, reduced motion, desktop/375px axe checks, 320px reflow and memory-only progress/checklists. Fourteen desktop/mobile PNGs are in [screenshots](screenshots/); screenshot preparation blurs focus and scrolls instantly to the top without altering skip-link behavior.

See [P07 handoff](../handoffs/P07-to-P08.md) for exact implementation, CI and observed commands/counts, including corrected verification failures. Automated accessibility checks are not a human accessibility audit. No Arabic, quiz, TTS, persistent learning profile, referral, saved option decision, RAG/LLM or clinical approval is included. Review the English wording, teaching assumptions and diagrams before broader use; separately authorize P08 and any merge.
