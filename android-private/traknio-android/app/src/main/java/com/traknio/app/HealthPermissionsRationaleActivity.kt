package com.traknio.app

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class HealthPermissionsRationaleActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        supportActionBar?.title = "Health Connect"
        setContentView(
            TextView(this).apply {
                text = "Traknio lit uniquement les donnees que vous autorisez dans Health Connect afin de synchroniser vos statistiques d'entrainement."
                textSize = 18f
                setPadding(48, 48, 48, 48)
            },
        )
    }
}
