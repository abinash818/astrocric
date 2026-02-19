import 'package:url_launcher/url_launcher.dart';
import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();

  // Create SDK Token (from Backend) - used for both SDK and Web Flow
  Future<Map<String, dynamic>> getSdkToken(double amount, {int? predictionId}) async {
    return await _apiService.post(
      '/payment/sdk-token',
      {
        'amount': amount,
        if (predictionId != null) 'predictionId': predictionId,
      },
    );
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

  // Verify Payment Status
  Future<bool> verifyPayment(String merchantTransactionId) async {
    try {
      final response = await _apiService.get('/payment/status/$merchantTransactionId');
      return response['success'] == true;
    } catch (e) {
      print('Verify Payment Error: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> createOrder(int predictionId) async {
    return await _apiService.post(
      '/payment/create-order',
      {'predictionId': predictionId},
    );
  }
  
  Future<List<dynamic>> getPaymentHistory() async {
    final response = await _apiService.get('/payment/history');
    return response['history'] ?? [];
  }
}
