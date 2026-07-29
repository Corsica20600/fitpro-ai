package com.fitai.privateapp

import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.webkit.CookieManager
import android.webkit.WebResourceError
import android.webkit.WebResourceResponse
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.fitai.privateapp.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    companion object {
        const val EXTRA_INITIAL_PATH = "com.fitai.privateapp.EXTRA_INITIAL_PATH"
    }

    private lateinit var binding: ActivityMainBinding
    private val fitAiUrl = BuildConfig.FITAI_SYNC_BASE_URL.trimEnd('/')
    private val allowedHosts = setOfNotNull(Uri.parse(fitAiUrl).host?.lowercase())
    private val samsungFallbackUrl = "https://www.samsung.com/global/galaxy/apps/samsung-health/"
    private val spotifyFallbackUrl = "https://open.spotify.com/"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setBackgroundDrawableResource(R.color.fitai_system_bar)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        applyDarkSystemBars()
        supportActionBar?.hide()
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
        binding.webRetryButton.setOnClickListener {
            binding.webErrorPanel.visibility = View.GONE
            binding.webViewFitAi.reload()
        }
    }

    private fun applyDarkSystemBars() {
        window.statusBarColor = Color.rgb(3, 7, 18)
        window.navigationBarColor = Color.rgb(3, 7, 18)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
            )
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = 0
        }
    }

    private fun setupWebView() {
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(binding.webViewFitAi, true)
        binding.webViewFitAi.settings.javaScriptEnabled = true
        binding.webViewFitAi.settings.domStorageEnabled = true
        binding.webViewFitAi.settings.databaseEnabled = true
        binding.webViewFitAi.settings.loadsImagesAutomatically = true
        binding.webViewFitAi.setBackgroundColor(Color.rgb(10, 19, 40))
        binding.webViewFitAi.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                binding.webErrorPanel.visibility = View.GONE
                binding.webLoading.visibility = View.VISIBLE
                binding.launchOverlay.visibility = View.VISIBLE
                binding.launchOverlay.alpha = 1f
            }

            override fun onPageCommitVisible(view: WebView?, url: String?) {
                super.onPageCommitVisible(view, url)
                hideLaunchOverlay()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.webLoading.visibility = View.GONE
                hideLaunchOverlay()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?,
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showWebError()
                }
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: WebResourceResponse?,
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                val statusCode = errorResponse?.statusCode ?: return
                if (request?.isForMainFrame == true && statusCode >= 500) {
                    showWebError()
                }
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
        binding.webViewFitAi.loadUrl(buildInitialUrl())
    }

    private fun showWebError() {
        binding.webLoading.visibility = View.GONE
        binding.launchOverlay.visibility = View.GONE
        binding.webErrorPanel.visibility = View.VISIBLE
    }

    private fun hideLaunchOverlay() {
        if (binding.launchOverlay.visibility != View.VISIBLE) return
        binding.launchOverlay.animate()
            .alpha(0f)
            .setDuration(180L)
            .withEndAction {
                binding.launchOverlay.visibility = View.GONE
                binding.launchOverlay.alpha = 1f
            }
            .start()
    }

    private fun buildInitialUrl(): String {
        val path = intent.getStringExtra(EXTRA_INITIAL_PATH)?.trim().orEmpty()
        if (path.isBlank()) return fitAiUrl
        val safePath = if (path.startsWith("/")) path else "/$path"
        return fitAiUrl + safePath
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
            if (rawUrl.contains("spotify", ignoreCase = true)) {
                if (!openExternalSafely(Intent(Intent.ACTION_VIEW, Uri.parse(spotifyFallbackUrl)))) {
                    Toast.makeText(this, "Spotify indisponible sur cet appareil.", Toast.LENGTH_SHORT).show()
                }
            } else {
                if (!openExternalSafely(Intent(Intent.ACTION_VIEW, Uri.parse(samsungFallbackUrl)))) {
                    Toast.makeText(this, "Application externe indisponible sur cet appareil.", Toast.LENGTH_SHORT).show()
                }
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
