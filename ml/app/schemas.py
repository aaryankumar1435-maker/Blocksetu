from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, RootModel

Department = Literal["ENG", "S&T", "TRD"]


class FeatureSpecOut(BaseModel):
    slug: str
    label: str
    unit: str
    min: float
    max: float
    kind: str
    higherIsWorse: bool


class PredictRequest(BaseModel):
    department: Department
    features: dict[str, float] = Field(default_factory=dict)
    # If true, any feature missing from `features` is filled with a
    # dataset-realistic default instead of raising a 422.
    fillMissingWithDefaults: bool = False


class ShapFactorOut(BaseModel):
    name: str
    contribution: float
    value: str


class PredictResponse(BaseModel):
    department: Department
    riskScore: int
    baseValue: float
    shapFactors: list[ShapFactorOut]
    usedDefaults: list[str] = Field(default_factory=list)


class BatchPredictItem(BaseModel):
    id: str
    department: Department
    features: dict[str, float] = Field(default_factory=dict)
    fillMissingWithDefaults: bool = False


class BatchPredictRequest(RootModel[list[BatchPredictItem]]):
    pass


class BatchPredictResultItem(BaseModel):
    id: str
    department: Department
    riskScore: int | None = None
    baseValue: float | None = None
    shapFactors: list[ShapFactorOut] = Field(default_factory=list)
    error: str | None = None


class ModelMetrics(BaseModel):
    mae: float
    r2: float
    n_train: int
    n_test: int
