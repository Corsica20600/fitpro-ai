package com.fitai.privateapp

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object SamsungSyncApi {
    fun push(baseUrl: String, token: String, records: List<SamsungMetricRecord>): SyncResult {
        if (token.isBlank()) return SyncResult(false, "FITAI_SYNC_TOKEN manquant")
        if (records.isEmpty()) return SyncResult(false, "Aucune mesure a envoyer")

        val endpoint = baseUrl.trimEnd('/') + "/api/health/samsung/sync"
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
            setRequestProperty("x-sync-token", token)
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

