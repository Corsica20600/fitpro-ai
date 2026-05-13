package com.fitai.wear.api

import kotlinx.serialization.Serializable

@Serializable
data class WatchSessionState(
  val sessionId: String,
  val exerciseName: String,
  val exerciseIndex: Int,
  val totalExercises: Int,
  val setIndex: Int,
  val totalSets: Int,
  val targetReps: Int,
  val weight: Double? = null,
  val restRemaining: Int,
  val status: String,
)

@Serializable
data class ValidateSetRequest(
  val sessionId: String,
  val actualReps: Int? = null,
  val weight: Double? = null,
)

@Serializable
data class SessionActionRequest(
  val sessionId: String,
)

