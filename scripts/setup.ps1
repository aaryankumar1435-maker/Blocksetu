# One-time setup for BlockSetu. Safe to re-run: every step skips work that is
# already done. Pass -Reseed to wipe and re-seed the database.
param([switch]$Reseed)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step([string]$msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# Runs a native command through cmd so its stderr is not turned into a
# PowerShell error record; returns $true when it exits 0.
function Test-Native([string]$cmdline) {
  cmd /c "$cmdline >nul 2>&1"
  return ($LASTEXITCODE -eq 0)
}

# Windows PowerShell 5.1 can turn a native tool's stderr warnings into
# terminating errors under 'Stop', so judge success by exit code instead.
function Invoke-Checked([string]$what, [scriptblock]$block) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $block } finally { $ErrorActionPreference = $prev }
  if ($LASTEXITCODE -ne 0) { throw "$what failed (exit code $LASTEXITCODE)." }
}

foreach ($tool in @(
    @{ Name = 'node';   Hint = 'Install Node.js 20+ from https://nodejs.org' },
    @{ Name = 'python'; Hint = 'Install Python 3.11+ from https://www.python.org' },
    @{ Name = 'docker'; Hint = 'Install Docker Desktop from https://www.docker.com/products/docker-desktop' })) {
  if (-not (Get-Command $tool.Name -ErrorAction SilentlyContinue)) { throw "$($tool.Name) not found. $($tool.Hint)" }
}

Step 'Checking Docker'
if (-not (Test-Native 'docker info')) {
  $dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
  if (Test-Path $dockerDesktop) { Start-Process $dockerDesktop }
  Write-Host 'Waiting for Docker Desktop to start (up to 5 minutes)...'
  $ready = $false
  for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
    Start-Sleep -Seconds 5
    $ready = Test-Native 'docker info'
  }
  if (-not $ready) { throw 'Docker is not running. Start Docker Desktop, then run: npm run setup' }
}

Step 'Installing Node dependencies (root, frontend, backend)'
# Install from inside each folder: `npm --prefix <dir> install` run from the
# root would add the root package itself as a dependency of <dir>.
foreach ($dir in @('.', 'frontend', 'backend')) {
  Push-Location $dir
  try { Invoke-Checked "npm install ($dir)" { npm install --no-fund --no-audit } } finally { Pop-Location }
}

if (-not (Test-Path 'backend\.env')) {
  Copy-Item 'backend\.env.example' 'backend\.env'
  Write-Host 'Created backend\.env from .env.example'
}

Step 'Setting up the ML service (Python venv + dependencies)'
$py = 'ml\.venv\Scripts\python.exe'
if (-not (Test-Path $py)) { Invoke-Checked 'python -m venv' { python -m venv ml\.venv } }
Invoke-Checked 'pip install' { & $py -m pip install --disable-pip-version-check -q -r ml\requirements.txt }

if (-not (Test-Path 'ml\models\eng.joblib')) {
  Step 'Training the risk models'
  Push-Location ml
  try { Invoke-Checked 'model training' { & .venv\Scripts\python.exe -m app.train } } finally { Pop-Location }
}

Step 'Starting PostgreSQL'
Invoke-Checked 'docker compose up' { docker compose -f backend\docker-compose.yml up -d postgres }
$dbReady = $false
for ($i = 0; $i -lt 30 -and -not $dbReady; $i++) {
  $dbReady = Test-Native 'docker compose -f backend\docker-compose.yml exec -T postgres pg_isready -U blocksetu'
  if (-not $dbReady) { Start-Sleep -Seconds 2 }
}
if (-not $dbReady) { throw 'PostgreSQL did not become ready in time.' }

Step 'Applying database migrations'
Push-Location backend
try { Invoke-Checked 'prisma migrate deploy' { npx prisma migrate deploy } } finally { Pop-Location }

$planCount = cmd /c 'docker compose -f backend\docker-compose.yml exec -T postgres psql -U blocksetu -d blocksetu -tAc "SELECT count(*) FROM \"PlanVersion\"" 2>nul'
$needsSeed = $Reseed -or -not ($planCount -match '^\s*[1-9]')

if ($needsSeed) {
  Step 'Seeding the database (tasks scored by the ML model)'
  $mlProc = $null
  $mlUp = $false
  try { $mlUp = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://localhost:8000/health').StatusCode -eq 200 } catch {}
  if (-not $mlUp) {
    $mlProc = Start-Process -FilePath (Resolve-Path $py) -ArgumentList '-m', 'uvicorn', 'app.main:app', '--port', '8000' `
      -WorkingDirectory (Join-Path $root 'ml') -WindowStyle Hidden -PassThru
    for ($i = 0; $i -lt 30 -and -not $mlUp; $i++) {
      Start-Sleep -Seconds 1
      try { $mlUp = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://localhost:8000/health').StatusCode -eq 200 } catch {}
    }
  }
  try {
    Invoke-Checked 'seed' { npm --prefix backend run seed }
  } finally {
    if ($mlProc) { Stop-Process -Id $mlProc.Id -Force -ErrorAction SilentlyContinue }
  }
} else {
  Write-Host "`nDatabase already has a plan - skipping seed (use: npm run setup -- -Reseed to start fresh)."
}

Write-Host "`nSetup complete. Start everything with:  npm run dev" -ForegroundColor Green
Write-Host 'Then open http://localhost:5173'
