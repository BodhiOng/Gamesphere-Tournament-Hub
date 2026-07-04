param()

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$frontend = Join-Path $root 'frontend'
$backend = Join-Path $root 'backend'
$frontendDist = Join-Path $frontend 'dist'
$backendWwwroot = Join-Path $backend 'wwwroot'
$publishOut = Join-Path $root 'publish'

function Assert-WorkspacePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Label
  )

  $resolved = (Resolve-Path -LiteralPath $Path).Path
  if (-not $resolved.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "$Label resolved outside the workspace: $resolved"
  }

  return $resolved
}

Write-Host 'Building frontend...'
Push-Location $frontend
try {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) {
    throw 'Frontend build failed.'
  }
}
finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath $frontendDist)) {
  throw "Frontend dist output was not found at $frontendDist"
}

$resolvedWwwroot = Assert-WorkspacePath -Path $backendWwwroot -Label 'backend/wwwroot'
if (-not (Test-Path -LiteralPath $resolvedWwwroot)) {
  throw "Backend wwwroot folder was not found at $resolvedWwwroot"
}

Write-Host 'Syncing frontend dist into backend wwwroot...'
Get-ChildItem -LiteralPath $resolvedWwwroot -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $frontendDist '*') -Destination $resolvedWwwroot -Recurse -Force

Write-Host 'Publishing backend...'
if (Test-Path -LiteralPath $publishOut) {
  Remove-Item -LiteralPath $publishOut -Recurse -Force
}
Push-Location $backend
try {
  & dotnet publish -c Release -o $publishOut
  if ($LASTEXITCODE -ne 0) {
    throw 'Backend publish failed.'
  }
}
finally {
  Pop-Location
}

Write-Host "Done. Publish output is in $publishOut"
