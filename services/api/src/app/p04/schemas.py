from datetime import datetime
from typing import Annotated, Final, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Marker = Literal["syn-marker-orbit", "syn-marker-lantern", "syn-marker-kite"]
Owner = Literal["demo-user-a", "demo-user-b"]
Case = Literal["syn-case-01", "syn-case-02"]
Category = Literal["accepted", "review_required", "malformed", "unsupported", "duplicate"]
FixtureId = Annotated[str, Field(pattern=r"^fixture-[a-z0-9-]{1,48}$", max_length=56)]
Handle = Annotated[str, Field(pattern=r"^[0-9a-f-]{36}$", max_length=36)]
SourceId = Annotated[str, Field(pattern=r"^syn-[a-z0-9-]{1,65}$", max_length=70)]
DISCLAIMER: Final = "Fictional synthetic report. Not clinically interpretable."


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, hide_input_in_errors=True)


class Sample(StrictModel):
    id: Literal["syn-sample-a", "syn-sample-b"]
    owner_id: Owner
    case_id: Case


class Coverage(StrictModel):
    included: list[Marker] = Field(min_length=1, max_length=3)
    excluded: list[Marker] = Field(max_length=3)
    limitations: list[Literal["fictional-only", "limited-panel"]] = Field(
        min_length=1, max_length=2
    )


class Observation(StrictModel):
    id: SourceId
    marker: Marker
    value_type: Literal["synthetic-token"]
    value: Literal["demo-token-amber", "demo-token-blue"] | None
    validity: Literal["recorded", "missing", "uncertain"]


class Source(StrictModel):
    source_id: Literal["syn-source-fixture-library"]
    generated_by: Literal["syn-fictional-author"]
    source_version: int = Field(ge=1, le=20)


class SyntheticReport(StrictModel):
    schema_version: Literal["amanah-report-1"]
    synthetic: Literal[True]
    report_id: SourceId
    revision_id: SourceId
    revision: int = Field(ge=1, le=20)
    owner_id: Owner
    case_id: Case
    laboratory_id: Literal["syn-lab-imaginary"]
    sample: Sample
    created_at: datetime
    issued_at: datetime
    panel: Literal["syn-panel-widgets"]
    coverage: Coverage | None
    observations: list[Observation] = Field(min_length=1, max_length=3)
    status: Literal["final", "preliminary", "amended"]
    supersedes_revision_id: SourceId | None
    amendment_reason: Literal["synthetic-field-correction", "synthetic-coverage-correction"] | None
    provenance: Source
    disclaimer: Literal["Fictional synthetic report. Not clinically interpretable."]

    @model_validator(mode="after")
    def consistency(self) -> "SyntheticReport":
        if self.created_at.tzinfo is None or self.issued_at.tzinfo is None:
            raise ValueError("Timezone required")
        if self.created_at > self.issued_at or self.provenance.source_version != self.revision:
            raise ValueError("Source timeline/version inconsistent")
        if len({item.id for item in self.observations}) != len(self.observations):
            raise ValueError("Conflicting observation identifiers")
        if len({item.marker for item in self.observations}) != len(self.observations):
            raise ValueError("Conflicting marker observations")
        if any((item.value is None) != (item.validity != "recorded") for item in self.observations):
            raise ValueError("Observation validity inconsistent")
        if self.coverage:
            included, excluded = self.coverage.included, self.coverage.excluded
            if len(set(included)) != len(included) or len(set(excluded)) != len(excluded):
                raise ValueError("Coverage duplicated")
            if set(included) & set(excluded):
                raise ValueError("Coverage conflicting")
            if any(item.marker not in included for item in self.observations):
                raise ValueError("Observation outside declared scope")
        if self.status == "amended":
            if self.revision < 2 or not self.supersedes_revision_id or not self.amendment_reason:
                raise ValueError("Amendment relationship required")
        elif self.revision != 1 or self.supersedes_revision_id or self.amendment_reason:
            raise ValueError("Initial version inconsistent")
        return self


class ManifestEntry(StrictModel):
    id: FixtureId
    file: Annotated[str, Field(pattern=r"^(valid|invalid)/[a-z0-9-]+\.json$", max_length=90)]
    sha256: Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]
    owner_id: Owner
    case_id: Case
    label: str = Field(max_length=100)
    operation: Literal["import", "amend"]
    expected: Category


class Manifest(StrictModel):
    manifest_version: Literal[1]
    synthetic_only: Literal[True]
    fixtures: list[ManifestEntry] = Field(min_length=1, max_length=30)


class ImportIn(StrictModel):
    fixture_id: FixtureId
    expected_input_version: int = Field(ge=1, le=1000000)
    idempotency_key: str = Field(min_length=8, max_length=64, pattern=r"^[a-zA-Z0-9-]+$")


class AmendIn(ImportIn):
    report_handle: Handle
    expected_revision: int = Field(ge=1, le=20)


class SelectIn(StrictModel):
    report_handle: Handle
    revision_handle: Handle | None = None


class FixtureOut(BaseModel):
    id: str
    label: str
    operation: Literal["import", "amend"]
    expected: Category


class Receipt(BaseModel):
    outcome_handle: str
    category: Category
    reason_codes: list[str]
    report_handle: str | None
    revision_handle: str | None
    input_version_after: int
    current_input_version: int
    replayed: bool = False
    synthetic_only: Literal[True] = True
    clinical_interpretation: Literal[False] = False


class HistoryOut(Receipt):
    operation: Literal["import", "amend"]
    fixture_id: str
    created_at: datetime


class VersionOut(BaseModel):
    revision_handle: str
    source_revision_id: str
    version: int
    state: Literal["active", "superseded", "review_required"]
    validation_state: Literal["accepted", "review_required"]
    supersedes_revision_handle: str | None
    amendment_reason: str | None
    imported_at: datetime
    validated_at: datetime
    source_sha256: str
    fixture_id: str
    imported_by: str


class ReportOut(BaseModel):
    report_handle: str
    source_report_id: str
    active_revision_handle: str | None
    versions: list[VersionOut]
    synthetic_only: Literal[True] = True


class ContentOut(BaseModel):
    report_handle: str
    revision: VersionOut
    content: SyntheticReport
    disclaimer: Literal["Fictional synthetic report. Not clinically interpretable."] = DISCLAIMER
