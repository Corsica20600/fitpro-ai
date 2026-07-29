package com.fitai.wear

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class FitAiWatchApi(
    private val baseUrl: String = BuildConfig.FITAI_SYNC_BASE_URL.trimEnd('/'),
    private val watchToken: String = BuildConfig.FITAI_WATCH_TOKEN,
    private val watchDeviceToken: String = BuildConfig.FITAI_WATCH_DEVICE_TOKEN,
) {
    suspend fun currentSession(sessionId: String? = null): WatchPayload = requestPayload(
        path = if (sessionId.isNullOrBlank()) {
            "/api/watch/current-session"
        } else {
            "/api/watch/current-session?sessionId=${sessionId.urlEncode()}"
        },
        method = "GET",
        body = null,
    )

    suspend fun validateSet(payload: WatchPayload): WatchPayload = postAction(
        path = "/api/watch/validate-set",
        sessionId = payload.sessionId,
        extra = mapOf(
            "actualReps" to payload.targetReps,
            "weight" to payload.weight,
        ),
    )

    suspend fun skipRest(sessionId: String): WatchPayload = postAction("/api/watch/skip-rest", sessionId)

    suspend fun addRest(sessionId: String, seconds: Int): WatchPayload = postAction(
        path = "/api/watch/adjust-rest",
        sessionId = sessionId,
        extra = mapOf("deltaSeconds" to seconds),
    )

    suspend fun removeRest(sessionId: String, seconds: Int): WatchPayload = postAction(
        path = "/api/watch/adjust-rest",
        sessionId = sessionId,
        extra = mapOf("deltaSeconds" to -seconds),
    )

    suspend fun nextExercise(sessionId: String): WatchPayload = postAction("/api/watch/next-exercise", sessionId)

    suspend fun previousExercise(sessionId: String): WatchPayload = postAction("/api/watch/previous-exercise", sessionId)

    suspend fun completeSession(sessionId: String): WatchPayload = postAction("/api/watch/complete-session", sessionId)

    private suspend fun postAction(
        path: String,
        sessionId: String,
        extra: Map<String, Any?> = emptyMap(),
    ): WatchPayload {
        val body = JSONObject()
            .put("sessionId", sessionId)
        for ((key, value) in extra) {
            body.put(key, value)
        }
        return requestPayload(path, "POST", body)
    }

    private suspend fun requestPayload(path: String, method: String, body: JSONObject?): WatchPayload = withContext(Dispatchers.IO) {
        val connection = (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 8_000
            readTimeout = 8_000
            setRequestProperty("accept", "application/json")
            if (watchDeviceToken.isNotBlank()) {
                setRequestProperty("x-watch-device-token", watchDeviceToken)
            }
            if (watchToken.isNotBlank()) {
                setRequestProperty("x-watch-token", watchToken)
            }
            if (body != null) {
                doOutput = true
                setRequestProperty("content-type", "application/json")
            }
        }

        try {
            if (body != null) {
                OutputStreamWriter(connection.outputStream).use { writer ->
                    writer.write(body.toString())
                }
            }

            val statusCode = connection.responseCode
            val raw = readBody(connection, statusCode)
            val json = JSONObject(raw.ifBlank { "{}" })
            if (statusCode !in 200..299) {
                throw IllegalStateException(json.optString("error", "Erreur serveur"))
            }
            parsePayload(json.getJSONObject("payload"))
        } finally {
            connection.disconnect()
        }
    }

    private fun readBody(connection: HttpURLConnection, statusCode: Int): String {
        val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
    }

    private fun parsePayload(json: JSONObject): WatchPayload {
        return WatchPayload(
            sessionId = json.getString("sessionId"),
            exerciseName = json.getString("exerciseName"),
            exerciseIndex = json.optInt("exerciseIndex", 1),
            totalExercises = json.optInt("totalExercises", 1),
            setIndex = json.optInt("setIndex", 1),
            totalSets = json.optInt("totalSets", 1),
            targetReps = json.optInt("targetReps", 10),
            weight = if (json.isNull("weight")) null else json.optDouble("weight"),
            restRemaining = json.optInt("restRemaining", 0),
            status = json.optString("status", "IN_PROGRESS"),
        )
    }
}

private fun String.urlEncode(): String = java.net.URLEncoder.encode(this, Charsets.UTF_8.name())
