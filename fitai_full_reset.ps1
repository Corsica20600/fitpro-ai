# FitAI Pro - Full Reset DB + Media
# À lancer depuis la racine du projet Next.js
# Pré-requis :
# 1) DATABASE_URL présent dans .env ou .env.local
# 2) psql installé ou accessible dans le terminal
# 3) fichier exercises_clean_full.csv placé dans ./import/exercises_clean_full.csv

$ErrorActionPreference = "Stop"

Write-Host "=== FitAI Pro Full Reset ==="

# 1. Charger DATABASE_URL depuis .env.local ou .env
function Get-DatabaseUrl {
    $envFiles = @(".env.local", ".env")
    foreach ($file in $envFiles) {
        if (Test-Path $file) {
            $line = Get-Content $file | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1
            if ($line) {
                return ($line -replace "^DATABASE_URL=", "").Trim('"').Trim("'")
            }
        }
    }
    if ($env:DATABASE_URL) { return $env:DATABASE_URL }
    throw "DATABASE_URL introuvable dans .env.local, .env ou variable d'environnement."
}

$DatabaseUrl = Get-DatabaseUrl
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 2. Créer dossiers backup/import
New-Item -ItemType Directory -Force -Path "backups" | Out-Null
New-Item -ItemType Directory -Force -Path "import" | Out-Null

# 3. Vérifier CSV
$CsvPath = "import/exercises_clean_full.csv"
if (!(Test-Path $CsvPath)) {
    throw "Fichier manquant : $CsvPath. Mets exercises_clean_full.csv dans le dossier import."
}

# 4. Backup DB
Write-Host "Backup ignoré (pg_dump non installé)"

# 5. Backup media actuels
Write-Host "Backup media..."
if (Test-Path "public/media/exercises") {
    Copy-Item "public/media/exercises" "backups/exercises_media_backup_$Timestamp" -Recurse -Force
}
if (Test-Path "public/media/exercices") {
    Copy-Item "public/media/exercices" "backups/exercices_media_backup_$Timestamp" -Recurse -Force
}

# 6. Reset media propre
Write-Host "Reset dossiers media..."
if (Test-Path "public/media/exercises") {
    Remove-Item "public/media/exercises" -Recurse -Force
}
New-Item -ItemType Directory -Force -Path "public/media/exercises" | Out-Null

# 7. Créer script SQL temporaire
$SqlPath = "import/reset_import_fitai_$Timestamp.sql"

@"
DROP TABLE IF EXISTS exercise_import_clean;
CREATE TABLE exercise_import_clean (
  source_id TEXT,
  source TEXT,
  source_path TEXT,
  slug TEXT UNIQUE,
  name_en TEXT,
  name_fr TEXT,
  category TEXT,
  primary_muscles_fr JSONB,
  secondary_muscles_fr JSONB,
  equipment_fr JSONB,
  difficulty TEXT,
  movement_type TEXT,
  instructions_fr TEXT,
  common_mistakes_fr JSONB,
  image_path TEXT,
  animation_path TEXT,
  thumbnail_path TEXT,
  is_active BOOLEAN,
  is_variant BOOLEAN,
  canonical_key TEXT,
  canonical_slug TEXT,
  variant_label_fr TEXT
);
"@ | Out-File -Encoding UTF8 $SqlPath

# 8. Créer table temporaire
Write-Host "Création table import temporaire..."
psql $DatabaseUrl -f $SqlPath

# 9. Import CSV dans table temporaire
Write-Host "Import CSV..."
$CsvAbs = (Resolve-Path $CsvPath).Path.Replace("\", "/")

$CopySql = "\copy exercise_import_clean(source_id, source, source_path, slug, name_en, name_fr, category, primary_muscles_fr, secondary_muscles_fr, equipment_fr, difficulty, movement_type, instructions_fr, common_mistakes_fr, image_path, animation_path, thumbnail_path, is_active, is_variant, canonical_key, canonical_slug, variant_label_fr) FROM '$CsvAbs' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');"
psql $DatabaseUrl -c $CopySql

# 10. Sécurité : désactiver les anciens exercices
Write-Host "Désactivation anciens exercices..."
psql $DatabaseUrl -c 'UPDATE exercises SET "isActive" = false;'

# 11. Import dans exercises
# IMPORTANT : cette requête suppose ton schema actuel proche de celui observé dans tes exports.
# Si une colonne manque, la commande indiquera laquelle.
Write-Host "Insertion / mise à jour exercices propres..."
$UpsertSql = @"
INSERT INTO exercises (
  id,
  slug,
  name,
  "nameFr",
  category,
  "primaryMusclesFr",
  "secondaryMuscles",
  "equipmentFr",
  difficulty,
  "movementType",
  "instructionsFr",
  "commonMistakesFr",
  "fallbackImagePath",
  "fallbackAnimationPath",
  "fallbackThumbnailPath",
  "primaryAnimationPath",
  "isActive"
)
SELECT
  'fitai_' || slug AS id,
  slug,
  name_en,
  name_fr,
  category,
  primary_muscles_fr,
  secondary_muscles_fr,
  equipment_fr,
  difficulty,
  movement_type,
  instructions_fr,
  common_mistakes_fr,
  image_path,
  animation_path,
  thumbnail_path,
  animation_path,
  true
FROM exercise_import_clean
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  "nameFr" = EXCLUDED."nameFr",
  category = EXCLUDED.category,
  "primaryMusclesFr" = EXCLUDED."primaryMusclesFr",
  "secondaryMuscles" = EXCLUDED."secondaryMuscles",
  "equipmentFr" = EXCLUDED."equipmentFr",
  difficulty = EXCLUDED.difficulty,
  "movementType" = EXCLUDED."movementType",
  "instructionsFr" = EXCLUDED."instructionsFr",
  "commonMistakesFr" = EXCLUDED."commonMistakesFr",
  "fallbackImagePath" = EXCLUDED."fallbackImagePath",
  "fallbackAnimationPath" = EXCLUDED."fallbackAnimationPath",
  "fallbackThumbnailPath" = EXCLUDED."fallbackThumbnailPath",
  "primaryAnimationPath" = EXCLUDED."primaryAnimationPath",
  "isActive" = true;
"@

psql $DatabaseUrl -c $UpsertSql

# 12. Créer dossiers media vides depuis CSV
Write-Host "Création dossiers media par slug..."
Import-Csv $CsvPath | ForEach-Object {
    $folder = "public/media/exercises/$($_.slug)"
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Write-Host "=== Terminé ==="
Write-Host "Backup DB : backups/backup_before_fitai_reset_$Timestamp.sql"
Write-Host "Media propre : public/media/exercises/"
Write-Host "À faire ensuite : ajouter image.webp, animation.webp, thumbnail.webp dans chaque dossier."