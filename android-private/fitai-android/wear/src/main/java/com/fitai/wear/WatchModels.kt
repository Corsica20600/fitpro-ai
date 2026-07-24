package com.fitai.wear

data class WatchPayload(
    val sessionId: String,
    val exerciseName: String,
    val exerciseIndex: Int,
    val totalExercises: Int,
    val setIndex: Int,
    val totalSets: Int,
    val targetReps: Int,
    val weight: Double?,
    val restRemaining: Int,
    val status: String,
)

data class RestDeadline(
    val deadlineElapsedMs: Long,
    val sourceRemainingSeconds: Int,
)

sealed interface WatchScreenState {
    data object Loading : WatchScreenState
    data class Empty(val message: String = "Aucune séance active") : WatchScreenState
    data class Ready(
        val payload: WatchPayload,
        val displayRestRemaining: Int,
        val syncLabel: String,
        val busyAction: String? = null,
        val finishConfirm: Boolean = false,
        val error: String? = null,
    ) : WatchScreenState
}
