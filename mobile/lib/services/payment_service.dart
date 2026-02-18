import 'dart:convert';
import 'package:phonepe_payment_sdk/phonepe_payment_sdk.dart';
import 'package:astrocric/config/constants.dart';
import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();

  // Initialize PhonePe SDK
  Future<bool> initPhonePeSdk() async {
    String environment = 'SANDBOX'; 
    if (AppConstants.phonePeMerchantId != 'PGTESTPAYUAT') {
        environment = 'PRODUCTION';
    }
    
    try {
      bool result = await PhonePePaymentSdk.init(
        environment, 
        AppConstants.phonePeMerchantId, 
        'FLOW_${DateTime.now().millisecondsSinceEpoch}', 
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
      // 1. Get SDK Token and details from Backend
      final tokenResponse = await _apiService.post(
        '/payment/sdk-token',
        {
            'amount': amount,
            if (predictionId != null) 'predictionId': predictionId
        },
      );
      
      print('SDK Token Response: $tokenResponse');
      
      String requestBody = jsonEncode(tokenResponse['payload']);
      String checksum = tokenResponse['checksum'] ?? '';

      if (requestBody.isEmpty || checksum.isEmpty) {
        throw Exception('Invalid response from server: Missing required payment data');
      }

      // 3. Start Transaction
      // Params: JSON string body (NOT base64), checksum
      Map<dynamic, dynamic>? response = await PhonePePaymentSdk.startTransaction(
          requestBody, 
          checksum
      );

      if (response != null && response['status'] == 'SUCCESS') {
          return {'success': true, 'message': 'Payment Successful'};
      } else {
          return {'success': false, 'message': response?['error'] ?? 'Payment Failed'};
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
