package com.fitai.privateapp

import android.content.Context
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.temporal.ChronoUnit

class HealthConnectProvider(private val context: Context) {
    companion object {
        private const val TAG = "FITAI_HEALTH_CONNECT"

        val permissions = setOf(
            HealthPermission.getReadPermission(StepsRecord::class),
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
            HealthPermission.getReadPermission(DistanceRecord::class),
        )
    }

    fun isAvailable(): Boolean {
        return HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
    }

    suspend fun missingPermissions(): Set<String> {
        if (!isAvailable()) return permissions
        return permissions - grantedPermissions()
    }

    suspend fun grantedPermissions(): Set<String> {
        if (!isAvailable()) return emptySet()
        return client().permissionController.getGrantedPermissions()
    }

    suspend fun readLatestMetrics(): HealthReadResult {
        if (!isAvailable()) {
            return HealthReadResult(
                records = emptyList(),
                usingMockFallback = false,
                message = "Health Connect indisponible sur ce telephone.",
            )
        }

        val end = Instant.now()
        val start = end.minus(24, ChronoUnit.HOURS)
        val timeRange = TimeRangeFilter.between(start, end)
        val measuredAt = end.toString()
        val records = mutableListOf<SamsungMetricRecord>()
        val errors = mutableListOf<String>()

        runCatching { readSteps(timeRange) }
            .onSuccess { value -> if (value > 0) records += SamsungMetricRecord("steps", value, measuredAt, "Health Connect") }
            .onFailure { throwable ->
                Log.e(TAG, "Steps read failed", throwable)
                errors += "steps"
            }

        runCatching { readAverageHeartRate(timeRange) }
            .onSuccess { value -> if (value > 0) records += SamsungMetricRecord("heart_rate", value, measuredAt, "Health Connect") }
            .onFailure { throwable ->
                Log.e(TAG, "Heart rate read failed", throwable)
                errors += "heart_rate"
            }

        runCatching { readCalories(timeRange) }
            .onSuccess { value -> if (value > 0) records += SamsungMetricRecord("calories", value, measuredAt, "Health Connect") }
            .onFailure { throwable ->
                Log.e(TAG, "Calories read failed", throwable)
                errors += "calories"
            }

        runCatching { readDistance(timeRange) }
            .onSuccess { value -> if (value > 0) records += SamsungMetricRecord("distance_m", value, measuredAt, "Health Connect") }
            .onFailure { throwable ->
                Log.e(TAG, "Distance read failed", throwable)
                errors += "distance_m"
            }

        return HealthReadResult(
            records = records,
            usingMockFallback = false,
            message = if (records.isNotEmpty()) {
                "Donnees Health Connect lues (${records.size} mesures)."
            } else if (errors.isNotEmpty()) {
                "Health Connect lu, mais sans donnees exploitables (${errors.joinToString(", ")})."
            } else {
                "Aucune donnee Health Connect sur les dernieres 24 h."
            },
        )
    }

    private fun client() = HealthConnectClient.getOrCreate(context)

    private suspend fun readSteps(timeRange: TimeRangeFilter): Double {
        val response = client().readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = timeRange,
            ),
        )
        return response.records.sumOf { it.count.toDouble() }
    }

    private suspend fun readAverageHeartRate(timeRange: TimeRangeFilter): Double {
        val response = client().readRecords(
            ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = timeRange,
            ),
        )
        val samples = response.records.flatMap { it.samples }
        if (samples.isEmpty()) return 0.0
        return samples.map { it.beatsPerMinute.toDouble() }.average()
    }

    private suspend fun readCalories(timeRange: TimeRangeFilter): Double {
        val response = client().readRecords(
            ReadRecordsRequest(
                recordType = TotalCaloriesBurnedRecord::class,
                timeRangeFilter = timeRange,
            ),
        )
        return response.records.sumOf { it.energy.inKilocalories }
    }

    private suspend fun readDistance(timeRange: TimeRangeFilter): Double {
        val response = client().readRecords(
            ReadRecordsRequest(
                recordType = DistanceRecord::class,
                timeRangeFilter = timeRange,
            ),
        )
        return response.records.sumOf { it.distance.inMeters }
    }
}
