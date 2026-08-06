package com.traknio.watch

import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject

class WatchWearListenerService : WearableListenerService() {
    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path != WearPairingPaths.ACCOUNT_STATE) return

        val accountPairingId = runCatching {
            JSONObject(String(messageEvent.data)).optString("accountPairingId")
        }.getOrNull()?.takeIf { it.isNotBlank() } ?: return

        WatchTokenStore(applicationContext).clearIfAccountChanged(accountPairingId)
    }
}
