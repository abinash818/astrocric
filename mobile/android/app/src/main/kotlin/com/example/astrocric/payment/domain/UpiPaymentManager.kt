package com.example.astrocric.payment.domain

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import com.example.astrocric.payment.data.UpiApp

class UpiPaymentManager(private val context: Context) {

    /**
     * Returns a list of apps that can handle the "upi://pay" intent.
     */
    fun getInstalledUpiApps(): List<UpiApp> {
        val uri = Uri.parse("upi://pay")
        val intent = Intent(Intent.ACTION_VIEW, uri)
        
        // Android 11+ visibility requires <queries> in AndroidManifest.xml
        val resolveInfoList = context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
        
        return resolveInfoList.mapNotNull { resolveInfo ->
            try {
                val pm = context.packageManager
                val packageName = resolveInfo.activityInfo.packageName
                val name = resolveInfo.loadLabel(pm).toString()
                val icon = resolveInfo.loadIcon(pm)
                
                UpiApp(packageName, name, icon)
            } catch (e: Exception) {
                null
            }
        }.distinctBy { it.packageName }
    }

    /**
     * Creates an Intent to launch a specific UPI app with the payment details.
     */
    fun createPaymentIntent(appPackage: String, upiUriString: String): Intent {
        val intent = Intent(Intent.ACTION_VIEW)
        intent.data = Uri.parse(upiUriString)
        intent.setPackage(appPackage)
        return intent
    }
}
