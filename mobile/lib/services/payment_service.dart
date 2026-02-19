import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:phonepe_payment_sdk/phonepe_payment_sdk.dart';
import 'package:astrocric/config/constants.dart';
import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();

  // Initialize PhonePe SDK
  Future<bool> initPhonePeSdk() async {
    // PhonePe SDK does not support Web
    if (kIsWeb) {
        print('PhonePe SDK is not supported on Web');
        return false;
    }

    String environment = 'SANDBOX'; 
    if (AppConstants.phonePeMerchantId != 'PGTESTPAYUAT') {
        environment = 'PRODUCTION'; 
    }
    
    try {
      print('Initializing PhonePe SDK in $environment mode for Merchant: ${AppConstants.phonePeMerchantId}');
      bool result = await PhonePePaymentSdk.init(
        environment, 
        AppConstants.phonePeMerchantId, 
        'astrocric_user', // Use a descriptive flowId (non-empty)
        true
      );
      print('PhonePe SDK Initialized Result: $result');
      if (!result) {
          print('Warning: PhonePe SDK init returned false. This often happens if the Merchant ID is not whitelisted for the chosen environment or the Package Name mismatches.');
      }
      return result;
    } catch (e, stack) {
      print('PhonePe Init Exception: $e');
      print('Stacktrace: $stack');
      return false;
    }
  }

  // Start Transaction
  Future<Map<String, dynamic>> startPhonePeTransaction(double amount, {int? predictionId}) async {
    try {
      print('Calling Backend /payment/sdk-token with amount: $amount');
      final tokenResponse = await _apiService.post(
        '/payment/sdk-token',
        {
            'amount': amount,
            if (predictionId != null) 'predictionId': predictionId
        },
      );
      
      print('SDK Token Response Received: $tokenResponse');
      
      String orderId = tokenResponse['orderId'] ?? '';
      String token = tokenResponse['token'] ?? '';
      String mTxnId = tokenResponse['merchantTransactionId'] ?? '';

      if (orderId.isEmpty || token.isEmpty) {
        throw Exception('Invalid response from server: Missing required payment tokens');
      }

      // 3. Start Transaction
      print('Starting PhonePe Transaction SDK UI (Unified SDK Flow)...');
      
      // For PhonePe Unified SDK (Hermes):
      // The 'request' parameter must be a JSON string containing 'orderId' and 'token'.
      String requestJson = jsonEncode({
        "orderId": orderId,
        "token": token,
      });

      Map<dynamic, dynamic>? response = await PhonePePaymentSdk.startTransaction(
          requestJson, 
          'astrocric' // appSchema
      );
      print('PhonePe SDK Transaction Response: $response');

      if (response != null && response['status'] == 'SUCCESS') {
          return {'success': true, 'message': 'Payment Successful'};
      } else {
          String errorMsg = response?['error'] ?? 'Payment Failed';
          // Handle specific case where response is cancelled or null
          if (response == null) errorMsg = 'Payment Cancelled or SDK Error';
          return {'success': false, 'message': errorMsg};
      }
      
    } catch (e) {
      print('PhonePe Transaction Error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> createOrder(int predictionId) async {
    final response = await _apiService.post(
      '/payment/create-order',
      {'predictionId': predictionId},
    );
    return response;
  }
  
  // Legacy or standard verification if needed
  Future<List<Map<String, dynamic>>> getPaymentHistory() async {
    final response = await _apiService.get('/payment/history');
    return List<Map<String, dynamic>>.from(response['payments']);
  }
}
