package com.fitai.privateapp

import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.net.Uri
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
    private val samsungFallbackUrl = "https://www.samsung.com/global/galaxy/apps/samsung-health/"
    private val colorActiveBg = Color.parseColor("#2F6DE0")
    private val colorInactiveBg = Color.parseColor("#2A2E36")
    private val colorActiveText = Color.parseColor("#FFFFFF")
    private val colorInactiveText = Color.parseColor("#C9CED8")

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

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url.isNullOrBlank()) return false
                return handleNavigationUrl(url)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val target = request?.url?.toString() ?: return false
                return handleNavigationUrl(target)
            }
        }
        binding.webViewFitAi.loadUrl(fitAiUrl)
    }

    private fun handleNavigationUrl(rawUrl: String): Boolean {
        val uri = runCatching { Uri.parse(rawUrl) }.getOrNull() ?: return false
        val scheme = uri.scheme?.lowercase().orEmpty()
        val host = uri.host?.lowercase().orEmpty()

        // Keep FitAI URLs inside WebView.
        if ((scheme == "http" || scheme == "https") && allowedHosts.any { host == it || host.endsWith(".$it") }) {
            return false
        }

        // External HTTP(S): open in browser without crashing app.
        if (scheme == "http" || scheme == "https") {
            return openExternalSafely(Intent(Intent.ACTION_VIEW, uri))
        }

        // intent:// links (Samsung Health, etc.)
        if (scheme == "intent") {
            val intent = runCatching { Intent.parseUri(rawUrl, Intent.URI_INTENT_SCHEME) }.getOrNull()
            if (intent != null && openExternalSafely(intent)) {
                return true
            }
            // Fallback to Samsung page if intent is not resolvable.
            openExternalSafely(Intent(Intent.ACTION_VIEW, Uri.parse(samsungFallbackUrl)))
            return true
        }

        // Other custom schemes (spotify://, shealth://, ...)
        return openExternalSafely(Intent(Intent.ACTION_VIEW, uri))
    }

    private fun openExternalSafely(intent: Intent): Boolean {
        return try {
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
                true
            } else {
                false
            }
        } catch (_: Exception) {
            false
        }
    }

    private fun showFitAi() {
        binding.webViewFitAi.visibility = View.VISIBLE
        binding.syncContainer.visibility = View.GONE
        styleTabs(isFitAiActive = true)
    }

    private fun showSync() {
        binding.webViewFitAi.visibility = View.GONE
        binding.webLoading.visibility = View.GONE
        binding.syncContainer.visibility = View.VISIBLE
        styleTabs(isFitAiActive = false)
    }

    private fun styleTabs(isFitAiActive: Boolean) {
        val fitAiBg = if (isFitAiActive) colorActiveBg else colorInactiveBg
        val syncBg = if (isFitAiActive) colorInactiveBg else colorActiveBg
        val fitAiText = if (isFitAiActive) colorActiveText else colorInactiveText
        val syncText = if (isFitAiActive) colorInactiveText else colorActiveText

        binding.buttonTabFitAi.backgroundTintList = ColorStateList.valueOf(fitAiBg)
        binding.buttonTabSync.backgroundTintList = ColorStateList.valueOf(syncBg)
        binding.buttonTabFitAi.setTextColor(fitAiText)
        binding.buttonTabSync.setTextColor(syncText)
        binding.buttonTabFitAi.isEnabled = true
        binding.buttonTabSync.isEnabled = true
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
