import hashlib
import json
import re
from fractions import Fraction
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.p04.schemas import GeneReport
from app.p04.validation import LIBRARY_ROOT, catalog, validate_fixture
from app.p05.panel import PANEL_PATH
from app.p06 import provider
from app.p06.engine.core import F_TABLE, mendelian, population_outcomes, residual
from app.p06.references import PATH, References, load_references
from app.p06.schemas import LABEL, WhatIf


def request(**kwargs):
    return WhatIf.model_validate_json(json.dumps({"gene_symbol": "CFTR", **kwargs}))


def exact(number):
    return Fraction(number["exact"]["num"], number["exact"]["den"])


@pytest.mark.parametrize(
    ("a", "b", "expected"),
    [
        (True, True, (Fraction(1, 4), Fraction(1, 2), Fraction(1, 4))),
        (True, False, (Fraction(0), Fraction(1, 2), Fraction(1, 2))),
        (False, True, (Fraction(0), Fraction(1, 2), Fraction(1, 2))),
        (False, False, (Fraction(0), Fraction(0), Fraction(1))),
    ],
)
def test_mendelian_gold_and_probability_properties(a, b, expected):
    outcomes = mendelian(a, b)
    assert tuple(outcomes.values()) == expected
    assert sum(outcomes.values(), Fraction(0)) == 1
    assert outcomes["affected"] <= Fraction(int(a and b), 4)


def test_population_and_residual_gold_are_test_only_values():
    out = population_outcomes(Fraction(1, 50), F_TABLE["first_cousins"])
    assert out["related"] == Fraction(13, 8000)
    assert out["unrelated"] == Fraction(1, 2500)
    assert out["ratio"] == Fraction(65, 16)
    assert residual(Fraction(1, 25), Fraction(9, 10)) == Fraction(1, 241)
    assert population_outcomes(Fraction(1, 50), F_TABLE["double_first_cousins"])[
        "related"
    ] == Fraction(57, 20000)


def test_f_table_monotonicity_and_residual_properties():
    assert list(F_TABLE.values()) == [
        Fraction(0),
        Fraction(1, 64),
        Fraction(1, 32),
        Fraction(1, 16),
        Fraction(1, 8),
    ]
    for numerator in range(1, 50):
        q = Fraction(numerator, 50)
        values = [population_outcomes(q, f)["related"] for f in F_TABLE.values()]
        assert values == sorted(values) and all(0 < v < 1 for v in values)
    for numerator in range(1, 25):
        c = Fraction(numerator, 25)
        assert residual(c, Fraction(0)) == c
        assert residual(c, Fraction(1)) == 0
        for detection in range(1, 10):
            assert 0 < residual(c, Fraction(detection, 10)) < c
    for value in (float("nan"), float("inf"), 0.1, 1):
        with pytest.raises(ValueError):
            population_outcomes(value, Fraction(0))


@pytest.mark.parametrize(
    "updates",
    [
        {"q": {"num": 0, "den": 1}},
        {"q": {"num": 1, "den": 1}},
        {"q": {"num": -1, "den": 2}},
        {"q": {"num": 1, "den": 0}},
        {"q": {"num": True, "den": 2}},
        {"q": {"num": 1.5, "den": 2}},
        {"q": {"num": 10**10, "den": 2}},
        {"q": float("nan")},
        {"q": float("inf")},
        {"q": {"num": 1, "den": 2}, "population": "unspecified"},
        {"relationship": "invented"},
        {"free_text": "invented"},
        {"a_status": "carrier"},
    ],
)
def test_whatif_rejects_unbounded_nonexact_or_wrong_mode_inputs(updates):
    with pytest.raises(ValidationError):
        request(
            mode="consanguinity",
            population="user_scenario",
            **{k: v for k, v in updates.items() if k != "population"},
        ) if "population" not in updates else request(mode="consanguinity", **updates)


def test_public_engine_basis_unknowns_and_no_related_residual_estimate():
    p = provider.EducationalRulesProvider()
    computed = p.evaluate(
        request(
            mode="consanguinity",
            relationship="first_cousins",
            population="user_scenario",
            q={"num": 1, "den": 50},
        )
    ).model_dump()
    assert exact(computed["numbers"]["related"]) == Fraction(13, 8000)
    assert computed["numbers"]["q"]["basis"] == "user_scenario"
    assert computed["numbers"]["related"]["basis"] == "derived"
    for rel in ("unrelated", "first_cousins"):
        out = p.evaluate(
            request(
                mode="residual",
                population="user_scenario",
                relationship=rel,
                c={"num": 1, "den": 25},
                d={"num": 9, "den": 10},
            )
        )
        assert exact(out.model_dump()["numbers"]["posterior_carrier"]) == Fraction(1, 241)
        assert out.couple_state == "NOT_COMPUTED"
    for mode in ("consanguinity", "residual"):
        assert p.evaluate(request(mode=mode)).numbers == {}
    out = p.evaluate(
        request(
            mode="consanguinity",
            relationship="not_sure",
            population="user_scenario",
            q={"num": 1, "den": 50},
        )
    )
    assert out.state == "UNKNOWN" and out.numbers == {}
    for symbol in ("MEFV", "CYP21A2", "SMN1", "UNKNOWN"):
        out = p.evaluate(
            request(mode="mendelian", gene_symbol=symbol, a_status="carrier", b_status="carrier")
        )
        assert not out.numbers and not out.genes
        assert out.state == (
            "UNSUPPORTED" if symbol == "UNKNOWN" else "EDUCATIONAL_ONLY_NO_CALCULATION"
        )


def fixture(suffix):
    entry = next(e for e in catalog() if e.id == "fixture-" + suffix)
    report = validate_fixture(entry).report
    assert isinstance(report, GeneReport)
    return report


