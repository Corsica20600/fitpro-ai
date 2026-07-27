plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.fitai.wear"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.fitai.prowear"
        minSdk = 30
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"

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

        val syncBaseUrl = (project.findProperty("FITAI_SYNC_BASE_URL") as String?)
            ?: System.getenv("FITAI_SYNC_BASE_URL")
            ?: readRootEnv("FITAI_SYNC_BASE_URL")
            ?: "https://fitai-pro-zeta.vercel.app"
        val watchToken = (project.findProperty("FITAI_WATCH_TOKEN") as String?)
            ?: System.getenv("FITAI_WATCH_TOKEN")
            ?: readRootEnv("FITAI_WATCH_TOKEN")
            ?: ""
        buildConfigField("String", "FITAI_SYNC_BASE_URL", "\"$syncBaseUrl\"")
        buildConfigField("String", "FITAI_WATCH_TOKEN", "\"$watchToken\"")
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
