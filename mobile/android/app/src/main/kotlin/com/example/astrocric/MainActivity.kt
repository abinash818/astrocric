package com.example.astrocric

import android.app.Activity
import android.content.Intent
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.example.astrocric.payment.ui.UpiPaymentActivity

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.astrocric/upi"
    private val UPI_REQUEST_CODE = 1001
    private var pendingResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "launchPayment") {
                val upiLink = call.argument<String>("upiLink")
                if (upiLink != null) {
                    pendingResult = result
                    val intent = Intent(this, UpiPaymentActivity::class.java)
                    intent.putExtra("upiLink", upiLink)
                    startActivityForResult(intent, UPI_REQUEST_CODE)
                } else {
                    result.error("INVALID_ARGUMENT", "UPI Link is missing", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == UPI_REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val status = data.getStringExtra("status")
                val responseMap = HashMap<String, String?>()
                responseMap["status"] = status
                
                if (status == "success") {
                    responseMap["txnId"] = data.getStringExtra("txnId")
                    responseMap["approvalRefNo"] = data.getStringExtra("approvalRefNo")
                    responseMap["responseCode"] = data.getStringExtra("responseCode")
                } else if (status == "failure") {
                    responseMap["message"] = data.getStringExtra("message")
                } else if (status == "submitted") {
                     responseMap["message"] = "Payment Submitted"
                } else if (status == "cancelled") {
                     // Handled below but safe to have default
                }
                
                pendingResult?.success(responseMap)
            } else {
                 // Cancelled or back pressed
                val responseMap = HashMap<String, String?>()
                responseMap["status"] = "cancelled"
                pendingResult?.success(responseMap)
            }
            pendingResult = null
        }
    }
}
