import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_constants.dart';
import 'api_service.dart';
import 'auth_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();
  final AuthService _authService = AuthService();

  // Create SDK Token (from Backend)
  Future<Map<String, dynamic>> getSdkToken(double amount, {int? predictionId}) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('User not authenticated');

    final response = await http.post(
      Uri.parse('${AppConstants.apiBaseUrl}/payment/sdk-token'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'amount': amount,
        if (predictionId != null) 'predictionId': predictionId
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Failed to get payment token');
    }
  }

  // Start PhonePe Web Checkout
  Future<Map<String, dynamic>> startPhonePeTransaction(double amount, {int? predictionId}) async {
    try {
      // 1. Get Redirect URL from backend
      print('Requesting Web Checkout URL from backend for amount: $amount');
      final tokenResponse = await getSdkToken(amount, predictionId: predictionId);
      
      String redirectUrl = tokenResponse['redirectUrl'] ?? '';
      String mTxnId = tokenResponse['merchantTransactionId'] ?? '';

      if (redirectUrl.isEmpty) {
        throw Exception('Invalid response from server: Missing redirect URL');
      }

      // 2. Launch URL in browser
      print('Launching PhonePe Web Checkout: $redirectUrl');
      final Uri url = Uri.parse(redirectUrl);
      
      if (!await launchUrl(
        url,
        mode: LaunchMode.externalApplication, // Open in external browser
      )) {
        throw Exception('Could not launch payment URL: $redirectUrl');
      }

      // 3. User is in the browser. They will complete the payment and be redirected back.
      print('Payment launched. Transaction ID: $mTxnId');
      return {'success': true, 'message': 'Payment initiated', 'merchantTransactionId': mTxnId};

    } catch (e) {
      print('Payment Web Checkout Error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  // Verify Payment Status (Polling or manual check)
  Future<bool> verifyPayment(String merchantTransactionId) async {
    final token = await _authService.getToken();
    if (token == null) return false;

    final response = await http.get(
      Uri.parse('${AppConstants.apiBaseUrl}/payment/status/$merchantTransactionId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['success'] == true;
    }
    return false;
  }

  Future<Map<String, dynamic>> createOrder(int predictionId) async {
    final response = await _apiService.post(
      '/payment/create-order',
      {'predictionId': predictionId},
    );
    return response;
  }
  
  Future<List<dynamic>> getPaymentHistory() async {
    final response = await _apiService.get('/payment/history');
    return response['history'] ?? [];
  }
}
