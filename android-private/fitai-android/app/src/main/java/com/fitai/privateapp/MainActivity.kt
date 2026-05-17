package com.fitai.privateapp

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.fitai.privateapp.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val fitAiUrl = "https://fitai-pro-zeta.vercel.app"
    private val allowedHosts = setOf("fitai-pro-zeta.vercel.app")
    private val samsungFallbackUrl = "https://www.samsung.com/global/galaxy/apps/samsung-health/"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.hide()
        binding.buttonOpenSync.setOnClickListener {
            startActivity(Intent(this, SyncHealthActivity::class.java))
        }
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webViewFitAi.canGoBack()) {
                    binding.webViewFitAi.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        setupWebView()
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

        if ((scheme == "http" || scheme == "https") && allowedHosts.any { host == it || host.endsWith(".$it") }) {
            return false
        }

        if (scheme == "http" || scheme == "https") {
            return openExternalSafely(Intent(Intent.ACTION_VIEW, uri))
        }

        if (scheme == "intent") {
            val intent = runCatching { Intent.parseUri(rawUrl, Intent.URI_INTENT_SCHEME) }.getOrNull()
            if (intent != null && openExternalSafely(intent)) return true
            if (!openExternalSafely(Intent(Intent.ACTION_VIEW, Uri.parse(samsungFallbackUrl)))) {
                Toast.makeText(this, "Samsung Health indisponible sur cet appareil.", Toast.LENGTH_SHORT).show()
            }
            return true
        }

        val opened = openExternalSafely(Intent(Intent.ACTION_VIEW, uri))
        if (!opened) {
            Toast.makeText(this, "Application non disponible pour ce lien.", Toast.LENGTH_SHORT).show()
        }
        return true
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
}
