package com.example.astrocric.payment.domain

import com.example.astrocric.payment.data.PaymentResult
import java.util.Locale

object PaymentResultParser {

    fun parse(resultString: String?): PaymentResult {
        if (resultString.isNullOrBlank()) {
            return PaymentResult.Cancelled
        }

        // Parse key-value pairs from query string (e.g., txnId=...&responseCode=...)
        val params = try {
            resultString.split("&").associate {
                val parts = it.split("=")
                if (parts.size == 2) {
                    parts[0].trim().lowercase(Locale.ROOT) to parts[1].trim()
                } else {
                    "" to "" // Skip malformed params
                }
            }
        } catch (e: Exception) {
            return PaymentResult.Failure("Failed to parse response: ${e.message}", null)
        }

        val status = params["status"]?.lowercase(Locale.ROOT) ?: ""
        val responseCode = params["responsecode"]
        val txnRef = params["txnref"]
        val txnId = params["txnid"]
        val approvalRefNo = params["approvalrefno"]

        // Handling varied status strings
        return when {
            status == "success" -> {
                PaymentResult.Success(
                    txnId = txnId,
                    responseCode = responseCode,
                    approvalRefNo = approvalRefNo,
                    status = status,
                    txnRef = txnRef
                )
            }
            status == "submitted" -> {
                 PaymentResult.Submitted("Payment Submitted")
            }
            status == "failed" -> {
                PaymentResult.Failure(
                    message = "Payment Failed",
                    responseCode = responseCode
                )
            }
            // "ZM" is often a failure code in responseCode even if Status is missing
            responseCode == "ZM" -> {
                PaymentResult.Failure("Payment Failed (ZM)", responseCode)
            }
             else -> {
                 // Ambiguous case, often treated as user cancelled or failed
                 if (status.isEmpty() && responseCode == null) {
                     PaymentResult.Cancelled
                 } else {
                     PaymentResult.Failure(
                         message = "Unknown Status: $status",
                         responseCode = responseCode
                     )
                 }
             }
        }
    }
}
