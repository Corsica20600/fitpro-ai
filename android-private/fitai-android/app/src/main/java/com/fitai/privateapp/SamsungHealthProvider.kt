package com.fitai.privateapp

import android.app.Activity
import android.content.Context
import java.time.Instant
import java.util.concurrent.TimeUnit

interface SamsungHealthProvider {
    suspend fun ensurePermissions(activity: Activity): HealthPermissionState
    suspend fun readLatestMetrics(): HealthReadResult
}

class SamsungHealthProviderFactory(private val context: Context) {
    fun create(): SamsungHealthProvider {
        val sdkProvider = SamsungHealthProviderSdk(context)
        return if (sdkProvider.isSdkAvailable()) sdkProvider else SamsungHealthProviderMock()
    }
}

class SamsungHealthProviderMock : SamsungHealthProvider {
    override suspend fun ensurePermissions(activity: Activity): HealthPermissionState {
        return HealthPermissionState(
            sdkAvailable = false,
            permissionsGranted = true,
            usingMockFallback = true,
            message = "SDK Samsung Health indisponible, fallback mock actif.",
        )
    }

    override suspend fun readLatestMetrics(): HealthReadResult {
        val now = Instant.now().toString()
        return HealthReadResult(
            records = listOf(
                SamsungMetricRecord(metric = "steps", value = 7500.0, measuredAt = now, sourceDevice = "Galaxy Watch"),
                SamsungMetricRecord(metric = "heart_rate", value = 62.0, measuredAt = now, sourceDevice = "Galaxy Watch"),
                SamsungMetricRecord(metric = "sleep_minutes", value = 420.0, measuredAt = now, sourceDevice = "Galaxy Watch"),
            ),
            usingMockFallback = true,
            message = "Donnees mock utilisees (SDK Samsung non actif).",
        )
    }
}

private class SamsungHealthProviderSdk(private val context: Context) : SamsungHealthProvider {
    private val sdkRoot = "com.samsung.android.sdk.health.data"
    private val dataTypeRoot = "$sdkRoot.request"
    private val permissionRoot = "$sdkRoot.permission"
    private val dataRoot = "$sdkRoot.data"

    override suspend fun ensurePermissions(activity: Activity): HealthPermissionState {
        if (!isSdkAvailable()) {
            return HealthPermissionState(
                sdkAvailable = false,
                permissionsGranted = false,
                usingMockFallback = true,
                message = "AAR Samsung Health Data SDK absente ou incompatible.",
            )
        }

        return try {
            if (!isSamsungHealthInstalled()) {
                return HealthPermissionState(
                    sdkAvailable = true,
                    permissionsGranted = false,
                    usingMockFallback = true,
                    message = "Samsung Health n'est pas installe.",
                )
            }

            val store = getStoreOrNull()
                ?: return HealthPermissionState(
                    sdkAvailable = true,
                    permissionsGranted = false,
                    usingMockFallback = false,
                    message = "Impossible d'ouvrir le store Samsung Health.",
                )

            val permissions = buildPermissions()
            val allGrantedNow = getGrantedPermissions(store, permissions)
            if (allGrantedNow) {
                return HealthPermissionState(
                    sdkAvailable = true,
                    permissionsGranted = true,
                    usingMockFallback = false,
                    message = "Permissions Samsung Health accordees.",
                )
            }

            val requested = requestPermissions(store, permissions, activity)
            HealthPermissionState(
                sdkAvailable = true,
                permissionsGranted = requested,
                usingMockFallback = false,
                message = if (requested) "Permissions Samsung Health accordees." else "Permissions Samsung Health refusees.",
            )
        } catch (e: Exception) {
            HealthPermissionState(
                sdkAvailable = true,
                permissionsGranted = false,
                usingMockFallback = false,
                message = "Erreur Samsung Health: ${e.message ?: "inconnue"}",
            )
        }
    }

    override suspend fun readLatestMetrics(): HealthReadResult {
        if (!isSdkAvailable()) {
            return SamsungHealthProviderMock().readLatestMetrics()
        }
        if (!isSamsungHealthInstalled()) {
            return HealthReadResult(
                records = SamsungHealthProviderMock().readLatestMetrics().records,
                usingMockFallback = true,
                message = "Samsung Health indisponible: fallback mock utilise.",
            )
        }

        val now = Instant.now().toString()
        val records = mutableListOf<SamsungMetricRecord>()
        tryReadLatestStepCount()?.let { records += SamsungMetricRecord("steps", it, now, "Samsung Health") }
        tryReadLatestHeartRate()?.let { records += SamsungMetricRecord("heart_rate", it, now, "Samsung Health") }
        tryReadLatestCalories()?.let { records += SamsungMetricRecord("calories", it, now, "Samsung Health") }
        tryReadLatestDistance()?.let { records += SamsungMetricRecord("distance_m", it, now, "Samsung Health") }
        tryReadLatestSleepMinutes()?.let { records += SamsungMetricRecord("sleep_minutes", it, now, "Samsung Health") }

        return if (records.isEmpty()) {
            HealthReadResult(
                records = emptyList(),
                usingMockFallback = false,
                message = "Aucune donnee Samsung Health trouvee.",
            )
        } else {
            HealthReadResult(
                records = records,
                usingMockFallback = false,
                message = "Donnees Samsung Health lues (${records.size} mesures).",
            )
        }
    }

