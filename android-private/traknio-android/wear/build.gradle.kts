plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.traknio.watch"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.traknio.watch"
        minSdk = 30
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"

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

        fun readRootEnv(name: String): String? {
            val rootEnv = rootProject.projectDir.parentFile?.parentFile?.resolve(".env")
                ?: return null
            if (!rootEnv.exists()) return null

            return rootEnv.readLines()
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
                ?: readRootEnv(name)
        }

        fun buildConfigString(value: String) = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""

        val syncBaseUrl = propertyValue("TRAKNIO_SYNC_BASE_URL")
            ?: "https://www.traknio.com"
        val watchToken = propertyValue("TRAKNIO_WATCH_TOKEN")
            ?: ""
        val watchDeviceToken = propertyValue("TRAKNIO_WATCH_DEVICE_TOKEN")
            ?: ""
        buildConfigField("String", "TRAKNIO_SYNC_BASE_URL", buildConfigString(syncBaseUrl))
        buildConfigField("String", "TRAKNIO_WATCH_TOKEN", buildConfigString(watchToken))
        buildConfigField("String", "TRAKNIO_WATCH_DEVICE_TOKEN", buildConfigString(watchDeviceToken))
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
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
}

dependencies {
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
    implementation("androidx.wear.compose:compose-foundation:1.4.1")
    implementation("androidx.wear.compose:compose-material:1.4.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    debugImplementation("androidx.compose.ui:ui-tooling:1.6.8")
}
