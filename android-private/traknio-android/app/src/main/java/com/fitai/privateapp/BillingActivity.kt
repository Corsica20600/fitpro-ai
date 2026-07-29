package com.fitai.privateapp

import android.os.Bundle
import android.webkit.CookieManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class BillingActivity : AppCompatActivity() {
    private val baseUrl = BuildConfig.FITAI_SYNC_BASE_URL.trimEnd('/')
    private val productId = BuildConfig.GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID
    private val packageNameForPlay = BuildConfig.GOOGLE_PLAY_PACKAGE_NAME
    private lateinit var billingClient: BillingClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Toast.makeText(this, "Préparation de l'abonnement...", Toast.LENGTH_SHORT).show()

        billingClient = BillingClient.newBuilder(this)
            .setListener { billingResult, purchases ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
                    purchases.forEach { purchase -> processPurchase(purchase) }
                } else if (billingResult.responseCode != BillingClient.BillingResponseCode.USER_CANCELED) {
                    showAndFinish("Erreur achat: ${billingResult.debugMessage}")
                } else {
                    finish()
                }
            }
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build()

        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryExistingPurchases()
                    queryProductAndLaunch()
                } else {
                    showAndFinish("Google Play indisponible: ${billingResult.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() = Unit
        })
    }

    private fun queryExistingPurchases() {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        billingClient.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                purchases.filter { it.products.contains(productId) }.forEach { processPurchase(it) }
            }
        }
    }

    private fun queryProductAndLaunch() {
        val product = QueryProductDetailsParams.Product.newBuilder()
            .setProductId(productId)
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(listOf(product))
            .build()

        billingClient.queryProductDetailsAsync(params) { billingResult, result ->
            if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
                showAndFinish("Produit indisponible: ${billingResult.debugMessage}")
                return@queryProductDetailsAsync
            }

            val productDetails = result.productDetailsList.firstOrNull()
            if (productDetails == null) {
                showAndFinish("Abonnement $productId introuvable dans Google Play")
                return@queryProductDetailsAsync
            }

            launchBillingFlow(productDetails)
        }
    }

    private fun launchBillingFlow(productDetails: ProductDetails) {
        val offerToken = productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken
        if (offerToken.isNullOrBlank()) {
            showAndFinish("Offre Google Play indisponible")
            return
        }

        val productParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(productDetails)
            .setOfferToken(offerToken)
            .build()

        val flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productParams))
            .build()

        val result = billingClient.launchBillingFlow(this, flowParams)
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
            showAndFinish("Impossible d'ouvrir Google Play: ${result.debugMessage}")
        }
    }

    private fun processPurchase(purchase: Purchase) {
        if (!purchase.products.contains(productId)) return

        lifecycleScope.launch {
            val cookieHeader = CookieManager.getInstance().getCookie(baseUrl)
            val verifyResult = withContext(Dispatchers.IO) {
                GooglePlayBillingApi.verifyPurchase(
                    baseUrl = baseUrl,
                    cookieHeader = cookieHeader,
                    packageName = packageNameForPlay,
                    productId = productId,
                    purchaseToken = purchase.purchaseToken,
                )
            }

            if (!verifyResult.ok) {
                showAndFinish("Validation serveur impossible: ${verifyResult.message}")
                return@launch
            }

            if (!purchase.isAcknowledged) {
                acknowledgePurchase(purchase)
            } else {
                showAndFinish(if (verifyResult.active) "Premium activé" else "Abonnement synchronisé")
            }
        }
    }

    private fun acknowledgePurchase(purchase: Purchase) {
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()

        billingClient.acknowledgePurchase(params) { billingResult ->
            showAndFinish(
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    "Premium activé"
                } else {
                    "Abonnement validé, accusé Google en attente"
                },
            )
        }
    }

    private fun showAndFinish(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        finish()
    }

    override fun onDestroy() {
        if (::billingClient.isInitialized) {
            billingClient.endConnection()
        }
        super.onDestroy()
    }
}
