package com.example.astrocric.payment.data

/**
 * Sealed class representing the result of a UPI payment attempt.
 */
sealed class PaymentResult {
    data class Success(
        val txnId: String?,
        val responseCode: String?,
        val approvalRefNo: String?,
        val status: String,
        val txnRef: String?
    ) : PaymentResult()

    data class Failure(
        val message: String,
        val responseCode: String?
    ) : PaymentResult()

    object Cancelled : PaymentResult()
    
    data class Submitted(
        val message: String
    ) : PaymentResult()
}
