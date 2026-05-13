# FitAI Pro Wear OS (MVP)

Mini app Wear OS (Kotlin + Jetpack Compose for Wear OS) pour piloter une séance FitAI Pro via API.

## Structure

- `wear-os/settings.gradle.kts`
- `wear-os/build.gradle.kts`
- `wear-os/app/build.gradle.kts`
- `wear-os/app/src/main/java/com/fitai/wear/MainActivity.kt`
- `wear-os/app/src/main/java/com/fitai/wear/WorkoutViewModel.kt`
- `wear-os/app/src/main/java/com/fitai/wear/api/*`
- `wear-os/app/src/main/java/com/fitai/wear/FitAiConfig.example.kt`

## Configuration locale

1. Copier `FitAiConfig.example.kt` en `FitAiConfig.kt` dans:
   `wear-os/app/src/main/java/com/fitai/wear/`
2. Renseigner:
   - `BASE_URL`
   - `WATCH_API_TOKEN`

`FitAiConfig.kt` est ignoré par Git (`.gitignore`), donc le token n'est pas versionné.

## API utilisées

- `GET /api/watch/current-session`
- `POST /api/watch/validate-set`
- `POST /api/watch/next-exercise`
- `POST /api/watch/previous-exercise`
- `POST /api/watch/skip-rest`
- `POST /api/watch/complete-session`

Header envoyé:

- `Authorization: Bearer WATCH_API_TOKEN`

## UX implémentée (écran unique)

- Nom exercice
- Exercice X/Y
- Série X/Y
- Reps cible
- Poids
- Timer repos (si `restRemaining > 0`)
- Bouton principal:
  - `Valider` (actif)
  - `Passer repos` (repos)
- Boutons secondaires:
  - `Prec`
  - `Suiv`
  - `Fin`
- Polling auto toutes les 5 secondes si `status == IN_PROGRESS`

## Lancer sur Galaxy Watch Ultra

1. Ouvrir Android Studio
2. `File > Open` puis sélectionner le dossier `wear-os`
3. Laisser Gradle sync
4. Vérifier que `FitAiConfig.kt` local est créé
5. Activer options développeur sur la montre + ADB debugging
6. Appairer la montre (Wi-Fi ADB ou via téléphone)
7. Lancer la config `app` sur la montre

## Permissions réseau

Déjà présentes dans `AndroidManifest.xml`:

- `android.permission.INTERNET`
- `uses-feature android.hardware.type.watch`

