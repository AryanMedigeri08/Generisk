import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

from pydantic import ValidationError

from app.p04.schemas import Category, Manifest, ManifestEntry, SyntheticReport

LIBRARY_ROOT = Path(__file__).resolve().parents[5] / "data/synthetic/reports"
MAX_BYTES = 16384
MAX_DEPTH = 8
MAX_NODES = 200


class LibraryUnavailable(Exception):
    """A packaged-source failure; never include path or document values in a response."""


@dataclass(frozen=True)
class ValidationResult:
    category: Category
    reasons: list[str]
    source_hash: str | None = None
    report: SyntheticReport | None = None
    source_payload: str | None = None


def bounded_read(path: Path, root: Path, limit: int) -> bytes:
    if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
        raise LibraryUnavailable
    try:
        with path.open("rb") as source:
            payload = source.read(limit + 1)
    except OSError as exc:
        raise LibraryUnavailable from exc
    if len(payload) > limit:
        raise LibraryUnavailable
    return payload


def catalog() -> list[ManifestEntry]:
    raw = bounded_read(LIBRARY_ROOT / "manifest.json", LIBRARY_ROOT, 65536)
    try:
        manifest = Manifest.model_validate_json(raw)
    except ValidationError as exc:
        raise LibraryUnavailable from exc
    if len({entry.id for entry in manifest.fixtures}) != len(manifest.fixtures):
        raise LibraryUnavailable
    return manifest.fixtures


def unique_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON member")
        result[key] = value
    return result


def complexity(value: object, depth: int = 0) -> int:
    if depth > MAX_DEPTH:
        raise ValueError("Complexity limit")
    if isinstance(value, dict):
        count = 1 + sum(complexity(item, depth + 1) for item in value.values())
    elif isinstance(value, list):
        count = 1 + sum(complexity(item, depth + 1) for item in value)
    else:
        count = 1
    if count > MAX_NODES:
        raise ValueError("Complexity limit")
    return count


def validate_payload(payload: bytes, entry: ManifestEntry) -> ValidationResult:
    source_hash = hashlib.sha256(payload).hexdigest()
    if len(payload) > MAX_BYTES:
        return ValidationResult("malformed", ["size_limit"], source_hash)
    if source_hash != entry.sha256:
        return ValidationResult("malformed", ["source_integrity"], source_hash)
    try:
        data = json.loads(payload, object_pairs_hook=unique_object)
        complexity(data)
    except (ValueError, RecursionError, UnicodeError):
        return ValidationResult("malformed", ["structure_invalid"], source_hash)
    if not isinstance(data, dict):
        return ValidationResult("malformed", ["structure_invalid"], source_hash)
    if "schema_version" not in data:
        return ValidationResult("malformed", ["required_field_missing"], source_hash)
    if data.get("schema_version") != "amanah-report-1":
        return ValidationResult("unsupported", ["schema_unsupported"], source_hash)
    if data.get("synthetic") is not True:
        return ValidationResult("malformed", ["synthetic_required"], source_hash)
    try:
        report = SyntheticReport.model_validate_json(payload)
    except ValidationError as exc:
        errors = exc.errors(include_input=False, include_context=False, include_url=False)
        if any(error["type"] == "extra_forbidden" for error in errors):
            return ValidationResult("unsupported", ["field_unsupported"], source_hash)
        reason = "structure_invalid"
        if any(error["type"] == "missing" for error in errors):
            reason = "required_field_missing"
        elif any(error["loc"] and error["loc"][0] == "provenance" for error in errors):
            reason = "provenance_invalid"
        return ValidationResult("malformed", [reason], source_hash)
    expected_sample = "syn-sample-a" if entry.owner_id == "demo-user-a" else "syn-sample-b"
    if (
        report.owner_id != entry.owner_id
        or report.case_id != entry.case_id
        or report.sample.owner_id != entry.owner_id
        or report.sample.case_id != entry.case_id
        or report.sample.id != expected_sample
    ):
        return ValidationResult("malformed", ["source_association_invalid"], source_hash)
    incomplete = (
        report.status == "preliminary"
        or report.coverage is None
        or any(item.validity != "recorded" for item in report.observations)
        or (
            report.coverage is not None
            and {item.marker for item in report.observations} != set(report.coverage.included)
        )
    )
    return ValidationResult(
        "review_required" if incomplete else "accepted",
        ["non_interpretable_review"] if incomplete else ["structurally_supported_only"],
        source_hash,
        report,
        payload.decode("utf-8"),
    )


def validate_fixture(entry: ManifestEntry) -> ValidationResult:
    try:
        payload = bounded_read(LIBRARY_ROOT / entry.file, LIBRARY_ROOT, MAX_BYTES)
    except LibraryUnavailable:
        return ValidationResult("malformed", ["source_unavailable_or_size_limit"])
    return validate_payload(payload, entry)
