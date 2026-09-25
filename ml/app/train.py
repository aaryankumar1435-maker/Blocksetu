"""Train one gradient-boosted risk model per department on synthetic data
and save it (with its SHAP explainer and evaluation metrics) to disk.

Run with:  python -m app.train
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import joblib
import numpy as np
import shap
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from .features import DEPT_SLUG, FEATURES_BY_DEPT, Department, feature_names
from .synthetic_data import generate_dataset

SEED = 20260924
N_SAMPLES = 6000
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def train_department(dept: Department) -> dict:
    cols = feature_names(dept)
    df = generate_dataset(dept, N_SAMPLES, seed=SEED)
    X = df[cols].to_numpy()
    y = df["risk_score"].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=SEED)

    model = GradientBoostingRegressor(
        n_estimators=350,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.85,
        random_state=SEED,
    )
    model.fit(X_train, y_train)

    pred = model.predict(X_test)
    metrics = {
        "mae": float(mean_absolute_error(y_test, pred)),
        "r2": float(r2_score(y_test, pred)),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
    }

    explainer = shap.TreeExplainer(model)
    defaults = {c: float(df[c].median()) for c in cols}

    artifact = {
        "department": dept,
        "feature_names": cols,
        "model": model,
        "explainer": explainer,
        "metrics": metrics,
        "defaults": defaults,
        "trained_at": time.time(),
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = MODELS_DIR / f"{DEPT_SLUG[dept]}.joblib"
    joblib.dump(artifact, out_path)
    return metrics


def main() -> None:
    all_metrics: dict[str, dict] = {}
    for dept in FEATURES_BY_DEPT:
        print(f"Training {dept}...")
        metrics = train_department(dept)
        print(f"  MAE={metrics['mae']:.2f}  R2={metrics['r2']:.3f}  (n_train={metrics['n_train']}, n_test={metrics['n_test']})")
        all_metrics[dept] = metrics

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\nSaved models + metrics to {MODELS_DIR}")


if __name__ == "__main__":
    main()
