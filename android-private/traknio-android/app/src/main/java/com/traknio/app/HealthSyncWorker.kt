package com.traknio.app

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class HealthSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result {
        return when (HealthSyncRunner.sync(applicationContext, requestPermissions = false)) {
            is HealthSyncOutcome.Success -> Result.success()
            is HealthSyncOutcome.Skipped -> Result.success()
            is HealthSyncOutcome.NeedsPermissions -> Result.success()
            is HealthSyncOutcome.Failed -> Result.success()
        }
    }

    companion object {
        private const val PERIODIC_WORK_NAME = "traknio_health_periodic_sync"
        private const val ON_OPEN_WORK_NAME = "traknio_health_open_sync"

        private val networkConstraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        fun schedule(context: Context) {
            val periodicRequest = PeriodicWorkRequestBuilder<HealthSyncWorker>(6, TimeUnit.HOURS)
                .setConstraints(networkConstraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context.applicationContext).enqueueUniquePeriodicWork(
                PERIODIC_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                periodicRequest,
            )
        }

        fun runSoon(context: Context) {
            val oneTimeRequest = OneTimeWorkRequestBuilder<HealthSyncWorker>()
                .setConstraints(networkConstraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context.applicationContext).enqueueUniqueWork(
                ON_OPEN_WORK_NAME,
                ExistingWorkPolicy.KEEP,
                oneTimeRequest,
            )
        }
    }
}
