plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.traknio.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.traknio.app"
        minSdk = 29
        targetSdk = 34
        versionCode = 7
        versionName = "0.5.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        fun readLocalProperty(name: String): String? {
            val localProperties = rootProject.file("local.properties")
            if (!localProperties.exists()) return null

            return localProperties.readLines()
                .asSequence()
                .map { it.trim() }
                .filter { it.isNotBlank() && !it.startsWith("#") }
                .firstOrNull { it.startsWith("$name=") }
                ?.substringAfter("=")
                ?.trim()
                ?.trim('"', '\'')
                ?.takeIf { it.isNotBlank() }
        }

        fun propertyValue(name: String): String? {
            return (project.findProperty(name) as String?)?.trim()?.takeIf { it.isNotBlank() }
                ?: System.getenv(name)?.trim()?.takeIf { it.isNotBlank() }
                ?: readLocalProperty(name)
        }

        val syncBaseUrl = propertyValue("TRAKNIO_SYNC_BASE_URL")
            ?: "https://www.traknio.com"
        val googlePlayProductId = propertyValue("GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID")
            ?: "traknio_premium"
        val googlePlayPackageName = propertyValue("GOOGLE_PLAY_PACKAGE_NAME")
            ?: "com.traknio.app"
        fun buildConfigString(value: String) = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""
        buildConfigField("String", "TRAKNIO_SYNC_BASE_URL", buildConfigString(syncBaseUrl))
        buildConfigField("String", "GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID", buildConfigString(googlePlayProductId))
        buildConfigField("String", "GOOGLE_PLAY_PACKAGE_NAME", buildConfigString(googlePlayPackageName))
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        buildConfig = true
        viewBinding = true
    }
}

dependencies {
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.aar"))))
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("androidx.health.connect:connect-client:1.1.0-alpha08")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("com.android.billingclient:billing:9.1.0")
}
