package com.fitai.wear.api

import com.fitai.wear.FitAiConfig
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class WatchApiClient {
  private val json = Json { ignoreUnknownKeys = true }
  private val client = OkHttpClient.Builder()
    .connectTimeout(10, TimeUnit.SECONDS)
    .readTimeout(15, TimeUnit.SECONDS)
    .build()

  private fun endpoint(path: String): String = "${FitAiConfig.BASE_URL.trimEnd('/')}$path"

  private fun authRequestBuilder(url: String): Request.Builder =
    Request.Builder()
      .url(url)
      .addHeader("Authorization", "Bearer ${FitAiConfig.WATCH_API_TOKEN}")
      .addHeader("Accept", "application/json")

  fun getCurrentSession(): WatchSessionState? {
    val request = authRequestBuilder(endpoint("/api/watch/current-session")).get().build()
    client.newCall(request).execute().use { response ->
      if (!response.isSuccessful) return null
      val body = response.body?.string() ?: return null
      return json.decodeFromString(WatchSessionState.serializer(), body)
    }
  }

  fun validateSet(sessionId: String, reps: Int?, weight: Double?): WatchSessionState? {
    val payload = ValidateSetRequest(sessionId = sessionId, actualReps = reps, weight = weight)
    return post("/api/watch/validate-set", payload, WatchSessionState.serializer())
  }

  fun nextExercise(sessionId: String): WatchSessionState? =
    post("/api/watch/next-exercise", SessionActionRequest(sessionId), WatchSessionState.serializer())

  fun previousExercise(sessionId: String): WatchSessionState? =
    post("/api/watch/previous-exercise", SessionActionRequest(sessionId), WatchSessionState.serializer())

  fun skipRest(sessionId: String): WatchSessionState? =
    post("/api/watch/skip-rest", SessionActionRequest(sessionId), WatchSessionState.serializer())

  fun completeSession(sessionId: String): WatchSessionState? =
    post("/api/watch/complete-session", SessionActionRequest(sessionId), WatchSessionState.serializer())

  private fun <T> post(path: String, payload: Any, serializer: kotlinx.serialization.KSerializer<T>): T? {
    val body = when (payload) {
      is ValidateSetRequest -> json.encodeToString(ValidateSetRequest.serializer(), payload)
      is SessionActionRequest -> json.encodeToString(SessionActionRequest.serializer(), payload)
      else -> return null
    }

    val request = authRequestBuilder(endpoint(path))
      .post(body.toRequestBody("application/json".toMediaType()))
      .build()

    client.newCall(request).execute().use { response ->
      if (!response.isSuccessful) return null
      val responseBody = response.body?.string() ?: return null
      return json.decodeFromString(serializer, responseBody)
    }
  }
}

