# BlockSetu

Railway block working plan dashboard for **Pune Division, Central Railway**
(Pune – Lonavala corridor). Planners see maintenance tasks from Engineering,
Signal & Telecom and Traction Distribution, get an automatically scheduled
7-day block plan, and review/approve/publish it.

| Part | Folder | Tech | URL |
|---|---|---|---|
| Web app | `frontend/` | React + Vite + Tailwind | http://localhost:5173 |
| API + scheduler | `backend/` | Node + Express + Prisma | http://localhost:4000 |
| Risk model | `ml/` | Python + FastAPI + scikit-learn + SHAP | http://localhost:8000 |
| Database | `backend/docker-compose.yml` | PostgreSQL 16 (Docker) | localhost:5434 |

```
browser ──> frontend (5173) ──/api proxy──> backend (4000) ──> PostgreSQL (5434)
                                                  └──────────> ML service (8000)
```

## Quick start (Windows)

Needs **Node.js 20+**, **Python 3.11+** and **Docker Desktop**.

```powershell
npm run setup   # one time: installs everything, trains the models, creates + seeds the database
npm run dev     # every time: starts database, ML service, API and web app together
```

Open **http://localhost:5173**. Stop everything with `Ctrl+C` (the database
container keeps running in the background; `docker compose -f backend/docker-compose.yml stop` stops it).

`npm run setup` is safe to re-run — it skips steps that are already done.

## Other commands

| Command | What it does |
|---|---|
| `npm run seed` | Wipe and re-create the demo data (run while `npm run dev` is up so tasks get ML scores) |
| `npm run setup -- -Reseed` | Same as above, but works without `npm run dev` running |
| `npm run train` | Retrain the risk models; then `POST http://localhost:4000/api/ml/rescore-tasks` to re-score existing tasks |

## What's real vs. demo data

- **Scheduling is real.** *Plan Controls → Re-solve plan* runs a constraint-based
  scheduler (`backend/src/services/scheduler.ts`) that packs tasks into
  possession windows, respects pinned blocks and section window limits, and
  quarantines tasks that fail 3 re-plans in a row.
- **Risk scores are real model output.** Each task's risk score and its
  "Risk factors" chart come from a gradient-boosted model per department, with
  SHAP explanations (`ml/`).
- **The underlying data is synthetic.** Sections use real Pune–Lonavala station
  names, but defects, tasks and inspection readings are generated for the demo.
  The models are trained on synthetic data (see `ml/README.md`).
- Plan dates are relative to the day you seed. If the Gantt looks empty a few
  days later, run `npm run seed` again (or *Re-solve plan*, which schedules
  from today).

More detail: `backend/README.md`, `ml/README.md`.
