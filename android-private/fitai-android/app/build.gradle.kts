plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.fitai.privateapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.fitai.privateapp"
        minSdk = 29
        targetSdk = 34
        versionCode = 3
        versionName = "0.3.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        val syncBaseUrl = (project.findProperty("FITAI_SYNC_BASE_URL") as String?) ?: "https://fitai-pro-zeta.vercel.app"
        val syncToken = (project.findProperty("FITAI_SYNC_TOKEN") as String?) ?: ""
        buildConfigField("String", "FITAI_SYNC_BASE_URL", "\"$syncBaseUrl\"")
        buildConfigField("String", "FITAI_SYNC_TOKEN", "\"$syncToken\"")
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
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
