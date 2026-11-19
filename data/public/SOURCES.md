# Public panel sources — P05

Retrieved 2026-11-16. Public gene/condition reference curation only; all people/reports/labs/samples remain synthetic. No variant-level data, risk engine, LLM/RAG or education studio.

**Generisk demo panel, illustrative subset, NOT the Abu Dhabi clinical panel.** Twelve genes, thirteen recessive condition references; gene symbols alone do not distinguish condition-specific alleles (especially HBB) or establish an individual finding.

## Provenance and reuse

HGNC REST responses verified each approved symbol/ID/status. [HGNC licence](https://www.genenames.org/about/license/): CC0. Source: HGNC, HUGO Gene Nomenclature Committee.

[MedlinePlus reuse terms](https://medlineplus.gov/about/using/usingcontent/) identify Genetics summaries as public domain. Source: MedlinePlus, National Library of Medicine. Summaries below/in JSON are written in our own words; no images, medical encyclopedia content, OMIM or GeneReviews text was copied. NLM is the public reference for condition/gene/inheritance descriptions, not a clinical sign-off.

Every registry entry in demo-panel-v1.json has its own URL, retrieval date, exact section/field and licence URL/note. No reference URL is fetched by the runtime loader.

| Source ID | Primary URL | Exact field/section | Licence |
|---|---|---|---|
| hgnc-hbb | [HGNC approved symbol and ID: HBB](https://rest.genenames.org/fetch/symbol/HBB) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-beta-thalassemia | [MedlinePlus Genetics: Beta-thalassemia](https://medlineplus.gov/genetics/condition/beta-thalassemia/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| nlm-sickle-cell-disease | [MedlinePlus Genetics: Sickle cell disease](https://medlineplus.gov/genetics/condition/sickle-cell-disease/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-cftr | [HGNC approved symbol and ID: CFTR](https://rest.genenames.org/fetch/symbol/CFTR) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-cystic-fibrosis | [MedlinePlus Genetics: Cystic fibrosis](https://medlineplus.gov/genetics/condition/cystic-fibrosis/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-gjb2 | [HGNC approved symbol and ID: GJB2](https://rest.genenames.org/fetch/symbol/GJB2) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-nonsyndromic-hearing-loss | [MedlinePlus Genetics: Autosomal recessive nonsyndromic hearing loss (DFNB1A)](https://medlineplus.gov/genetics/condition/nonsyndromic-hearing-loss/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-pah | [HGNC approved symbol and ID: PAH](https://rest.genenames.org/fetch/symbol/PAH) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-phenylketonuria | [MedlinePlus Genetics: Phenylketonuria](https://medlineplus.gov/genetics/condition/phenylketonuria/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-mefv | [HGNC approved symbol and ID: MEFV](https://rest.genenames.org/fetch/symbol/MEFV) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-familial-mediterranean-fever | [MedlinePlus Genetics: Familial Mediterranean fever, recessive form](https://medlineplus.gov/genetics/condition/familial-mediterranean-fever/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-gba1 | [HGNC approved symbol and ID: GBA1](https://rest.genenames.org/fetch/symbol/GBA1) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-gaucher-disease | [MedlinePlus Genetics: Gaucher disease](https://medlineplus.gov/genetics/condition/gaucher-disease/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-atp7b | [HGNC approved symbol and ID: ATP7B](https://rest.genenames.org/fetch/symbol/ATP7B) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-wilson-disease | [MedlinePlus Genetics: Wilson disease](https://medlineplus.gov/genetics/condition/wilson-disease/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-hexa | [HGNC approved symbol and ID: HEXA](https://rest.genenames.org/fetch/symbol/HEXA) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-tay-sachs-disease | [MedlinePlus Genetics: Tay-Sachs disease](https://medlineplus.gov/genetics/condition/tay-sachs-disease/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-galt | [HGNC approved symbol and ID: GALT](https://rest.genenames.org/fetch/symbol/GALT) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-galactosemia | [MedlinePlus Genetics: Classic galactosemia (type I)](https://medlineplus.gov/genetics/condition/galactosemia/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-btd | [HGNC approved symbol and ID: BTD](https://rest.genenames.org/fetch/symbol/BTD) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-biotinidase-deficiency | [MedlinePlus Genetics: Biotinidase deficiency](https://medlineplus.gov/genetics/condition/biotinidase-deficiency/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-cyp21a2 | [HGNC approved symbol and ID: CYP21A2](https://rest.genenames.org/fetch/symbol/CYP21A2) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-21-hydroxylase-deficiency | [MedlinePlus Genetics: 21-hydroxylase-deficient congenital adrenal hyperplasia](https://medlineplus.gov/genetics/condition/21-hydroxylase-deficiency/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |
| hgnc-smn1 | [HGNC approved symbol and ID: SMN1](https://rest.genenames.org/fetch/symbol/SMN1) | response.docs[0].symbol, hgnc_id, status=Approved | HGNC CC0 |
| nlm-spinal-muscular-atrophy | [MedlinePlus Genetics: Spinal muscular atrophy](https://medlineplus.gov/genetics/condition/spinal-muscular-atrophy/) | Description; Causes (named gene association); Inheritance (recessive form only) | NLM Genetics public-domain summary; original wording |

## Numerical reference values and known gaps

All 36 frequency/q/detection slots have value:null, basis:illustrative, source_id:null and an explicit reason. Counts: **0 sourced numerical values; 0 populated illustrative numerical values; 36 unavailable/null slots marked illustrative**. No number is invented, converted from disease prevalence or called sourced. We did not ingest gnomAD/ClinVar variant records; gene-wide carrier/q values require a defensible population/disease-allele definition, and detection rates need a specific assay. Null never means zero. Future numbers require independently verified URL/date/exact table or field and context; the Pydantic validator rejects missing sourced-value attribution.

Names/relationships have 25 attributed records (12 HGNC, 13 NLM); they are not numerical reference values. Arabic names remain null. Severity_band:variable is broad descriptive metadata, not personalized severity or triage. CYP21A2/SMN1 are educational_only; MEFV is also educational_only because its inheritance/expression caveats exceed this gene-only demonstration. GJB2 entry selects the recessive nonsyndromic form; other inheritance/conditions are excluded. No Abu Dhabi panel equivalence, clinical validity, approval, genomic diagnosis or risk interpretation is claimed.

The checked-in JSON Schema is generated from services/api/src/app/p05/panel.py. The public version hash covers exact LF JSON bytes, pinned by .gitattributes; report v2 binds that hash. Public references never contain private records. Clinical APR/H records remain unresolved.

## P07 Education Studio — retrieved 2026-11-19

Original English wording, all cards demo-unreviewed; retrieval is not expert approval. No images, logos, GeneReviews/OMIM or licensed encyclopedia text copied. No model/RAG corpus populated.

| ID | Primary page | Checked field | Reuse / licence |
|---|---|---|---|
| edu-nlm-gene | [What is a gene?](https://medlineplus.gov/genetics/understanding/basics/gene/) | Opening explanation and two inherited copies | NLM Genetics material identified as public domain; original wording, no images or licensed encyclopedia text copied; no endorsement. [Terms](https://medlineplus.gov/about/using/usingcontent/) |
| edu-nlm-inheritance | [Patterns of inheritance](https://medlineplus.gov/genetics/understanding/inheritance/inheritancepatterns/) | Autosomal recessive row | NLM Genetics material identified as public domain; original wording, no images or licensed encyclopedia text copied; no endorsement. [Terms](https://medlineplus.gov/about/using/usingcontent/) |
| edu-nlm-chance | [Inheritance and chance](https://medlineplus.gov/genetics/understanding/inheritance/riskassessment/) | Autosomal recessive paragraph and independent pregnancies | NLM Genetics material identified as public domain; original wording, no images or licensed encyclopedia text copied; no endorsement. [Terms](https://medlineplus.gov/about/using/usingcontent/) |
| edu-nlm-results | [Interpreting genetic test results](https://medlineplus.gov/genetics/understanding/testing/interpretingresults/) | Negative results, limitations and uncertain significance | NLM Genetics material identified as public domain; original wording, no images or licensed encyclopedia text copied; no endorsement. [Terms](https://medlineplus.gov/about/using/usingcontent/) |
| edu-nlm-consult | [What happens during a genetic consultation?](https://medlineplus.gov/genetics/understanding/consult/expectations/) | Independent choices and reproductive options | NLM Genetics material identified as public domain; original wording, no images or licensed encyclopedia text copied; no endorsement. [Terms](https://medlineplus.gov/about/using/usingcontent/) |
| edu-nci-related | [NCI Dictionary: consanguinity](https://www.cancer.gov/publications/dictionaries/genetics-dictionary/def/consanguinity) | Definition: shared ancestors | NCI text free of copyright unless marked; original wording, no logos/images copied; no endorsement. [Terms](https://www.cancer.gov/policies/copyright-reuse) |

All six listed pages and both reuse-policy pages were retrieved. not_verified source list: none. UAE availability wording is an explicit limitation, not verified legal eligibility or a service claim. Teaching c/d/q presets are assumptions, not sourced frequencies.
