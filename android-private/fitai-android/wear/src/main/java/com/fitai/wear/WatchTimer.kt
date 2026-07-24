package com.fitai.wear

import android.os.SystemClock
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.max

fun createRestDeadline(restRemaining: Int, elapsedNowMs: Long = SystemClock.elapsedRealtime()): RestDeadline? {
    val seconds = max(0, restRemaining)
    if (seconds <= 0) return null
    return RestDeadline(
        deadlineElapsedMs = elapsedNowMs + seconds * 1_000L,
        sourceRemainingSeconds = seconds,
    )
}

fun remainingFromDeadline(deadline: RestDeadline?, elapsedNowMs: Long = SystemClock.elapsedRealtime()): Int {
    if (deadline == null) return 0
    return max(0, ceil((deadline.deadlineElapsedMs - elapsedNowMs) / 1_000.0).toInt())
}

fun shouldReplaceDeadline(
    current: RestDeadline?,
    next: RestDeadline?,
    contextChanged: Boolean,
    elapsedNowMs: Long = SystemClock.elapsedRealtime(),
): Boolean {
    if (contextChanged) return true
    if (current == null || next == null) return current != next
    val currentRemaining = remainingFromDeadline(current, elapsedNowMs)
    val nextRemaining = remainingFromDeadline(next, elapsedNowMs)
    return abs(currentRemaining - nextRemaining) > 2
}

fun formatRest(seconds: Int): String {
    if (seconds <= 0) return "GO"
    if (seconds < 60) return seconds.toString()
    val minutes = seconds / 60
    val rest = seconds % 60
    return "$minutes:${rest.toString().padStart(2, '0')}"
}
