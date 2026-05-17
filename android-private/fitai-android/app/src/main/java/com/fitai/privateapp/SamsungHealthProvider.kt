package com.fitai.privateapp

import android.app.Activity
import android.content.Context
import java.time.Instant
import java.util.concurrent.CountDownLatch
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
    private val legacyRoot = "com.samsung.android.sdk.healthdata"

    override suspend fun ensurePermissions(activity: Activity): HealthPermissionState {
        if (!isSdkAvailable()) {
            return HealthPermissionState(
                sdkAvailable = false,
                permissionsGranted = false,
                usingMockFallback = true,
                message = "AAR Samsung Health Data SDK absent.",
            )
        }

        return try {
            val store = getStoreOrNull()
                ?: return HealthPermissionState(
                    sdkAvailable = true,
                    permissionsGranted = false,
                    usingMockFallback = false,
                    message = "Impossible d'ouvrir le store Samsung Health.",
                )

            val connected = connectStore(store)
            if (!connected) {
                return HealthPermissionState(
                    sdkAvailable = true,
                    permissionsGranted = false,
                    usingMockFallback = false,
                    message = "Connexion Samsung Health impossible.",
                )
            }

            val (permissionKeys, allGrantedNow) = buildPermissionKeysAndCheck(store)
            if (allGrantedNow) {
                return HealthPermissionState(
                    sdkAvailable = true,
                    permissionsGranted = true,
                    usingMockFallback = false,
                    message = "Permissions Samsung Health accordees.",
                )
            }

            val requested = requestPermissions(store, permissionKeys, activity)
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
        return runCatching { Class.forName("$legacyRoot.HealthDataService") }.isSuccess &&
            runCatching { Class.forName("$legacyRoot.HealthPermissionManager") }.isSuccess
    }

    private fun getStoreOrNull(): Any? {
        val serviceClass = Class.forName("$legacyRoot.HealthDataService")
        val getStore = serviceClass.getMethod("getStore", Context::class.java)
        return getStore.invoke(null, context.applicationContext)
    }

    private fun connectStore(store: Any): Boolean {
        val latch = CountDownLatch(1)
        var ok = false
        runCatching {
            val storeClass = Class.forName("$legacyRoot.HealthDataStore")
            val listenerClass = Class.forName("$legacyRoot.HealthDataStore\$ConnectionListener")
            val proxy = java.lang.reflect.Proxy.newProxyInstance(
                listenerClass.classLoader,
                arrayOf(listenerClass),
            ) { _, method, _ ->
                when (method.name) {
                    "onConnected" -> {
                        ok = true
                        latch.countDown()
                    }
                    "onConnectionFailed", "onDisconnected" -> {
                        ok = false
                        latch.countDown()
                    }
                }
                null
            }
            storeClass.getMethod("setConnectionListener", listenerClass).invoke(store, proxy)
            storeClass.getMethod("connectService").invoke(store)
            latch.await(6, TimeUnit.SECONDS)
        }.onFailure {
            ok = false
        }
        return ok
    }

    private fun buildPermissionKeysAndCheck(store: Any): Pair<Set<Any>, Boolean> {
        val keyClass = Class.forName("$legacyRoot.HealthPermissionManager\$PermissionKey")
        val typeClass = Class.forName("$legacyRoot.HealthPermissionManager\$PermissionType")
        val readType = typeClass.enumConstants.firstOrNull { it.toString() == "READ" }
            ?: error("PermissionType.READ introuvable")

        val stepType = getHealthDataType("StepCount")
        val hrType = getHealthDataType("HeartRate")
        val exType = getHealthDataType("Exercise")
        val sleepType = getHealthDataType("Sleep")

        val keys = linkedSetOf(
            keyClass.getConstructor(String::class.java, typeClass).newInstance(stepType, readType),
            keyClass.getConstructor(String::class.java, typeClass).newInstance(hrType, readType),
            keyClass.getConstructor(String::class.java, typeClass).newInstance(exType, readType),
            keyClass.getConstructor(String::class.java, typeClass).newInstance(sleepType, readType),
        )

        val pmClass = Class.forName("$legacyRoot.HealthPermissionManager")
        val pm = pmClass.getConstructor(Class.forName("$legacyRoot.HealthDataStore")).newInstance(store)
        val resultMap = pmClass.getMethod("isPermissionAcquired", Set::class.java).invoke(pm, keys) as? Map<*, *>
        val granted = resultMap?.values?.all { it == true } == true
        return keys to granted
    }

    private fun requestPermissions(store: Any, permissionKeys: Set<Any>, activity: Activity): Boolean {
        val pmClass = Class.forName("$legacyRoot.HealthPermissionManager")
        val pm = pmClass.getConstructor(Class.forName("$legacyRoot.HealthDataStore")).newInstance(store)
        val holder = pmClass.getMethod("requestPermissions", Set::class.java, Activity::class.java)
            .invoke(pm, permissionKeys, activity)
        val holderClass = Class.forName("$legacyRoot.HealthResultHolder")
        val result = holderClass.getMethod("await").invoke(holder)
        val resultClass = Class.forName("$legacyRoot.HealthPermissionManager\$PermissionResult")
        val resultMap = resultClass.getMethod("getResultMap").invoke(result) as? Map<*, *>
        return resultMap?.values?.all { it == true } == true
    }

    private fun getHealthDataType(simpleClass: String): String {
        val constantsClass = Class.forName("$legacyRoot.HealthConstants\$$simpleClass")
        val field = constantsClass.getField("HEALTH_DATA_TYPE")
        return field.get(null) as String
    }

    private fun tryReadLatestStepCount(): Double? = runCatching {
        queryLatestNumeric("StepCount", "count")
    }.getOrNull()

    private fun tryReadLatestHeartRate(): Double? = runCatching {
        queryLatestNumeric("HeartRate", "heart_rate")
    }.getOrNull()

    private fun tryReadLatestCalories(): Double? = runCatching {
        queryLatestNumeric("Exercise", "calorie")
    }.getOrNull()

    private fun tryReadLatestDistance(): Double? = runCatching {
        queryLatestNumeric("Exercise", "distance")
    }.getOrNull()

    private fun tryReadLatestSleepMinutes(): Double? = runCatching {
        val start = queryLatestLong("Sleep", "start_time")
        val end = queryLatestLong("Sleep", "end_time")
        if (start != null && end != null && end > start) (end - start) / 60000.0 else null
    }.getOrNull()

    private fun queryLatestNumeric(constantClass: String, fieldName: String): Double? {
        val value = queryLatestAny(constantClass, fieldName) ?: return null
        return when (value) {
            is Number -> value.toDouble()
            else -> value.toString().toDoubleOrNull()
        }
    }

    private fun queryLatestLong(constantClass: String, fieldName: String): Long? {
        val value = queryLatestAny(constantClass, fieldName) ?: return null
        return when (value) {
            is Number -> value.toLong()
            else -> value.toString().toLongOrNull()
        }
    }

    private fun queryLatestAny(constantClass: String, fieldName: String): Any? {
        val store = getStoreOrNull() ?: return null
        if (!connectStore(store)) return null

        val resolverClass = Class.forName("$legacyRoot.HealthDataResolver")
        val requestClass = Class.forName("$legacyRoot.HealthDataResolver\$ReadRequest")
        val builderClass = Class.forName("$legacyRoot.HealthDataResolver\$ReadRequest\$Builder")
        val sortOrderClass = Class.forName("$legacyRoot.HealthDataResolver\$SortOrder")

        val resolver = resolverClass.getConstructor(Class.forName("$legacyRoot.HealthDataStore")).newInstance(store)
        val dataType = getHealthDataType(constantClass)
        val builder = builderClass.getConstructor(String::class.java).newInstance(dataType)

        val sortMethod = builderClass.getMethod("setSort", String::class.java, sortOrderClass)
        val descOrder = sortOrderClass.enumConstants.firstOrNull { it.toString() == "DESC" }
        if (descOrder != null) {
            sortMethod.invoke(builder, "update_time", descOrder)
        }
        val setResultCount = builderClass.getMethod("setResultCount", Int::class.javaPrimitiveType)
        setResultCount.invoke(builder, 1)
        val build = builderClass.getMethod("build")
        val request = build.invoke(builder)

        val readMethod = resolverClass.getMethod("read", requestClass)
        val holder = readMethod.invoke(resolver, request)
        val holderClass = Class.forName("$legacyRoot.HealthResultHolder")
        val result = holderClass.getMethod("await").invoke(holder)
        val resultClass = Class.forName("$legacyRoot.HealthDataResolver\$ReadResult")
        val count = resultClass.getMethod("getCount").invoke(result) as Int
        if (count <= 0) return null
        val getData = resultClass.getMethod("getResult", Int::class.javaPrimitiveType)
        val row = getData.invoke(result, 0)
        val rowClass = Class.forName("$legacyRoot.HealthData")
        return runCatching { rowClass.getMethod("getDouble", String::class.java).invoke(row, fieldName) }.getOrNull()
            ?: runCatching { rowClass.getMethod("getLong", String::class.java).invoke(row, fieldName) }.getOrNull()
            ?: runCatching { rowClass.getMethod("getFloat", String::class.java).invoke(row, fieldName) }.getOrNull()
            ?: runCatching { rowClass.getMethod("getInt", String::class.java).invoke(row, fieldName) }.getOrNull()
    }
}
