"""Synthetic-but-realistic training data generator.

Each department gets its own generator. Raw feature values are drawn with
a shared latent "asset condition" factor so features correlate the way
real inspection data would (a neglected asset tends to be old *and*
overdue *and* defect-prone at once, not independently random) rather than
being i.i.d. noise. The ground-truth risk score is a nonlinear function of
the normalized features (weighted sum + a couple of interaction terms)
plus observation noise, so the regression problem is genuinely learnable
but not trivially memorizable.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .features import Department, FEATURES_BY_DEPT, FeatureSpec

RISK_NOISE_STD = 6.0
RISK_MIN, RISK_MAX = 2.0, 99.0


def _draw_feature(rng: np.random.Generator, spec: FeatureSpec, condition: np.ndarray) -> np.ndarray:
    """Sample n=len(condition) raw values for one feature.

    `condition` is a per-sample latent "neglect" factor in [0, 1]; higher
    condition pushes worse-direction features up (and better-direction
    features, like redundancy/AMC currency, down) before adding noise.
    """
    n = len(condition)
    span = spec.max - spec.min

    if spec.kind == "binary":
        # Redundancy is less likely to be available on more-neglected assets.
        p_available = np.clip(0.75 - 0.5 * condition, 0.05, 0.95)
        return (rng.random(n) < p_available).astype(float)

    if spec.kind == "tristate":
        # AMC currency: 1 = current, 0.5 = lapsing, 0 = expired.
        p_current = np.clip(0.7 - 0.55 * condition, 0.03, 0.95)
        p_expired = np.clip(0.05 + 0.5 * condition, 0.03, 0.85)
        u = rng.random(n)
        out = np.where(u < p_expired, 0.0, np.where(u < p_expired + (1 - p_current - p_expired).clip(0, 1), 0.5, 1.0))
        return out

    center = spec.min + span * (0.25 + 0.55 * condition if spec.higher_is_worse else 0.75 - 0.55 * condition)
    noise = rng.normal(0, span * 0.14, n)
    values = center + noise
    return np.clip(values, spec.min, spec.max)


def _interaction_terms(dept: Department, df: pd.DataFrame) -> np.ndarray:
    if dept == "ENG":
        rail_age_n = (df["rail_age"] - 0) / 45
        overdue_n = (df["days_since_maintenance"] - 0) / 400
        curve_n = df["curvature_severity"] / 10
        traffic_n = (df["traffic_density"] - 5) / 95
        return 14 * (rail_age_n * overdue_n) + 8 * (curve_n * traffic_n)
    if dept == "S&T":
        fail_n = df["failure_frequency_90d"] / 12
        backlog_n = df["maintenance_backlog"] / 15
        return 16 * (fail_n * backlog_n)
    # TRD
    wear_n = df["wire_wear_pct"] / 45
    traffic_n = (df["emu_traffic_frequency"] - 50) / 350
    return 15 * (wear_n * traffic_n)


# weight applied to each feature's normalized value; negative = protective.
_WEIGHTS: dict[Department, dict[str, float]] = {
    "ENG": {
        "track_geometry_trend": 16,
        "traffic_density": 10,
        "rail_age": 9,
        "prior_defect_recurrence": 15,
        "curvature_severity": 9,
        "temperature_differential": 7,
        "axle_load_class": 9,
        "days_since_maintenance": 15,
    },
    "S&T": {
        "failure_frequency_90d": 20,
        "asset_age": 11,
        "redundancy_available": -14,
        "monsoon_exposure": 9,
        "maintenance_backlog": 13,
        "route_criticality": 13,
        "vendor_amc_status": -16,
    },
    "TRD": {
        "wire_wear_pct": 21,
        "span_tension_trend": 13,
        "emu_traffic_frequency": 11,
        "ambient_temp_swing": 9,
        "days_since_inspection": 19,
        "mast_condition_index": 21,
    },
}


def generate_dataset(dept: Department, n: int, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    specs = FEATURES_BY_DEPT[dept]

    # Beta(2,3.5) skews toward well-maintained assets with a long tail of
    # badly neglected ones — closer to a real maintenance backlog than
    # a uniform distribution of "neglect".
    condition = rng.beta(2.0, 3.5, n)

    data = {spec.slug: _draw_feature(rng, spec, condition) for spec in specs}
    df = pd.DataFrame(data)

    weights = _WEIGHTS[dept]
    raw = np.zeros(n)
    for spec in specs:
        norm = (df[spec.slug] - spec.min) / (spec.max - spec.min)
        if spec.kind in ("binary", "tristate"):
            # already 0..1 in the "good" direction for these two features
            norm = df[spec.slug]
        raw += weights[spec.slug] * norm

    raw += _interaction_terms(dept, df)
    raw += rng.normal(0, RISK_NOISE_STD, n)

    df["risk_score"] = np.clip(raw, RISK_MIN, RISK_MAX)
    return df
