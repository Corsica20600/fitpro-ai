# FitAI Pro — Full Reset propre

## Fichiers

- `fitai_full_reset.ps1` : script Windows PowerShell
- `fitai_full_reset.sh` : script Mac/Linux/Git Bash
- `README_RESET.txt` : ce fichier

## Avant de lancer

1. Dézippe `fitai_exercisedb_clean_full.zip`.
2. Prends `exercises_clean_full.csv`.
3. Dans ton projet FitAI Pro, crée un dossier :

```txt
/import
```

4. Mets dedans :

```txt
/import/exercises_clean_full.csv
```

5. Mets ce script à la racine du projet.

## Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\fitai_full_reset.ps1
```

## Mac/Linux/Git Bash

```bash
chmod +x fitai_full_reset.sh
./fitai_full_reset.sh
```

## Ce que fait le script

1. Sauvegarde Neon avec `pg_dump`.
2. Sauvegarde les anciens dossiers media.
3. Vide proprement `/public/media/exercises`.
4. Crée une table temporaire `exercise_import_clean`.
5. Importe le CSV propre.
6. Désactive les anciens exercices.
7. Insère / met à jour les exercices propres.
8. Recrée les dossiers media par slug.

## Important

Prisma Studio ne contient pas les images.
Il contient seulement les chemins :

```txt
/media/exercises/[slug]/image.webp
/media/exercises/[slug]/animation.webp
/media/exercises/[slug]/thumbnail.webp
```

Les vraies images doivent être placées dans :

```txt
/public/media/exercises/[slug]/
```

## Si erreur SQL

C’est probablement une colonne différente dans ta table `exercises`.

Dans ce cas :
1. Ne panique pas, le backup est fait avant.
2. Envoie-moi l’erreur exacte.
3. Je t’adapte l’INSERT selon ton schema Prisma réel.