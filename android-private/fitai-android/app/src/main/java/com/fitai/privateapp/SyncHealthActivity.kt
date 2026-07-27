package com.fitai.privateapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.result.ActivityResultLauncher
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import com.fitai.privateapp.databinding.ActivitySyncHealthBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SyncHealthActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySyncHealthBinding
    private lateinit var samsungHealthProvider: SamsungHealthProvider
    private lateinit var healthConnectProvider: HealthConnectProvider
    private lateinit var healthConnectPermissionLauncher: ActivityResultLauncher<Set<String>>
    private var syncPendingAfterHealthConnectPermission = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        healthConnectProvider = HealthConnectProvider(applicationContext)
        healthConnectPermissionLauncher = registerForActivityResult(
            PermissionController.createRequestPermissionResultContract(),
        ) { granted ->
            lifecycleScope.launch {
                val missing = HealthConnectProvider.permissions - granted
                val grantedRequired = granted.intersect(HealthConnectProvider.permissions)
                binding.textPermissionState.text = if (missing.isEmpty()) {
                    "Permissions Health Connect accordees."
                } else if (grantedRequired.isNotEmpty()) {
                    "Permissions Health Connect partielles (${grantedRequired.size}/${HealthConnectProvider.permissions.size})."
                } else {
                    "Permissions Health Connect incompletes."
                }
                if (syncPendingAfterHealthConnectPermission) {
                    syncPendingAfterHealthConnectPermission = false
                    if (grantedRequired.isNotEmpty()) {
                        syncHealthConnect(requestMissingPermissions = false)
                    } else {
                        binding.buttonSync.isEnabled = true
                        binding.textStatus.text = "Aucune permission Health Connect accordee."
                    }
                }
            }
        }

        binding = ActivitySyncHealthBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = getString(R.string.tab_sync_health)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        samsungHealthProvider = SamsungHealthProviderFactory(applicationContext).create()
        binding.textConfig.text = "API: ${BuildConfig.FITAI_SYNC_BASE_URL}"
        binding.buttonSync.setOnClickListener { syncNow() }
        binding.buttonBackToFitAi.setOnClickListener { finish() }
        binding.buttonOpenSettings.setOnClickListener { openFitAiSettings() }
        requestPermissionsIfNeeded()
    }

    private fun openFitAiSettings() {
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra(MainActivity.EXTRA_INITIAL_PATH, "/settings")
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        startActivity(intent)
        finish()
    }

    private fun syncNow() {
        if (BuildConfig.FITAI_SYNC_TOKEN.isBlank()) {
            binding.textStatus.text = "Erreur: FITAI_SYNC_TOKEN manquant"
            return
        }
        binding.buttonSync.isEnabled = false
        binding.textStatus.text = "Sync en cours..."

        lifecycleScope.launch {
            if (healthConnectProvider.isAvailable()) {
                syncHealthConnect()
                return@launch
            }

            val permissionState = samsungHealthProvider.ensurePermissions(this@SyncHealthActivity)
            binding.textPermissionState.text = permissionState.message
            if (!permissionState.permissionsGranted && !permissionState.usingMockFallback) {
                binding.buttonSync.isEnabled = true
                binding.textStatus.text = "Erreur Samsung Health: permissions non accordees"
                return@launch
            }

            val readResult = samsungHealthProvider.readLatestMetrics()
            if (readResult.records.isEmpty()) {
                binding.buttonSync.isEnabled = true
                binding.textStatus.text = "Aucune donnee trouvee"
                return@launch
            }
            val result = withContext(Dispatchers.IO) {
                SamsungSyncApi.push(
                    baseUrl = BuildConfig.FITAI_SYNC_BASE_URL,
                    token = BuildConfig.FITAI_SYNC_TOKEN,
                    records = readResult.records,
                    source = HealthSyncSource.SAMSUNG_HEALTH,
                )
            }

            binding.buttonSync.isEnabled = true
            binding.textStatus.text = if (result.ok) {
                "Sync reussie: ${result.message}"
            } else {
                "Erreur Samsung Health: ${result.message}"
            }
        }
    }

    private suspend fun syncHealthConnect(requestMissingPermissions: Boolean = true) {
        val missing = healthConnectProvider.missingPermissions()
        if (missing.isNotEmpty() && requestMissingPermissions) {
            binding.textPermissionState.text = "Autorisation Health Connect requise."
            binding.textStatus.text = "Ouverture des permissions Health Connect..."
            syncPendingAfterHealthConnectPermission = true
            healthConnectPermissionLauncher.launch(HealthConnectProvider.permissions)
            return
        }

        val granted = healthConnectProvider.grantedPermissions().intersect(HealthConnectProvider.permissions)
        if (granted.isEmpty()) {
            binding.buttonSync.isEnabled = true
            binding.textPermissionState.text = "Permissions Health Connect incompletes."
            binding.textStatus.text = "Aucune permission Health Connect accordee."
            return
        }

        binding.textPermissionState.text = if (missing.isEmpty()) {
            "Permissions Health Connect accordees."
        } else {
            "Permissions Health Connect partielles (${granted.size}/${HealthConnectProvider.permissions.size})."
        }
        val readResult = healthConnectProvider.readLatestMetrics()
        if (readResult.records.isEmpty()) {
            binding.buttonSync.isEnabled = true
            binding.textStatus.text = readResult.message
            return
        }

        val result = withContext(Dispatchers.IO) {
            SamsungSyncApi.push(
                baseUrl = BuildConfig.FITAI_SYNC_BASE_URL,
                token = BuildConfig.FITAI_SYNC_TOKEN,
                records = readResult.records,
                source = HealthSyncSource.HEALTH_CONNECT,
            )
        }

        binding.buttonSync.isEnabled = true
        binding.textStatus.text = if (result.ok) {
            "Sync Health Connect reussie: ${result.message}"
        } else {
            "Erreur Health Connect: ${result.message}"
        }
    }

    private fun requestPermissionsIfNeeded() {
        val prefs = getSharedPreferences("fitai_sync", MODE_PRIVATE)

        lifecycleScope.launch {
            if (healthConnectProvider.isAvailable()) {
                val missing = healthConnectProvider.missingPermissions()
                val granted = healthConnectProvider.grantedPermissions().intersect(HealthConnectProvider.permissions)
                binding.textPermissionState.text = if (missing.isEmpty()) {
                    "Permissions Health Connect accordees."
                } else if (granted.isNotEmpty()) {
                    "Permissions Health Connect partielles (${granted.size}/${HealthConnectProvider.permissions.size})."
                } else {
                    "Permissions Health Connect a accorder."
                }
                prefs.edit().putBoolean("health_perm_requested", true).apply()
                return@launch
            }

            val state = samsungHealthProvider.ensurePermissions(this@SyncHealthActivity)
            binding.textPermissionState.text = state.message
            prefs.edit().putBoolean("health_perm_requested", true).apply()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
