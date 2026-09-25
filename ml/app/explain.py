"""Turns a trained model artifact + raw feature values into a risk score
plus real per-feature SHAP contributions, formatted the way the frontend's
ShapFactor type expects: [{ name, contribution, value }], sorted by
contribution descending (matches frontend/src/mockData/tasks.ts's mock
ordering, so no frontend change is needed).
"""

from __future__ import annotations

import numpy as np

from .features import Department, feature_spec_map, format_value


def _scalar_expected_value(explainer) -> float:
    ev = explainer.expected_value
    if isinstance(ev, (list, np.ndarray)):
        return float(np.asarray(ev).reshape(-1)[0])
    return float(ev)


def explain_task(artifact: dict, dept: Department, raw_features: dict[str, float]) -> dict:
    cols: list[str] = artifact["feature_names"]
    model = artifact["model"]
    explainer = artifact["explainer"]
    specs = feature_spec_map(dept)

    x = np.array([[raw_features[c] for c in cols]], dtype=float)

    prediction = float(model.predict(x)[0])
    prediction = max(0.0, min(100.0, prediction))

    shap_values = explainer.shap_values(x)
    shap_row = np.asarray(shap_values).reshape(-1)
    base_value = _scalar_expected_value(explainer)

    factors = []
    for i, slug in enumerate(cols):
        spec = specs[slug]
        contribution = round(float(shap_row[i]), 1)
        positive = contribution >= 0
        factors.append(
            {
                "name": spec.label,
                "contribution": contribution,
                "value": format_value(spec, raw_features[slug], positive),
            }
        )

    factors.sort(key=lambda f: f["contribution"], reverse=True)

    return {
        "riskScore": round(prediction),
        "baseValue": round(base_value, 1),
        "shapFactors": factors,
    }