    fun isSdkAvailable(): Boolean {
        return runCatching { Class.forName("$sdkRoot.HealthDataService") }.isSuccess &&
            runCatching { Class.forName("$sdkRoot.HealthDataStore") }.isSuccess &&
            runCatching { Class.forName("$permissionRoot.Permission") }.isSuccess
    }

    private fun isSamsungHealthInstalled(): Boolean {
        return try {
            @Suppress("DEPRECATION")
            context.packageManager.getPackageInfo("com.sec.android.app.shealth", 0)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun getStoreOrNull(): Any? {
        val serviceClass = Class.forName("$sdkRoot.HealthDataService")
        val getStore = serviceClass.getMethod("getStore", Context::class.java)
        return getStore.invoke(null, context.applicationContext)
    }

    private fun buildPermissions(): Set<Any> {
        val permissionClass = Class.forName("$permissionRoot.Permission")
        val accessTypeClass = Class.forName("$permissionRoot.AccessType")
        val dataTypesClass = Class.forName("$dataTypeRoot.DataTypes")
        val read = java.lang.Enum.valueOf(accessTypeClass as Class<out Enum<*>>, "READ")
        val ofMethod = permissionClass.getMethod("of", Class.forName("$dataTypeRoot.DataType"), accessTypeClass)

        val steps = dataTypesClass.getField("STEPS").get(null)
        val hr = dataTypesClass.getField("HEART_RATE").get(null)
        val exercise = dataTypesClass.getField("EXERCISE").get(null)
        val sleep = dataTypesClass.getField("SLEEP").get(null)

        return linkedSetOf(
            ofMethod.invoke(null, steps, read),
            ofMethod.invoke(null, hr, read),
            ofMethod.invoke(null, exercise, read),
            ofMethod.invoke(null, sleep, read),
        )
    }

    private fun getGrantedPermissions(store: Any, requested: Set<Any>): Boolean {
        val storeClass = Class.forName("$sdkRoot.HealthDataStore")
        val async = storeClass.getMethod("getGrantedPermissionsAsync", Set::class.java).invoke(store, requested)
        val grantedSet = asyncGet(async) as? Set<*> ?: emptySet<Any>()
        return grantedSet.containsAll(requested)
    }

    private fun requestPermissions(store: Any, permissions: Set<Any>, activity: Activity): Boolean {
        val storeClass = Class.forName("$sdkRoot.HealthDataStore")
        val async = storeClass.getMethod("requestPermissionsAsync", Set::class.java, Activity::class.java)
            .invoke(store, permissions, activity)
        val grantedSet = asyncGet(async) as? Set<*> ?: emptySet<Any>()
        return grantedSet.containsAll(permissions)
    }

    private fun asyncGet(asyncFuture: Any): Any? {
        return asyncFuture.javaClass.getMethod("get", Long::class.javaPrimitiveType, TimeUnit::class.java)
            .invoke(asyncFuture, 10L, TimeUnit.SECONDS)
    }

    private fun tryReadLatestSleepMinutes(): Double? = runCatching {
        val item = queryLatestDataPoint("SLEEP") ?: return null
        val sleepTypeClass = Class.forName("$dataTypeRoot.DataType\$SleepType")
        val durationField = sleepTypeClass.getField("DURATION").get(null)
        val getValue = item.javaClass.getMethod("getValue", Class.forName("$dataRoot.Field"))
        val duration = getValue.invoke(item, durationField) ?: return null
        val toMinutes = duration.javaClass.getMethod("toMinutes")
        (toMinutes.invoke(duration) as Number).toDouble()
    }.getOrNull()

    private fun tryReadLatestStepCount(): Double? = runCatching {
        val stepsTypeClass = Class.forName("$dataTypeRoot.DataType\$StepsType")
        val totalOperation = stepsTypeClass.getField("TOTAL").get(null)
        queryLatestAggregate(totalOperation)?.toDouble()
    }.getOrNull()

    private fun tryReadLatestHeartRate(): Double? = runCatching {
        val item = queryLatestDataPoint("HEART_RATE") ?: return null
        val hrTypeClass = Class.forName("$dataTypeRoot.DataType\$HeartRateType")
        val hrField = hrTypeClass.getField("HEART_RATE").get(null)
        val getValue = item.javaClass.getMethod("getValue", Class.forName("$dataRoot.Field"))
        val value = getValue.invoke(item, hrField) as? Number ?: return null
        value.toDouble()
    }.getOrNull()

    private fun tryReadLatestCalories(): Double? = runCatching {
        val item = queryLatestDataPoint("EXERCISE") ?: return null
        val sessions = readExerciseSessions(item)
        sessions.firstOrNull()?.let { first ->
            val getCalories = first.javaClass.getMethod("getCalories")
            (getCalories.invoke(first) as Number).toDouble()
        } ?: queryExerciseAggregateCalories()
    }.getOrNull()

    private fun tryReadLatestDistance(): Double? = runCatching {
        val item = queryLatestDataPoint("EXERCISE") ?: return null
        val sessions = readExerciseSessions(item)
        sessions.firstOrNull()?.let { first ->
            val getDistance = first.javaClass.getMethod("getDistance")
            (getDistance.invoke(first) as? Number)?.toDouble()
        }
    }.getOrNull()

    private fun queryExerciseAggregateCalories(): Double? {
        val exTypeClass = Class.forName("$dataTypeRoot.DataType\$ExerciseType")
        val op = exTypeClass.getField("TOTAL_CALORIES").get(null)
        return queryLatestAggregate(op)?.toDouble()
    }

    private fun readExerciseSessions(dataPoint: Any): List<Any> {
        val exTypeClass = Class.forName("$dataTypeRoot.DataType\$ExerciseType")
        val sessionsField = exTypeClass.getField("SESSIONS").get(null)
        val getValue = dataPoint.javaClass.getMethod("getValue", Class.forName("$dataRoot.Field"))
        @Suppress("UNCHECKED_CAST")
        return (getValue.invoke(dataPoint, sessionsField) as? List<Any>).orEmpty()
    }

    private fun queryLatestAggregate(operation: Any): Number? {
        val store = getStoreOrNull() ?: return null
        val getBuilder = operation.javaClass.getMethod("getRequestBuilder")
        val builder = getBuilder.invoke(operation) ?: return null
        applyTimeFilterAndOrdering(builder)
        val request = builder.javaClass.getMethod("build").invoke(builder)
        val storeClass = Class.forName("$sdkRoot.HealthDataStore")
        val async = storeClass.getMethod("aggregateDataAsync", Class.forName("$dataTypeRoot.AggregateRequest"))
            .invoke(store, request)
        val response = asyncGet(async) ?: return null
        val dataList = response.javaClass.getMethod("getDataList").invoke(response) as? List<*> ?: return null
        val first = dataList.firstOrNull() ?: return null
        val value = first.javaClass.getMethod("getValue").invoke(first) ?: return null
        return value as? Number
    }

    private fun queryLatestDataPoint(dataTypeFieldName: String): Any? {
        val store = getStoreOrNull() ?: return null
        val dataTypesClass = Class.forName("$dataTypeRoot.DataTypes")
        val dataType = dataTypesClass.getField(dataTypeFieldName).get(null) ?: return null
        val readBuilder = dataType.javaClass.getMethod("getReadDataRequestBuilder").invoke(dataType) ?: return null
        applyTimeFilterAndOrdering(readBuilder)
        val request = readBuilder.javaClass.getMethod("build").invoke(readBuilder)

        val storeClass = Class.forName("$sdkRoot.HealthDataStore")
        val async = storeClass.getMethod("readDataAsync", Class.forName("$dataTypeRoot.ReadDataRequest"))
            .invoke(store, request)
        val response = asyncGet(async) ?: return null
        val dataList = response.javaClass.getMethod("getDataList").invoke(response) as? List<*> ?: return null
        return dataList.firstOrNull()
    }

    private fun applyTimeFilterAndOrdering(builder: Any) {
        runCatching {
            val orderingClass = Class.forName("$dataTypeRoot.Ordering")
            val desc = java.lang.Enum.valueOf(orderingClass as Class<out Enum<*>>, "DESC")
            builder.javaClass.getMethod("setOrdering", orderingClass).invoke(builder, desc)
        }
        runCatching {
            builder.javaClass.getMethod("setLimit", Int::class.javaPrimitiveType).invoke(builder, 1)
        }
        runCatching {
            val instantFilterClass = Class.forName("$dataTypeRoot.InstantTimeFilter")
            val sinceMethod = instantFilterClass.getMethod("since", Instant::class.java)
            val filter = sinceMethod.invoke(null, Instant.now().minusSeconds(60L * 60L * 24L * 30L))
            builder.javaClass.getMethod("setInstantTimeFilter", instantFilterClass).invoke(builder, filter)
        }
        runCatching {
            val localFilterClass = Class.forName("$dataTypeRoot.LocalTimeFilter")
            val sinceMethod = localFilterClass.getMethod("since", java.time.LocalDateTime::class.java)
            val filter = sinceMethod.invoke(null, java.time.LocalDateTime.now().minusDays(30))
            builder.javaClass.getMethod("setLocalTimeFilter", localFilterClass).invoke(builder, filter)
        }
    }
}
