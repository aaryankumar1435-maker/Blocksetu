"""Per-department feature schema for the risk-scoring model.

Feature labels intentionally match the SHAP factor names already used by
the frontend/backend mock data (see frontend/src/mockData/tasks.ts
SHAP_POOL) so a real model's explanations slot into the existing UI
without any renaming.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Department = Literal["ENG", "S&T", "TRD"]

FeatureKind = Literal["continuous", "binary", "tristate"]


@dataclass(frozen=True)
class FeatureSpec:
    slug: str
    label: str
    unit: str
    min: float
    max: float
    # True if a *higher raw value* generally makes the feature look worse
    # (used only for synthetic-data direction / default formatting; the
    # model and SHAP values are what actually drive the sign shown to users).
    higher_is_worse: bool
    kind: FeatureKind = "continuous"
    default: float | None = None

    def clamp(self, value: float) -> float:
        return max(self.min, min(self.max, value))

    def normalized(self, value: float) -> float:
        span = self.max - self.min
        if span <= 0:
            return 0.0
        return (self.clamp(value) - self.min) / span


ENG_FEATURES: list[FeatureSpec] = [
    FeatureSpec("track_geometry_trend", "Track geometry trend (TRC)", "pts", 0, 100, True),
    FeatureSpec("traffic_density", "Traffic density on section", "GMT/annum", 5, 100, True),
    FeatureSpec("rail_age", "Rail age", "yrs", 0, 45, True),
    FeatureSpec("prior_defect_recurrence", "Prior defect recurrence", "count/2yr", 0, 8, True),
    FeatureSpec("curvature_severity", "Curvature severity", "deg", 0, 10, True),
    FeatureSpec("temperature_differential", "Temperature differential", "°C", 5, 45, True),
    FeatureSpec("axle_load_class", "Axle load class", "t", 16, 25, True),
    FeatureSpec("days_since_maintenance", "Days since last maintenance", "days", 0, 400, True),
]

SNT_FEATURES: list[FeatureSpec] = [
    FeatureSpec("failure_frequency_90d", "Failure frequency (90d)", "count", 0, 12, True),
    FeatureSpec("asset_age", "Asset age", "yrs", 0, 30, True),
    FeatureSpec("redundancy_available", "Redundancy available", "", 0, 1, False, kind="binary"),
    FeatureSpec("monsoon_exposure", "Monsoon/weather exposure", "pts", 0, 100, True),
    FeatureSpec("maintenance_backlog", "Maintenance backlog on asset", "open WOs", 0, 15, True),
    FeatureSpec("route_criticality", "Route criticality", "pts", 0, 100, True),
    FeatureSpec("vendor_amc_status", "Vendor AMC status", "", 0, 1, False, kind="tristate"),
]

TRD_FEATURES: list[FeatureSpec] = [
    FeatureSpec("wire_wear_pct", "Wire wear %", "%", 0, 45, True),
    FeatureSpec("span_tension_trend", "Span tension trend", "pts", 0, 100, True),
    FeatureSpec("emu_traffic_frequency", "EMU traffic frequency", "trains/day", 50, 400, True),
    FeatureSpec("ambient_temp_swing", "Ambient temperature swing", "°C", 5, 40, True),
    FeatureSpec("days_since_inspection", "Days since last inspection", "days", 0, 365, True),
    FeatureSpec("mast_condition_index", "Mast condition index", "pts", 0, 100, True),
]

FEATURES_BY_DEPT: dict[Department, list[FeatureSpec]] = {
    "ENG": ENG_FEATURES,
    "S&T": SNT_FEATURES,
    "TRD": TRD_FEATURES,
}

DEPT_SLUG = {"ENG": "eng", "S&T": "snt", "TRD": "trd"}
SLUG_DEPT = {v: k for k, v in DEPT_SLUG.items()}


def feature_names(dept: Department) -> list[str]:
    return [f.slug for f in FEATURES_BY_DEPT[dept]]


def feature_spec_map(dept: Department) -> dict[str, FeatureSpec]:
    return {f.slug: f for f in FEATURES_BY_DEPT[dept]}


def format_value(spec: FeatureSpec, raw_value: float, positive_contribution: bool) -> str:
    tag = "elevated" if positive_contribution else "favorable"
    if spec.kind == "binary":
        state = "Available" if raw_value >= 0.5 else "Not available"
        return f"{state} ({tag})"
    if spec.kind == "tristate":
        if raw_value >= 0.75:
            state = "Current"
        elif raw_value >= 0.25:
            state = "Lapsing"
        else:
            state = "Expired"
        return f"{state} ({tag})"
    if spec.unit == "%":
        return f"{raw_value:.0f}% ({tag})"
    if spec.unit:
        return f"{raw_value:.0f} {spec.unit} ({tag})"
    return f"{raw_value:.0f} ({tag})"
