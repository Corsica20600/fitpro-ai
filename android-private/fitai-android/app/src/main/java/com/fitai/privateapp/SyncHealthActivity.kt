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
    private val samsungHealthProvider = SamsungHealthProviderMock()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySyncHealthBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = getString(R.string.tab_sync_health)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        binding.textConfig.text = "API: https://fitai-pro-zeta.vercel.app"
        binding.buttonSync.setOnClickListener { syncNow() }
    }

    private fun syncNow() {
        // Désactive le check pour test
        binding.buttonSync.isEnabled = false
        binding.textStatus.text = "Sync en cours..."

        lifecycleScope.launch {
            val records = samsungHealthProvider.readLatestMetrics()
            val result = withContext(Dispatchers.IO) {
                SamsungSyncApi.push(
                    baseUrl = "https://fitai-pro-zeta.vercel.app",
                    token = "Erwan20620@/",
                    records = records,
                )
            }

            binding.buttonSync.isEnabled = true
            binding.textStatus.text = if (result.ok) {
                "OK: ${result.message}"
            } else {
                "Erreur: ${result.message}"
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
