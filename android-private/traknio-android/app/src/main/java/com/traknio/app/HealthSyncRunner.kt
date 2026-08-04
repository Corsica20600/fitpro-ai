package com.traknio.app

import android.content.Context
import android.webkit.CookieManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object HealthSyncRunner {
    private const val PREFS_NAME = "traknio_health_sync"
    private const val KEY_HEALTH_DEVICE_TOKEN = "health_device_token"
    private const val KEY_LAST_AUTO_SYNC_AT = "last_auto_sync_at"
    private const val KEY_LAST_SUCCESS_SYNC_AT = "last_success_sync_at"
    private const val MIN_AUTO_SYNC_INTERVAL_MS = 3L * 60L * 60L * 1000L

    suspend fun sync(
        context: Context,
        requestPermissions: Boolean,
        force: Boolean = false,
        cookieHeader: String? = null,
    ): HealthSyncOutcome {
        val appContext = context.applicationContext
        val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val now = System.currentTimeMillis()

        if (!force && now - prefs.getLong(KEY_LAST_AUTO_SYNC_AT, 0L) < MIN_AUTO_SYNC_INTERVAL_MS) {
            return HealthSyncOutcome.Skipped("Sync Health recente.")
        }
        prefs.edit().putLong(KEY_LAST_AUTO_SYNC_AT, now).apply()

        val token = resolveHealthDeviceToken(appContext, cookieHeader)
            ?: return HealthSyncOutcome.Failed("Connecte-toi a Google dans Traknio avant la sync Health.")

        val healthConnectProvider = HealthConnectProvider(appContext)
        if (healthConnectProvider.isAvailable()) {
            val missing = healthConnectProvider.missingPermissions()
            if (missing.isNotEmpty()) {
                return if (requestPermissions) {
                    HealthSyncOutcome.NeedsPermissions(missing)
                } else {
                    HealthSyncOutcome.Failed("Permissions Health Connect incompletes.")
                }
            }

            val readResult = healthConnectProvider.readLatestMetrics()
            return pushReadResult(appContext, token, readResult, HealthSyncSource.HEALTH_CONNECT)
        }

        val samsungHealthProvider = SamsungHealthProviderFactory(appContext).create()
        val readResult = samsungHealthProvider.readLatestMetrics()
        return pushReadResult(appContext, token, readResult, HealthSyncSource.SAMSUNG_HEALTH)
    }

    suspend fun resolveHealthDeviceToken(context: Context, cookieHeader: String? = null): String? {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedToken = prefs.getString(KEY_HEALTH_DEVICE_TOKEN, null)?.takeIf { it.isNotBlank() }
        if (savedToken != null) return savedToken

        val resolvedCookieHeader = cookieHeader ?: CookieManager.getInstance().getCookie(BuildConfig.TRAKNIO_SYNC_BASE_URL)
        val tokenResult = withContext(Dispatchers.IO) {
            SamsungSyncApi.issueHealthDeviceToken(
                baseUrl = BuildConfig.TRAKNIO_SYNC_BASE_URL,
                cookieHeader = resolvedCookieHeader,
            )
        }
        val token = tokenResult.token?.takeIf { tokenResult.ok && it.isNotBlank() } ?: return null
        prefs.edit().putString(KEY_HEALTH_DEVICE_TOKEN, token).apply()
        return token
    }

    private suspend fun pushReadResult(
        context: Context,
        token: String,
        readResult: HealthReadResult,
        source: HealthSyncSource,
    ): HealthSyncOutcome {
        if (readResult.records.isEmpty()) {
            return HealthSyncOutcome.Skipped(readResult.message)
        }

        val result = withContext(Dispatchers.IO) {
            SamsungSyncApi.push(
                baseUrl = BuildConfig.TRAKNIO_SYNC_BASE_URL,
                healthDeviceToken = token,
                records = readResult.records,
                source = source,
            )
        }

        return if (result.ok) {
            context.applicationContext
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putLong(KEY_LAST_SUCCESS_SYNC_AT, System.currentTimeMillis())
                .apply()
            HealthSyncOutcome.Success("Sync ${source.label} reussie: ${result.message}")
        } else {
            HealthSyncOutcome.Failed("Erreur ${source.label}: ${result.message}")
        }
    }
}

sealed interface HealthSyncOutcome {
    data class Success(val message: String) : HealthSyncOutcome
    data class Skipped(val message: String) : HealthSyncOutcome
    data class Failed(val message: String) : HealthSyncOutcome
    data class NeedsPermissions(val missing: Set<String>) : HealthSyncOutcome
}
