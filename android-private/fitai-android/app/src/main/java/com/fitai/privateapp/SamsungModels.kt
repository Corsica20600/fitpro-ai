package com.fitai.privateapp

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

