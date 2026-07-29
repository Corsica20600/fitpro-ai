package com.fitai.privateapp

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object GooglePlayBillingApi {
    data class VerifyResult(val ok: Boolean, val active: Boolean = false, val message: String)

    fun verifyPurchase(
        baseUrl: String,
        cookieHeader: String?,
        packageName: String,
        productId: String,
        purchaseToken: String,
    ): VerifyResult {
        if (cookieHeader.isNullOrBlank()) return VerifyResult(false, message = "Connexion Google requise")
        if (purchaseToken.isBlank()) return VerifyResult(false, message = "Purchase token manquant")

        val endpoint = baseUrl.trimEnd('/') + "/api/billing/google-play/verify"
        val payload = JSONObject().apply {
            put("packageName", packageName)
            put("productId", productId)
            put("purchaseToken", purchaseToken)
        }

        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 15000
            doOutput = true
            setRequestProperty("content-type", "application/json")
            setRequestProperty("cookie", cookieHeader)
        }

        return try {
            connection.outputStream.use { out ->
                out.write(payload.toString().toByteArray(Charsets.UTF_8))
            }
            val code = connection.responseCode
            val body = runCatching {
                (if (code in 200..299) connection.inputStream else connection.errorStream)
                    ?.bufferedReader()
                    ?.readText()
                    .orEmpty()
            }.getOrDefault("")

            if (code in 200..299) {
                val json = JSONObject(body)
                VerifyResult(
                    ok = json.optBoolean("ok", false),
                    active = json.optBoolean("active", false),
                    message = "Abonnement synchronisé",
                )
            } else {
                VerifyResult(false, message = "HTTP $code $body")
            }
        } catch (e: Exception) {
            VerifyResult(false, message = e.message ?: "Erreur reseau")
        } finally {
            connection.disconnect()
        }
    }
}