@pytest.mark.parametrize(
    ("a", "b", "gene", "state"),
    [
        ("a-v2-none", "b-v2-none", "CFTR", "NEITHER_CARRIER"),
        ("a-v2-carrier-cftr", "b-v2-none", "CFTR", "SINGLE_CARRIER"),
        ("a-v2-carrier-cftr", "b-v2-carrier-cftr", "CFTR", "SHARED_CARRIER"),
        ("a-v2-carrier-hbb", "b-v2-carrier-hbb", "HBB", "SHARED_CARRIER"),
        ("a-v2-carrier-cftr", "b-v2-carrier-hbb", "CFTR", "SINGLE_CARRIER"),
        ("a-v2-carrier-cftr", "b-v2-carrier-hbb", "HBB", "SINGLE_CARRIER"),
        ("a-v2-amend-none-cftr", "b-v2-carrier-cftr", "CFTR", "SHARED_CARRIER"),
    ],
)
def test_v2_scenario_matrix(a, b, gene, state):
    out = provider.EducationalRulesProvider().pair(fixture(a), fixture(b))
    found = next(g for g in out.genes if g.gene_symbol == gene)
    assert found.state == state
    if state == "SHARED_CARRIER":
        assert "GENE_LEVEL_ONLY" in found.caveat_codes
    for g in out.genes:
        if g.gene_symbol in {"MEFV", "CYP21A2", "SMN1"}:
            assert g.state == "EDUCATIONAL_ONLY_NO_CALCULATION" and not g.numbers


@pytest.mark.parametrize("b", ["b-v2-uncertain-cftr", "b-v2-cftr-not-tested"])
def test_unknown_report_inputs_suppress_every_number(b):
    out = provider.EducationalRulesProvider().pair(fixture("a-v2-carrier-cftr"), fixture(b))
    assert out.state == "REVIEW_REQUIRED" and not out.genes and not out.numbers


def test_missing_validity_coverage_and_versions_never_calculate():
    p = provider.EducationalRulesProvider()
    for changes in ({"coverage": None}, {"status": "preliminary"}):
        out = p.pair(fixture("a-v2-none").model_copy(update=changes), fixture("b-v2-none"))
        assert out.state == "REVIEW_REQUIRED" and not out.genes
    a = fixture("a-v2-none")
    a.observations[0].validity = "uncertain"
    assert p.own(a).state == "REVIEW_REQUIRED"
    for changes in ({"panel_version": "0" * 64}, {"schema_version": "unknown"}):
        assert p.own(a.model_copy(update=changes)).state == "UNSUPPORTED"


def test_deterministic_bytes_rules_hash_and_no_verdict_keys(monkeypatch, tmp_path):
    p = provider.EducationalRulesProvider()
    outputs = [p.pair(fixture("a-v2-carrier-cftr"), fixture("b-v2-carrier-cftr"))]
    for a in ("carrier", "no_pathogenic_variant_detected", "variant_uncertain", "not_tested"):
        arg = request(mode="mendelian", a_status=a, b_status=a)
        out = p.evaluate(arg)
        assert out.model_dump_json() == p.evaluate(arg).model_dump_json()
        outputs.append(out)
    banned = re.compile(
        r"\b(compatible|incompatible|pass|fail|safe|unsafe)\b|(?:high|low)[ _-]risk", re.I
    )
    for out in outputs:
        assert out.label == LABEL and out.each_pregnancy_independent
        assert not banned.search(out.model_dump_json())
    for e in catalog():
        assert not banned.search((LIBRARY_ROOT / e.file).read_text(encoding="utf-8"))
    for name in ["engine/core.py", "provider.py", "schemas.py"]:
        dest = tmp_path / name
        dest.parent.mkdir(exist_ok=True)
        dest.write_bytes((Path(provider.__file__).parent / name).read_bytes())
    monkeypatch.setattr(provider, "__file__", str(tmp_path / "provider.py"))
    original = provider.rules_hash()
    with (tmp_path / "engine/core.py").open("ab") as f:
        f.write(b"\n# test-only rule source change\n")
    assert original != provider.rules_hash()


def test_separate_reference_schema_counts_and_original_panel_hash():
    refs = load_references()
    expected = References.model_json_schema()
    expected["$schema"] = "https://json-schema.org/draft/2020-12/schema"
    assert json.loads(PATH.with_suffix(".schema.json").read_bytes()) == expected
    assert len(refs.data.entries) == 12
    assert all(e.population == "unspecified" for e in refs.data.entries)
    assert all(
        v["value"] is None
        for e in refs.data.entries
        for v in e.reference_values.model_dump().values()
    )
    assert (
        hashlib.sha256(PANEL_PATH.read_bytes()).hexdigest()
        == "c92acb05afe29452a4cf1ed30c8ebf6502e019c829e1a870d9a55959835ad3bf"
    )


def test_largest_wire_inputs_keep_exact_output_integers_within_javascript_range():
    p = provider.EducationalRulesProvider()
    for q in ({"num": 1, "den": 1000000}, {"num": 999999, "den": 1000000}):
        out = p.evaluate(
            request(
                mode="consanguinity",
                population="user_scenario",
                relationship="double_first_cousins",
                q=q,
            )
        )
        for value in out.numbers.values():
            assert abs(value.exact.num) < 2**53 and value.exact.den < 2**53
    for c in ({"num": 1, "den": 1000000}, {"num": 999999, "den": 1000000}):
        out = p.evaluate(
            request(
                mode="residual", population="user_scenario", c=c, d={"num": 999999, "den": 1000000}
            )
        )
        for value in out.numbers.values():
            assert abs(value.exact.num) < 2**53 and value.exact.den < 2**53
