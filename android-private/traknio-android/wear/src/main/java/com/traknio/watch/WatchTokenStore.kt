package com.traknio.watch

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class WatchTokenStore(context: Context) {
    private val preferences = context.applicationContext.getSharedPreferences("traknio_watch_token", Context.MODE_PRIVATE)

    fun deviceToken(): String? = decrypt(preferences.getString(KEY_DEVICE_TOKEN, null))

    fun accountPairingId(): String? = preferences.getString(KEY_ACCOUNT_PAIRING_ID, null)

    fun save(deviceToken: String, accountPairingId: String) {
        preferences.edit()
            .putString(KEY_DEVICE_TOKEN, encrypt(deviceToken))
            .putString(KEY_ACCOUNT_PAIRING_ID, accountPairingId)
            .apply()
        Log.i(TAG, "device token saved accountPairingIdPresent=${accountPairingId.isNotBlank()}")
    }

    fun clear() {
        preferences.edit().clear().apply()
        Log.i(TAG, "device token cleared")
    }

    fun clearIfAccountChanged(accountPairingId: String) {
        val current = accountPairingId()
        if (!current.isNullOrBlank() && current != accountPairingId) {
            Log.i(TAG, "account changed; clearing watch token")
            clear()
        }
    }

    private fun encrypt(value: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey())
        val iv = cipher.iv
        val encrypted = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
        return "${iv.encodeBase64()}:${encrypted.encodeBase64()}"
    }

    private fun decrypt(value: String?): String? {
        if (value.isNullOrBlank()) return null
        return runCatching {
            val parts = value.split(":")
            if (parts.size != 2) return null
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), GCMParameterSpec(128, parts[0].decodeBase64()))
            String(cipher.doFinal(parts[1].decodeBase64()), Charsets.UTF_8)
        }.getOrElse {
            clear()
            null
        }
    }

    private fun getSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry)?.secretKey?.let { return it }

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build(),
        )
        return generator.generateKey()
    }

    private fun ByteArray.encodeBase64(): String = Base64.encodeToString(this, Base64.NO_WRAP)

    private fun String.decodeBase64(): ByteArray = Base64.decode(this, Base64.NO_WRAP)

    companion object {
        private const val KEY_ALIAS = "traknio_watch_device_token"
        private const val KEY_DEVICE_TOKEN = "device_token"
        private const val KEY_ACCOUNT_PAIRING_ID = "account_pairing_id"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val TAG = "WATCH_PAIR"
    }
}
