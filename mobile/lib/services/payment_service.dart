import 'dart:convert';
import 'package:phonepe_payment_sdk/phonepe_payment_sdk.dart';
import 'package:astrocric/config/constants.dart';
import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();

  // Initialize PhonePe SDK
  Future<bool> initPhonePeSdk() async {
    // PhonePe SDK does not support Web
    if (identical(0, 0.0)) { // Simple way to check for web if kIsWeb is not imported
        print('PhonePe SDK is not supported on Web');
        return false;
    }

    String environment = 'SANDBOX'; 
    if (AppConstants.phonePeMerchantId != 'PGTESTPAYUAT') {
        environment = 'PRODUCTION'; 
    }
    
    try {
      bool result = await PhonePePaymentSdk.init(
        environment, 
        AppConstants.phonePeMerchantId, 
        'astrocric', 
        true
      );
      print('PhonePe Init Result: $result');
      return result;
    } catch (e) {
      print('PhonePe Init Error: $e');
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
      
      String base64Body = tokenResponse['base64Body'] ?? '';
      String checksum = tokenResponse['checksum'] ?? '';
      String mTxnId = tokenResponse['merchantTransactionId'] ?? '';

      if (base64Body.isEmpty || checksum.isEmpty) {
        throw Exception('Invalid response from server: Missing required payment data');
      }

      // 3. Start Transaction
      print('Starting PhonePe Transaction SDK UI with JSON-wrapped Base64Body and Checksum...');
      
      // Standard Checkout V4/Hermes SDK expects the payload to be a JSON string
      // For Direct Integration, we often need to provide orderId and merchantId explicitly at the top level
      String requestString = jsonEncode({
        "request": base64Body,
        "apiEndPoint": "/pg/v1/pay",
        "merchantId": AppConstants.phonePeMerchantId,
        "orderId": mTxnId
      });

      Map<dynamic, dynamic>? response = await PhonePePaymentSdk.startTransaction(
          requestString, 
          checksum
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
