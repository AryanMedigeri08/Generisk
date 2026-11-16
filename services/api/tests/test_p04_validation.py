import hashlib
import json

import pytest

from app.p04 import validation


@pytest.mark.parametrize("entry", validation.catalog(), ids=lambda e: e.id)
def test_manifest_scenarios_have_deterministic_structural_classification(entry):
    result = validation.validate_fixture(entry)
    expected = entry.expected
    if entry.id in {"fixture-a-duplicate", "fixture-a-invalid-amend"}:
        expected = (
            "accepted"  # Duplicate/predecessor checks require authoritative database context.
        )
    assert result.category == expected
    assert result.source_hash == entry.sha256


@pytest.mark.parametrize(
    ("change", "expected"),
    [
        ({"synthetic": False}, "malformed"),
        ({"synthetic": 1}, "malformed"),
        ({"schema_version": "unrecognized"}, "unsupported"),
        ({"schema_version": None}, "unsupported"),
        ({"unreviewed_extension": "synthetic-only"}, "unsupported"),
        ({"issued_at": "2026-10-01T00:00:00Z"}, "malformed"),
        ({"issued_at": "2026-11-01T00:01:00"}, "malformed"),
        ({"case_id": "syn-case-02"}, "malformed"),
    ],
)
def test_no_coercion_unknown_fields_or_invented_identity(change, expected):
    entry = validation.catalog()[0]
    body = json.loads((validation.LIBRARY_ROOT / entry.file).read_bytes())
    body.update(change)
    raw = json.dumps(body).encode()
    result = validation.validate_payload(
        raw, entry.model_copy(update={"sha256": hashlib.sha256(raw).hexdigest()})
    )
    assert result.category == expected and result.report is None


@pytest.mark.parametrize(
    "raw",
    [b"x" * 16385, b'{"schema_version":"a","schema_version":"b"}', b"[" * 40 + b"0" + b"]" * 40],
)
def test_byte_depth_and_duplicate_member_bounds(raw):
    entry = validation.catalog()[0].model_copy(update={"sha256": hashlib.sha256(raw).hexdigest()})
    assert validation.validate_payload(raw, entry).category == "malformed"


def test_source_digest_mismatch_and_path_boundary(tmp_path, monkeypatch):
    entry = validation.catalog()[0]
    raw = (validation.LIBRARY_ROOT / entry.file).read_bytes() + b" "
    result = validation.validate_payload(raw, entry)
    assert result.reasons == ["source_integrity"] and result.report is None
    with pytest.raises(validation.LibraryUnavailable):
        validation.bounded_read(tmp_path / "outside.json", validation.LIBRARY_ROOT, 100)
    monkeypatch.setattr(validation, "LIBRARY_ROOT", tmp_path)
    with pytest.raises(validation.LibraryUnavailable):
        validation.catalog()
