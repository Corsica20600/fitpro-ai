package com.fitai.privateapp

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.fitai.privateapp.databinding.ActivitySyncHealthBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SyncHealthActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySyncHealthBinding
    private lateinit var samsungHealthProvider: SamsungHealthProvider

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySyncHealthBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = getString(R.string.tab_sync_health)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        samsungHealthProvider = SamsungHealthProviderFactory(applicationContext).create()
        binding.textConfig.text = "API: ${BuildConfig.FITAI_SYNC_BASE_URL}"
        binding.buttonSync.setOnClickListener { syncNow() }
        requestPermissionsIfNeeded()
    }

    private fun syncNow() {
        if (BuildConfig.FITAI_SYNC_TOKEN.isBlank()) {
            binding.textStatus.text = "Erreur: FITAI_SYNC_TOKEN manquant"
            return
        }
        binding.buttonSync.isEnabled = false
        binding.textStatus.text = "Sync en cours..."

        lifecycleScope.launch {
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
                    baseUrl = "https://fitai-pro-zeta.vercel.app" ,
                    token = "Erwan20620@/",
                    records = readResult.records,
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

    private fun requestPermissionsIfNeeded() {
        val prefs = getSharedPreferences("fitai_sync", MODE_PRIVATE)
        val alreadyRequested = prefs.getBoolean("samsung_perm_requested", false)
        if (alreadyRequested) return

        lifecycleScope.launch {
            val state = samsungHealthProvider.ensurePermissions(this@SyncHealthActivity)
            binding.textPermissionState.text = state.message
            prefs.edit().putBoolean("samsung_perm_requested", true).apply()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
