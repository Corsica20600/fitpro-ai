package com.fitai.wear

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitai.wear.api.WatchApiClient
import com.fitai.wear.api.WatchSessionState
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class WorkoutUiState(
  val loading: Boolean = false,
  val error: String? = null,
  val state: WatchSessionState? = null,
) {
  val isResting: Boolean get() = (state?.restRemaining ?: 0) > 0
  val isActive: Boolean get() = state?.status == "IN_PROGRESS"
}

class WorkoutViewModel : ViewModel() {
  private val api = WatchApiClient()
  private val _ui = MutableStateFlow(WorkoutUiState(loading = true))
  val ui: StateFlow<WorkoutUiState> = _ui.asStateFlow()
  private var pollingJob: Job? = null

  init {
    refresh()
  }

  fun refresh() {
    viewModelScope.launch {
      _ui.value = _ui.value.copy(loading = true, error = null)
      val response = runCatching { api.getCurrentSession() }.getOrNull()
      _ui.value = if (response != null) {
        _ui.value.copy(loading = false, state = response, error = null)
      } else {
        _ui.value.copy(loading = false, error = "Session indisponible")
      }
      managePolling()
    }
  }

  fun validateSet() {
    val current = _ui.value.state ?: return
    submit { api.validateSet(current.sessionId, current.targetReps, current.weight) }
  }

  fun nextExercise() {
    val current = _ui.value.state ?: return
    submit { api.nextExercise(current.sessionId) }
  }

  fun previousExercise() {
    val current = _ui.value.state ?: return
    submit { api.previousExercise(current.sessionId) }
  }

  fun skipRest() {
    val current = _ui.value.state ?: return
    submit { api.skipRest(current.sessionId) }
  }

  fun completeSession() {
    val current = _ui.value.state ?: return
    submit { api.completeSession(current.sessionId) }
  }

  private fun submit(action: () -> WatchSessionState?) {
    viewModelScope.launch {
      _ui.value = _ui.value.copy(loading = true, error = null)
      val response = runCatching(action).getOrNull()
      _ui.value = if (response != null) {
        _ui.value.copy(loading = false, state = response, error = null)
      } else {
        _ui.value.copy(loading = false, error = "Action impossible")
      }
      managePolling()
    }
  }

  private fun managePolling() {
    pollingJob?.cancel()
    if (!_ui.value.isActive) return
    pollingJob = viewModelScope.launch {
      while (true) {
        delay(5_000)
        val response = runCatching { api.getCurrentSession() }.getOrNull() ?: continue
        _ui.value = _ui.value.copy(state = response, error = null)
      }
    }
  }

  override fun onCleared() {
    pollingJob?.cancel()
    super.onCleared()
  }
}

