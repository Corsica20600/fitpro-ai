package com.traknio.watch

import android.content.Context
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

class WearPairingClient(private val context: Context) {
    suspend fun requestTemporaryPairingToken(label: String): TemporaryPairingToken {
        val response = requestPhoneJson(
            requestPath = WearPairingPaths.PAIRING_REQUEST,
            responsePath = WearPairingPaths.PAIRING_RESPONSE,
            request = JSONObject().put("label", label),
            timeoutMs = 12_000,
        )

        if (!response.optBoolean("ok", false)) {
            throw IllegalStateException(response.optString("error", "Appairage impossible"))
        }

        return TemporaryPairingToken(
            token = response.getString("pairingToken"),
            accountPairingId = response.getString("accountPairingId"),
        )
    }

    suspend fun requestCurrentAccountPairingId(): String? {
        val response = requestPhoneJson(
            requestPath = WearPairingPaths.ACCOUNT_STATE_REQUEST,
            responsePath = WearPairingPaths.ACCOUNT_STATE,
            request = JSONObject(),
            timeoutMs = 5_000,
        )

        if (!response.optBoolean("ok", false)) return null
        return response.optString("accountPairingId").takeIf { it.isNotBlank() }
    }

    private suspend fun requestPhoneJson(
        requestPath: String,
        responsePath: String,
        request: JSONObject,
        timeoutMs: Long,
    ): JSONObject {
        val appContext = context.applicationContext
        val messageClient = Wearable.getMessageClient(appContext)
        val deferred = CompletableDeferred<JSONObject>()

        val listener = MessageClient.OnMessageReceivedListener { event: MessageEvent ->
            if (event.path != responsePath || deferred.isCompleted) return@OnMessageReceivedListener
            val json = runCatching { JSONObject(String(event.data)) }.getOrElse {
                deferred.completeExceptionally(it)
                return@OnMessageReceivedListener
            }
            deferred.complete(json)
        }

        try {
            messageClient.addListener(listener).await()
            val nodes = Wearable.getNodeClient(appContext).connectedNodes.await()
            if (nodes.isEmpty()) {
                throw IllegalStateException("Téléphone introuvable")
            }

            val requestBytes = request.toString().toByteArray()
            for (node in nodes) {
                messageClient.sendMessage(node.id, requestPath, requestBytes).await()
            }
            return withTimeout(timeoutMs) { deferred.await() }
        } finally {
            messageClient.removeListener(listener)
        }
    }
}

data class TemporaryPairingToken(
    val token: String,
    val accountPairingId: String,
)
