package com.fitai.privateapp

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object SamsungSyncApi {
    data class TokenResult(val ok: Boolean, val token: String? = null, val message: String)

    fun issueHealthDeviceToken(
        baseUrl: String,
        cookieHeader: String?,
        label: String = "Téléphone Android",
    ): TokenResult {
        if (cookieHeader.isNullOrBlank()) return TokenResult(false, message = "Connexion Google requise")

        val endpoint = baseUrl.trimEnd('/') + "/api/health/device-token"
        val payload = JSONObject().apply {
            put("label", label)
        }

        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 15000
            doOutput = true
            setRequestProperty("content-type", "application/json")
            setRequestProperty("cookie", cookieHeader)
        }

        return try {
            connection.outputStream.use { out ->
                out.write(payload.toString().toByteArray(Charsets.UTF_8))
            }
            val code = connection.responseCode
            val body = runCatching {
                (if (code in 200..299) connection.inputStream else connection.errorStream)
                    ?.bufferedReader()
                    ?.readText()
                    .orEmpty()
            }.getOrDefault("")

            if (code in 200..299) {
                val token = JSONObject(body).optString("token").takeIf { it.isNotBlank() }
                if (token != null) TokenResult(true, token = token, message = "Token Health OK")
                else TokenResult(false, message = "Token Health absent")
            } else {
                TokenResult(false, message = "HTTP $code $body")
            }
        } catch (e: Exception) {
            TokenResult(false, message = e.message ?: "Erreur reseau")
        } finally {
            connection.disconnect()
        }
    }

    fun push(
        baseUrl: String,
        healthDeviceToken: String,
        records: List<SamsungMetricRecord>,
        source: HealthSyncSource = HealthSyncSource.SAMSUNG_HEALTH,
        legacySyncToken: String = "",
    ): SyncResult {
        if (healthDeviceToken.isBlank() && legacySyncToken.isBlank()) {
            return SyncResult(false, "Token Health personnel manquant")
        }
        if (records.isEmpty()) return SyncResult(false, "Aucune mesure a envoyer")

        val endpoint = baseUrl.trimEnd('/') + source.endpointPath
        val payload = JSONObject().apply {
            put("records", JSONArray().apply {
                records.forEach { rec ->
                    put(JSONObject().apply {
                        put("metric", rec.metric)
                        put("value", rec.value)
                        put("measuredAt", rec.measuredAt)
                        if (rec.sourceDevice != null) put("sourceDevice", rec.sourceDevice)
                    })
                }
            })
        }

        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 15000
            doOutput = true
            setRequestProperty("content-type", "application/json")
            if (healthDeviceToken.isNotBlank()) {
                setRequestProperty("x-health-device-token", healthDeviceToken)
            } else {
                setRequestProperty("x-sync-token", legacySyncToken)
            }
        }

        return try {
            connection.outputStream.use { out ->
                out.write(payload.toString().toByteArray(Charsets.UTF_8))
            }
            val code = connection.responseCode
            val body = runCatching {
                (if (code in 200..299) connection.inputStream else connection.errorStream)
                    ?.bufferedReader()
                    ?.readText()
                    .orEmpty()
            }.getOrDefault("")
            if (code in 200..299) SyncResult(true, "Sync OK ($code)")
            else SyncResult(false, "HTTP $code $body")
        } catch (e: Exception) {
            SyncResult(false, e.message ?: "Erreur reseau")
        } finally {
            connection.disconnect()
        }
    }
}
