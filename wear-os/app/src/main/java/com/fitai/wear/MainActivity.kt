package com.fitai.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      MaterialTheme {
        WorkoutScreen()
      }
    }
  }
}

@Composable
fun WorkoutScreen(vm: WorkoutViewModel = viewModel()) {
  val ui by vm.ui.collectAsState()

  if (ui.loading && ui.state == null) {
    Column(
      modifier = Modifier.fillMaxSize(),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center,
    ) {
      CircularProgressIndicator()
      Text("Connexion...", modifier = Modifier.padding(top = 8.dp))
    }
    return
  }

  val state = ui.state
  if (state == null) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(12.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center,
    ) {
      Text(ui.error ?: "Aucune séance active", textAlign = TextAlign.Center)
      Button(onClick = { vm.refresh() }, modifier = Modifier.padding(top = 10.dp)) {
        Text("Rafraichir")
      }
    }
    return
  }

  val resting = ui.isResting

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(horizontal = 10.dp, vertical = 8.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.SpaceBetween,
  ) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
      Text(
        text = state.exerciseName,
        style = MaterialTheme.typography.title3,
        textAlign = TextAlign.Center,
      )
      Text(
        text = "Exercice ${state.exerciseIndex}/${state.totalExercises}",
        style = MaterialTheme.typography.caption1,
      )
      Text(
        text = "Serie ${state.setIndex}/${state.totalSets}",
        style = MaterialTheme.typography.caption1,
      )
      Text(
        text = "Reps cible ${state.targetReps}  •  ${state.weight?.toString() ?: "-"} kg",
        style = MaterialTheme.typography.caption2,
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(top = 2.dp),
      )
      if (resting) {
        Text(
          text = "Repos ${state.restRemaining}s",
          style = MaterialTheme.typography.title2,
          modifier = Modifier.padding(top = 8.dp),
        )
      }
    }

    Button(
      onClick = { if (resting) vm.skipRest() else vm.validateSet() },
      modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = 6.dp),
    ) {
      Text(if (resting) "Passer repos" else "Valider")
    }

    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Button(onClick = { vm.previousExercise() }) { Text("Prec") }
      Button(onClick = { vm.nextExercise() }) { Text("Suiv") }
      Button(onClick = { vm.completeSession() }) { Text("Fin") }
    }
  }
}

