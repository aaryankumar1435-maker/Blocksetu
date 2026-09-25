from __future__ import annotations

import json
from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .explain import explain_task
from .features import DEPT_SLUG, FEATURES_BY_DEPT, Department
from .schemas import (
    BatchPredictRequest,
    BatchPredictResultItem,
    FeatureSpecOut,
    ModelMetrics,
    PredictRequest,
    PredictResponse,
)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

app = FastAPI(title="BlockSetu risk-scoring service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_ARTIFACTS: dict[Department, dict] = {}
_METRICS: dict[str, dict] = {}


@app.on_event("startup")
def load_models() -> None:
    for dept, slug in DEPT_SLUG.items():
        path = MODELS_DIR / f"{slug}.joblib"
        if not path.exists():
            continue
        _ARTIFACTS[dept] = joblib.load(path)

    metrics_path = MODELS_DIR / "metrics.json"
    if metrics_path.exists():
        _METRICS.update(json.loads(metrics_path.read_text()))


def _require_artifact(dept: Department) -> dict:
    artifact = _ARTIFACTS.get(dept)
    if artifact is None:
        raise HTTPException(
            status_code=503,
            detail=f"No trained model for department '{dept}'. Run `python -m app.train` first.",
        )
    return artifact


@app.get("/health")
def health() -> dict:
    return {"ok": True, "departmentsLoaded": list(_ARTIFACTS.keys())}


@app.get("/features/{department}", response_model=list[FeatureSpecOut])
def get_features(department: Department):
    if department not in FEATURES_BY_DEPT:
        raise HTTPException(404, f"Unknown department '{department}'")
    return [
        FeatureSpecOut(
            slug=f.slug,
            label=f.label,
            unit=f.unit,
            min=f.min,
            max=f.max,
            kind=f.kind,
            higherIsWorse=f.higher_is_worse,
        )
        for f in FEATURES_BY_DEPT[department]
    ]


@app.get("/metrics", response_model=dict[str, ModelMetrics])
def get_metrics():
    return _METRICS


def _resolve_features(artifact: dict, requested: dict[str, float], fill_defaults: bool) -> tuple[dict[str, float], list[str]]:
    cols: list[str] = artifact["feature_names"]
    defaults: dict[str, float] = artifact.get("defaults", {})
    resolved: dict[str, float] = {}
    used_defaults: list[str] = []

    for c in cols:
        if c in requested:
            resolved[c] = float(requested[c])
        elif fill_defaults and c in defaults:
            resolved[c] = defaults[c]
            used_defaults.append(c)
        else:
            raise HTTPException(422, f"Missing feature '{c}' and fillMissingWithDefaults is false.")
    return resolved, used_defaults


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    artifact = _require_artifact(req.department)
    resolved, used_defaults = _resolve_features(artifact, req.features, req.fillMissingWithDefaults)
    result = explain_task(artifact, req.department, resolved)
    return PredictResponse(department=req.department, usedDefaults=used_defaults, **result)


@app.post("/predict/batch", response_model=list[BatchPredictResultItem])
def predict_batch(items: BatchPredictRequest):
    results: list[BatchPredictResultItem] = []
    for item in items.root:
        try:
            artifact = _require_artifact(item.department)
            resolved, _used = _resolve_features(artifact, item.features, item.fillMissingWithDefaults)
            result = explain_task(artifact, item.department, resolved)
            results.append(BatchPredictResultItem(id=item.id, department=item.department, **result))
        except HTTPException as e:
            results.append(BatchPredictResultItem(id=item.id, department=item.department, error=str(e.detail)))
    return results
