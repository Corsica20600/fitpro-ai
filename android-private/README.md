# FitAI Android Private (Samsung Health Sync)

Ce dossier documente le setup APK privee (non publiee) pour synchroniser Samsung Health vers FitAI.

## 1) Ce qui est deja pret cote backend FitAI

- Endpoint sync: `POST /api/health/samsung/sync`
- Endpoint status: `GET /api/health/samsung/status`
- Auth: header `x-sync-token`
- Donnees stockees dans `ProgressMetric` (type `PERFORMANCE`, source `samsung_health` dans `notes`)

## 2) Variables a configurer (web/backend)

Dans `.env` (ou variables Vercel):

```env
SAMSUNG_SYNC_TOKEN=change_me_long_random_token
```

## 3) Payload attendu par l'endpoint sync

```json
{
  "records": [
    {
      "metric": "steps",
      "value": 7421,
      "measuredAt": "2026-05-17T08:20:00.000Z",
      "sourceDevice": "Galaxy Watch"
    },
    {
      "metric": "heart_rate",
      "value": 61,
      "measuredAt": "2026-05-17T08:21:00.000Z"
    }
  ]
}
```

`metric` supportes:
- `steps`
- `heart_rate`
- `sleep_minutes`
- `calories`
- `distance_m`

## 4) Test rapide manuel du backend (avant APK)

PowerShell:

```powershell
$token = "TON_TOKEN"
$body = @{
  records = @(
    @{ metric = "steps"; value = 8000; measuredAt = (Get-Date).ToUniversalTime().ToString("o"); sourceDevice = "Galaxy Watch" }
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method POST `
  -Uri "http://localhost:3000/api/health/samsung/sync" `
  -Headers @{ "x-sync-token" = $token; "content-type" = "application/json" } `
  -Body $body
```

## 5) APK privee: procedure d'installation

Le projet Android est dans:

- `android-private/fitai-android/`

### 5.1 Ouvrir le projet

1. Ouvrir Android Studio.
2. `Open` -> `android-private/fitai-android`.
3. Laisser Android Studio synchroniser Gradle.

### 5.2 Configurer les secrets (local)

Dans Android Studio:

`File > Settings > Build, Execution, Deployment > Gradle` (ou `gradle.properties` utilisateur),
ajouter:

```properties
FITAI_SYNC_BASE_URL=https://ton-domaine-fitai
FITAI_SYNC_TOKEN=ton_token_samsung_sync
```

En local emulator Android: utiliser `http://10.0.2.2:3000` pour parler au serveur local.

### 5.3 Build APK

- Debug: `Build > Build APK(s)`
- Ou terminal Android Studio:

```bash
./gradlew assembleDebug
```

Sortie attendue:

- `app/build/outputs/apk/debug/app-debug.apk`

1. Creer un projet Android Kotlin (Android Studio).
2. Integrer Samsung Health Data SDK (AAR Samsung officiel).
3. Lire les donnees Samsung Health apres consentement utilisateur.
4. Poster les mesures vers `POST /api/health/samsung/sync` avec `x-sync-token`.
5. Build APK debug ou release locale.
6. Installer sur ton tel:
   - `adb install -r app-release.apk`
   - ou en ouvrant l'APK depuis le telephone.

## 6) Mise a jour APK privee (sans Play Store)

1. Incrementer `versionCode` et `versionName`.
2. Rebuild APK.
3. Reinstaller avec `adb install -r app-release.apk`.
4. Verifier:
   - `GET /api/health/samsung/status`
   - puis la page `Progress` dans FitAI.

## 7) Notes importantes

- Samsung Health SDK fonctionne sur appareil reel (pas emulateur pour ce scenario).
- Une vraie distribution large peut necessiter le process partenaire Samsung.
- Pour un usage prive perso, tu peux rester en installation manuelle.

## 8) Passage du mock au vrai Samsung SDK

Dans le projet Android:

- `SamsungHealthProviderMock` est le provider temporaire.
- Remplacer par une implementation `SamsungHealthProvider` qui lit le SDK Samsung.

Fichiers concernes:

- `app/src/main/java/com/fitai/privateapp/SamsungHealthProvider.kt`
- `app/src/main/java/com/fitai/privateapp/MainActivity.kt`

Flux attendu:

1. Demander consentement Samsung Health.
2. Lire les mesures (steps, FC, sommeil...).
3. Construire `List<SamsungMetricRecord>`.
4. Appeler `SamsungSyncApi.push(...)`.
