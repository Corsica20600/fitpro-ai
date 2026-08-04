package com.traknio.app

data class SamsungMetricRecord(
    val metric: String,
    val value: Double,
    val measuredAt: String,
    val sourceDevice: String? = null,
)

data class SyncResult(
    val ok: Boolean,
    val message: String,
)

data class HealthPermissionState(
    val sdkAvailable: Boolean,
    val permissionsGranted: Boolean,
    val usingMockFallback: Boolean,
    val message: String,
)

data class HealthReadResult(
    val records: List<SamsungMetricRecord>,
    val usingMockFallback: Boolean,
    val message: String,
)

enum class HealthSyncSource(val label: String, val endpointPath: String) {
    HEALTH_CONNECT("Health Connect", "/api/health/connect/sync"),
    SAMSUNG_HEALTH("Samsung Health", "/api/health/samsung/sync"),
}
