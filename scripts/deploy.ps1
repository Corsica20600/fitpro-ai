param(
  [Parameter(Mandatory = $true)]
  [string]$Message,
  [string]$Branch = "main",
  [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"

Write-Host "Verification du repo git..."
git rev-parse --is-inside-work-tree | Out-Null

$status = git status --porcelain
if (-not $status) {
  Write-Host "Aucun changement a deployer."
  exit 0
}

Write-Host "Ajout des fichiers modifies..."
git add -A

Write-Host "Creation du commit..."
git commit -m $Message

Write-Host "Push vers $Remote/$Branch ..."
git push $Remote $Branch

Write-Host "Deploy declenche via Vercel (sur push)."
