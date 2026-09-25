# BlockSetu backend

REST API for the BlockSetu railway block-working-plan dashboard. Node.js +
Express + TypeScript, PostgreSQL via Prisma.

## Domain model

Mirrors `frontend/src/types.ts`: `BlockSection`, `Defect`, `Task`,
`ScheduledBlock`, `PlanVersion`, `RePlanTrigger`, `Comment`. See
`prisma/schema.prisma` for the full schema. The API's `department` field uses
`'S&T'` (matching the frontend); internally Postgres stores it as the `SNT`
enum value since Prisma enums can't contain `&`.

## Setup

```bash
cp .env.example .env          # adjust DATABASE_URL / PORT / CORS_ORIGIN if needed
docker compose up -d          # starts a local Postgres on :5434
npm install
npm run prisma:migrate        # creates tables
npm run seed                  # loads the same deterministic demo week the frontend mock data uses
npm run dev                   # http://localhost:4000
```

## Scheduling ("resolve plan")

`POST /api/plan/resolve` runs a real constraint-based greedy scheduler
(`src/services/scheduler.ts`), not a random stub:

- Builds one candidate nightly possession window per section per day across
  the 7-day horizon, sized to that section's `maxWindowMin`.
- Days already covered by a **pinned** block are excluded — pinned blocks are
  never touched by a resolve.
- Every `scheduled`/`unscheduled` task is re-ranked by
  `riskScore * (0.6 + safetyWeight) + statutory bonus + due-date urgency`
  and greedily packed into the earliest window on its section that has
  spare duration and satisfies the department-mixing cap for the current
  safety weight (1 department/window at ≥0.65, up to 3 at ≤0.35, else 2).
- A task that still doesn't fit anywhere becomes `unscheduled` with a
  computed `bindingConstraint`; after 3 consecutive failed resolves it flips
  to `quarantined` automatically.
- The new `PlanVersion`'s `diffFromPrevious` is computed from the actual
  before/after task and block counts (promoted / newly unscheduled / newly
  quarantined / multi-department blocks built), not canned text.

## API surface

| Method | Path | Notes |
|---|---|---|
| GET | `/api/sections` | |
| GET | `/api/sections/:id/defects` | |
| GET | `/api/sections/:id/tasks` | |
| GET | `/api/defects?sectionId=` | |
| GET | `/api/tasks?status=` | |
| GET | `/api/tasks/:id/defects` | |
| PATCH | `/api/tasks/:id/status` | manual override, e.g. un-quarantine |
| GET | `/api/blocks` | |
| PATCH | `/api/blocks/:id/pin` | toggle pin |
| PATCH | `/api/blocks/:id/move` | rejects overlaps / over-length windows |
| GET | `/api/plan/current` | latest version + safetyWeight/approved/published |
| GET | `/api/plan/versions` | |
| PATCH | `/api/plan/safety-weight` | persists the draft weight used by the next resolve |
| POST | `/api/plan/resolve` | runs the scheduler, creates a new `PlanVersion` |
| POST | `/api/plan/approve` / `/api/plan/publish` | |
| GET/POST | `/api/comments` | |
| GET | `/api/replan-triggers` | |
| GET | `/api/kpis` | dashboard KPI tile numbers |
| GET | `/api/ml/health` / `/api/ml/features/:department` / `/api/ml/metrics` | proxied to the ML service |
| POST | `/api/ml/predict-risk` | proxied to the ML service's `/predict` — real riskScore + SHAP factors |
| POST | `/api/ml/rescore-tasks` | re-scores every task from its stored features (after retraining) |

## ML risk-scoring service

`../ml` is a separate FastAPI service (see its README) that trains a
gradient-boosted model per department and serves real SHAP-explained risk
predictions. This backend proxies to it (`src/routes/ml.ts`) via
`ML_SERVICE_URL` (default `http://localhost:8000`) rather than embedding it,
since model training/serving is Python-native tooling. Start it before this
backend if you want `/api/ml/*` to work — a 502 with a clear message is
returned if it's unreachable, everything else keeps working.

## Frontend

The frontend loads everything from this API through `frontend/src/context/DataContext.tsx`;
Vite proxies `/api` to `http://localhost:4000` in dev (`frontend/vite.config.ts`).

## Setup note

Use `npm run setup` / `npm run dev` from the project root (see the root
README) rather than the per-folder steps above — they also start the ML
service, which the seed calls to score tasks.
