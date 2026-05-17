package com.fitai.privateapp

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.fitai.privateapp.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val samsungHealthProvider = SamsungHealthProviderMock()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.textConfig.text = "API: ${BuildConfig.FITAI_SYNC_BASE_URL}"
        binding.buttonSync.setOnClickListener { syncNow() }
    }

    private fun syncNow() {
        binding.buttonSync.isEnabled = false
        binding.textStatus.text = "Sync en cours..."

        lifecycleScope.launch {
            val records = samsungHealthProvider.readLatestMetrics()
            val result = withContext(Dispatchers.IO) {
                SamsungSyncApi.push(
                    baseUrl = "https://fitai-pro-zeta.vercel.app/",
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
}

