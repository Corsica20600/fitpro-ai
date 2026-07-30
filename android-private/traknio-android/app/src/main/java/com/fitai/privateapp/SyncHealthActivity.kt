package com.fitai.privateapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.result.ActivityResultLauncher
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import com.fitai.privateapp.databinding.ActivitySyncHealthBinding
import kotlinx.coroutines.launch

class SyncHealthActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySyncHealthBinding
    private lateinit var healthConnectProvider: HealthConnectProvider
    private lateinit var healthConnectPermissionLauncher: ActivityResultLauncher<Set<String>>
    private var syncPendingAfterHealthConnectPermission = false
    private val prefs by lazy { getSharedPreferences("traknio_health_sync", MODE_PRIVATE) }

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
                        runHealthSync(requestPermissions = false, force = true)
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
        binding.buttonSync.isEnabled = false
        binding.textStatus.text = "Sync en cours..."
        lifecycleScope.launch {
            runHealthSync(requestPermissions = true, force = true)
        }
    }

    private suspend fun runHealthSync(requestPermissions: Boolean, force: Boolean) {
        val outcome = HealthSyncRunner.sync(
            context = applicationContext,
            requestPermissions = requestPermissions,
            force = force,
        )
        when (outcome) {
            is HealthSyncOutcome.NeedsPermissions -> {
                binding.textPermissionState.text = "Autorisation Health Connect requise."
                binding.textStatus.text = "Ouverture des permissions Health Connect..."
                syncPendingAfterHealthConnectPermission = true
                healthConnectPermissionLauncher.launch(HealthConnectProvider.permissions)
            }
            is HealthSyncOutcome.Success -> {
                binding.buttonSync.isEnabled = true
                binding.textPermissionState.text = "Permissions Health Connect accordees."
                binding.textStatus.text = outcome.message
                HealthSyncWorker.schedule(applicationContext)
            }
            is HealthSyncOutcome.Skipped -> {
                binding.buttonSync.isEnabled = true
                binding.textStatus.text = outcome.message
            }
            is HealthSyncOutcome.Failed -> {
                binding.buttonSync.isEnabled = true
                binding.textStatus.text = outcome.message
            }
        }
    }

    private fun requestPermissionsIfNeeded() {
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
                binding.buttonSync.isEnabled = false
                binding.textStatus.text = if (missing.isEmpty()) "Sync Health Connect automatique..." else "Preparation Health Connect..."
                runHealthSync(requestPermissions = true, force = true)
                return@launch
            }

            val state = SamsungHealthProviderFactory(applicationContext).create().ensurePermissions(this@SyncHealthActivity)
            binding.textPermissionState.text = state.message
            prefs.edit().putBoolean("health_perm_requested", true).apply()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
