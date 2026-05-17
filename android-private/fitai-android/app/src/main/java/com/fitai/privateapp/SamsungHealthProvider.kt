package com.fitai.privateapp

import java.time.Instant

interface SamsungHealthProvider {
    suspend fun readLatestMetrics(): List<SamsungMetricRecord>
}

class SamsungHealthProviderMock : SamsungHealthProvider {
    override suspend fun readLatestMetrics(): List<SamsungMetricRecord> {
        val now = Instant.now().toString()
        return listOf(
            SamsungMetricRecord(metric = "steps", value = 7500.0, measuredAt = now, sourceDevice = "Galaxy Watch"),
            SamsungMetricRecord(metric = "heart_rate", value = 62.0, measuredAt = now, sourceDevice = "Galaxy Watch"),
            SamsungMetricRecord(metric = "sleep_minutes", value = 420.0, measuredAt = now, sourceDevice = "Galaxy Watch"),
        )
    }
}

