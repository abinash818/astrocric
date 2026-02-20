package com.example.astrocric.payment.data

import android.graphics.drawable.Drawable

/**
 * Represents an installed UPI app on the device.
 */
data class UpiApp(
    val packageName: String,
    val name: String,
    val icon: Drawable? = null,
    val iconBase64: String? = null // Optional: if needed to send to Flutter later
)
