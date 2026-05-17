package com.fitai.privateapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.fitai.privateapp.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val samsungHealthProvider = SamsungHealthProviderMock()
    private val fitAiUrl = "https://fitai-pro-zeta.vercel.app"
    private val allowedHosts = setOf("fitai-pro-zeta.vercel.app")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.textConfig.text = "API: ${BuildConfig.FITAI_SYNC_BASE_URL}"
        binding.buttonSync.setOnClickListener { syncNow() }
        binding.buttonTabFitAi.setOnClickListener { showFitAi() }
        binding.buttonTabSync.setOnClickListener { showSync() }

        setupWebView()
        showFitAi()
    }

    private fun setupWebView() {
        binding.webViewFitAi.settings.javaScriptEnabled = true
        binding.webViewFitAi.settings.domStorageEnabled = true
        binding.webViewFitAi.settings.loadsImagesAutomatically = true
        binding.webViewFitAi.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                binding.webLoading.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.webLoading.visibility = View.GONE
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val target = request?.url ?: return false
                val host = target.host?.lowercase().orEmpty()
                if (allowedHosts.any { host == it || host.endsWith(".$it") }) {
                    return false
                }
                startActivity(Intent(Intent.ACTION_VIEW, target))
                return true
            }
        }
        binding.webViewFitAi.loadUrl(fitAiUrl)
    }

    private fun showFitAi() {
        binding.webViewFitAi.visibility = View.VISIBLE
        binding.syncContainer.visibility = View.GONE
        binding.buttonTabFitAi.alpha = 1f
        binding.buttonTabSync.alpha = 0.65f
        binding.buttonTabFitAi.isEnabled = false
        binding.buttonTabSync.isEnabled = true
    }

    private fun showSync() {
        binding.webViewFitAi.visibility = View.GONE
        binding.webLoading.visibility = View.GONE
        binding.syncContainer.visibility = View.VISIBLE
        binding.buttonTabFitAi.alpha = 0.65f
        binding.buttonTabSync.alpha = 1f
        binding.buttonTabFitAi.isEnabled = true
        binding.buttonTabSync.isEnabled = false
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (binding.webViewFitAi.visibility == View.VISIBLE && binding.webViewFitAi.canGoBack()) {
            binding.webViewFitAi.goBack()
            return
        }
        super.onBackPressed()
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
