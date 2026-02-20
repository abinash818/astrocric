package com.example.astrocric.payment.ui

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.example.astrocric.payment.data.PaymentResult
import com.example.astrocric.payment.domain.PaymentResultParser
import com.example.astrocric.payment.domain.UpiPaymentManager

class UpiPaymentActivity : ComponentActivity() {

    private lateinit var upiPaymentManager: UpiPaymentManager
    private lateinit var viewModel: PaymentViewModel

    private val upiPaymentLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val data = result.data?.getStringExtra("response") ?: ""
        val paymentResult = PaymentResultParser.parse(data)
        
        // Return result to Flutter Activity
        val resultIntent = Intent()
        when (paymentResult) {
            is PaymentResult.Success -> {
                resultIntent.putExtra("status", "success")
                resultIntent.putExtra("txnId", paymentResult.txnId)
                resultIntent.putExtra("approvalRefNo", paymentResult.approvalRefNo)
                resultIntent.putExtra("responseCode", paymentResult.responseCode)
            }
            is PaymentResult.Failure -> {
                resultIntent.putExtra("status", "failure")
                resultIntent.putExtra("message", paymentResult.message)
            }
            is PaymentResult.Cancelled -> {
                resultIntent.putExtra("status", "cancelled")
            }
            is PaymentResult.Submitted -> {
                 resultIntent.putExtra("status", "submitted")
            }
        }
        setResult(Activity.RESULT_OK, resultIntent)
        finish()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        upiPaymentManager = UpiPaymentManager(this)
        viewModel = PaymentViewModel(upiPaymentManager)

        // Get full UPI Intent URI from Flutter
        val upiLink = intent.getStringExtra("upiLink")

        setContent {
            val upiApps by viewModel.upiApps.collectAsState()
            
            UpiSelectionScreen(
                upiApps = upiApps,
                onAppSelected = { app ->
                     if (!upiLink.isNullOrBlank()) {
                         val paymentIntent = upiPaymentManager.createPaymentIntent(app.packageName, upiLink)
                         upiPaymentLauncher.launch(paymentIntent)
                     }
                },
                onCancel = {
                    setResult(Activity.RESULT_CANCELED)
                    finish()
                }
            )
        }
    }
}
