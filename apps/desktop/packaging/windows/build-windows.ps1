Param(
  [ValidateSet("all", "nsis", "msi")]
  [string]$Target = "all"
)

$ErrorActionPreference = "Stop"
$DesktopRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

if (Test-Path "$env:USERPROFILE\.cargo\bin") {
  $env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path
}

Push-Location $DesktopRoot
try {
  Write-Host "[Rico Packaging] Installing frontend dependencies..." -ForegroundColor Cyan
  npm install --no-audit --no-fund

  if ($Target -eq "nsis") {
    Write-Host "[Rico Packaging] Building Windows NSIS (.exe) installer..." -ForegroundColor Cyan
    npx tauri build --bundles nsis
  } elseif ($Target -eq "msi") {
    Write-Host "[Rico Packaging] Building Windows WiX (.msi) installer..." -ForegroundColor Cyan
    npx tauri build --bundles msi
  } else {
    Write-Host "[Rico Packaging] Building Windows NSIS (.exe) & WiX (.msi) installers..." -ForegroundColor Cyan
    npx tauri build --bundles nsis,msi
  }

  Write-Host "[Rico Packaging] Done! Artifacts are inside src-tauri/target/release/bundle/" -ForegroundColor Green
} finally {
  Pop-Location
}
