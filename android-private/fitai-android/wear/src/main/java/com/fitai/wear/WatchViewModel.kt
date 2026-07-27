package com.fitai.wear

import android.os.SystemClock
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class WatchViewModel(
    private val api: FitAiWatchApi = FitAiWatchApi(),
) : ViewModel() {
    private val _state = MutableStateFlow<WatchScreenState>(WatchScreenState.Loading)
    val state: StateFlow<WatchScreenState> = _state.asStateFlow()

    private var latestPayload: WatchPayload? = null
    private var latestKey: String? = null
    private var deadline: RestDeadline? = null
    private var pollingJob: Job? = null

    init {
        startPolling()
        startDisplayTicker()
    }

    fun refresh() {
        viewModelScope.launch { fetchState(silent = false) }
    }

    fun validateSet() = perform("validate") { payload -> api.validateSet(payload) }

    fun skipRest() = perform("skip") { payload -> api.skipRest(payload.sessionId) }

    fun addRest() = perform("add-rest", optimistic = { addOptimisticRest(15) }) { payload ->
        api.addRest(payload.sessionId, 15)
    }

    fun removeRest() = perform("remove-rest", optimistic = { addOptimisticRest(-15) }) { payload ->
        api.removeRest(payload.sessionId, 15)
    }

    fun nextExercise() = perform("next") { payload -> api.nextExercise(payload.sessionId) }

    fun previousExercise() = perform("previous") { payload -> api.previousExercise(payload.sessionId) }

    fun requestFinish() {
        val ready = _state.value as? WatchScreenState.Ready ?: return
        _state.value = ready.copy(finishConfirm = true)
    }

    fun completeSession() = perform("finish") { payload -> api.completeSession(payload.sessionId) }

    private fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            fetchState(silent = false)
            while (true) {
                delay(2_000)
                fetchState(silent = true)
            }
        }
    }

    private fun startDisplayTicker() {
        viewModelScope.launch {
            while (true) {
                delay(250)
                updateDisplayRemaining()
            }
        }
    }

    private suspend fun fetchState(silent: Boolean) {
        val current = _state.value
        if (!silent && current is WatchScreenState.Ready) {
            _state.value = current.copy(syncLabel = "Sync...", error = null)
        }

        try {
            applyPayload(api.currentSession(latestPayload?.sessionId), syncLabel = "Sync OK")
        } catch (error: Throwable) {
            if (latestPayload == null) {
                _state.value = WatchScreenState.Empty(error.message ?: "Aucune séance active")
            } else {
                val ready = _state.value as? WatchScreenState.Ready
                if (ready != null) {
                    _state.value = ready.copy(syncLabel = "Sync locale", error = null, busyAction = null)
                }
            }
        }
    }

    private fun perform(
        actionId: String,
        optimistic: (() -> Unit)? = null,
        action: suspend (WatchPayload) -> WatchPayload,
    ) {
        val payload = latestPayload ?: return
        val ready = _state.value as? WatchScreenState.Ready ?: return
        if (ready.busyAction != null) return

        _state.value = ready.copy(busyAction = actionId, syncLabel = "Sync...", finishConfirm = false, error = null)
        optimistic?.invoke()

        viewModelScope.launch {
            try {
                applyPayload(action(payload), syncLabel = "Sync OK")
            } catch (error: Throwable) {
                val fallback = _state.value as? WatchScreenState.Ready
                if (fallback != null) {
                    _state.value = fallback.copy(
                        busyAction = null,
                        syncLabel = "Erreur",
                        error = error.message ?: "Action refusée",
                    )
                }
                fetchState(silent = true)
            }
        }
    }

    private fun applyPayload(payload: WatchPayload, syncLabel: String) {
        latestPayload = payload
        val nextKey = "${payload.sessionId}:${payload.exerciseIndex}:${payload.setIndex}"
        val contextChanged = latestKey != nextKey
        latestKey = nextKey

        val elapsedNow = SystemClock.elapsedRealtime()
        val nextDeadline = createRestDeadline(payload.restRemaining, elapsedNow)
        if (shouldReplaceDeadline(deadline, nextDeadline, contextChanged, elapsedNow)) {
            deadline = nextDeadline
        }

        _state.value = WatchScreenState.Ready(
            payload = payload,
            displayRestRemaining = remainingFromDeadline(deadline, elapsedNow),
            syncLabel = syncLabel,
        )
    }

    private fun updateDisplayRemaining() {
        val ready = _state.value as? WatchScreenState.Ready ?: return
        val remaining = remainingFromDeadline(deadline)
        if (remaining == ready.displayRestRemaining) return
        if (remaining <= 0) deadline = null
        _state.value = ready.copy(displayRestRemaining = remaining)
    }

    private fun addOptimisticRest(seconds: Int) {
        val now = SystemClock.elapsedRealtime()
        val remaining = remainingFromDeadline(deadline, now)
        deadline = createRestDeadline((remaining + seconds).coerceAtLeast(0), now)
        updateDisplayRemaining()
    }
}
