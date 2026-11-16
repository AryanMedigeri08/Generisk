import copy
import hashlib
import json

import pytest
from pydantic import ValidationError

from app.p05 import panel


def raw_panel():
    return json.loads(panel.PANEL_PATH.read_bytes())


def validate(data):
    return panel.DemoPanel.model_validate_json(json.dumps(data))


def test_panel_schema_sources_counts_and_stable_exact_hash():
    loaded = panel.load_panel()
    assert len(loaded.panel.genes) == 12
    assert sum(len(g.conditions) for g in loaded.panel.genes) == 13
    assert loaded.version == hashlib.sha256(panel.PANEL_PATH.read_bytes()).hexdigest()
    expected = panel.DemoPanel.model_json_schema()
    expected["$schema"] = "https://json-schema.org/draft/2020-12/schema"
    assert json.loads(panel.PANEL_PATH.with_suffix(".schema.json").read_bytes()) == expected
    refs = [
        r
        for g in loaded.panel.genes
        for r in (
            g.reference_values.carrier_frequency,
            g.reference_values.allele_frequency_q,
            g.reference_values.detection_rate,
        )
    ]
    assert len(refs) == 36 and all(r.value is None and r.basis == "illustrative" for r in refs)
    assert len(loaded.panel.sources) == 25
    assert all(
        s.url.scheme == "https" and s.retrieved_on and s.field and s.license_note
        for s in loaded.panel.sources
    )
    assert all(
        g.engine_support == "educational_only"
        for g in loaded.panel.genes
        if g.gene_symbol in {"CYP21A2", "SMN1", "MEFV"}
    )


@pytest.mark.parametrize(
    "mutation",
    [
        "duplicate_gene",
        "duplicate_hgnc",
        "bad_symbol",
        "missing_source",
        "sourced_without_id",
        "sourced_without_value",
        "missing_url",
        "bad_date",
        "no_illustrative_reason",
        "no_license",
        "complex_supported",
        "duplicate_condition",
    ],
)
def test_panel_rejects_bad_identity_attribution_and_unexplained_values(mutation):
    body = raw_panel()
    if mutation == "duplicate_gene":
        body["genes"][1]["gene_symbol"] = body["genes"][0]["gene_symbol"]
    elif mutation == "duplicate_hgnc":
        body["genes"][1]["hgnc_id"] = body["genes"][0]["hgnc_id"]
    elif mutation == "bad_symbol":
        body["genes"][0]["gene_symbol"] = "hbb<script>"
    elif mutation == "missing_source":
        body["genes"][0]["symbol_source_id"] = "absent"
    elif mutation == "sourced_without_id":
        body["genes"][0]["reference_values"]["carrier_frequency"].update(value=0.1, basis="sourced")
    elif mutation == "sourced_without_value":
        body["genes"][0]["reference_values"]["carrier_frequency"].update(
            basis="sourced", source_id="hgnc-hbb"
        )
    elif mutation == "missing_url":
        del body["sources"][0]["url"]
    elif mutation == "bad_date":
        body["sources"][0]["retrieved_on"] = "unknown"
    elif mutation == "no_illustrative_reason":
        body["genes"][0]["reference_values"]["detection_rate"]["note"] = ""
    elif mutation == "no_license":
        body["sources"][0]["license_note"] = ""
    elif mutation == "complex_supported":
        next(g for g in body["genes"] if g["gene_symbol"] == "SMN1")["engine_support"] = "supported"
    elif mutation == "duplicate_condition":
        body["genes"][0]["conditions"].append(copy.deepcopy(body["genes"][0]["conditions"][0]))
    with pytest.raises(ValidationError):
        validate(body)


def test_panel_source_failure_is_safe_and_does_not_call_network(monkeypatch, tmp_path):
    original = panel.PANEL_PATH
    monkeypatch.setattr(panel, "PANEL_PATH", tmp_path / "missing.json")
    panel.load_panel.cache_clear()
    with pytest.raises(panel.PanelUnavailable, match="Public reference panel unavailable"):
        panel.load_panel()
    monkeypatch.setattr(panel, "PANEL_PATH", original)
    panel.load_panel.cache_clear()


def test_public_panel_and_detail_need_no_session_and_expose_no_mutation(client):
    response = client.get("/api/v1/panel")
    assert response.status_code == 200
    body = response.json()
    assert body["panel"]["label"] == panel.PANEL_LABEL
    assert body["panel_version"] == panel.load_panel().version
    detail = client.get("/api/v1/panel/CFTR").json()
    assert (
        detail["gene"]["hgnc_id"] == "HGNC:1884"
        and detail["panel_version"] == body["panel_version"]
    )
    assert client.get("/api/v1/panel/UNKNOWN").status_code == 404
    for method in ("post", "put", "patch", "delete"):
        for path in ("/api/v1/panel", "/api/v1/panel/CFTR"):
            assert getattr(client, method)(path).status_code == 405
    assert "password" not in response.text and "session" not in response.text
    assert client.get("/api/v1/private/cases/syn-case-01").status_code == 401
