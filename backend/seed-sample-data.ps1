$ErrorActionPreference = 'Stop'

$projectPath = Join-Path $PSScriptRoot 'Gamesphere.csproj'
dotnet run --project $projectPath -- --seed-sample-data