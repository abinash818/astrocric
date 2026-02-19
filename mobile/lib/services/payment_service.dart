import 'package:url_launcher/url_launcher.dart';
import 'package:upi_pay/upi_pay.dart';
import 'package:upi_pay/types/meta.dart';
import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();
  final UpiPay _upiPay = UpiPay();

  // Get installed UPI apps
  Future<List<ApplicationMeta>> getInstalledUpiApps() async {
    try {
      return await _upiPay.getInstalledUpiApplications();
    } catch (e) {
      print('Error getting UPI apps: $e');
      return [];
    }
  }

  // Create SDK Token (from Backend) - used for both SDK and Web Flow
  Future<Map<String, dynamic>> getSdkToken(double amount, {int? predictionId, bool restrictToUpi = false}) async {
    return await _apiService.post(
      '/payment/sdk-token',
      {
        'amount': amount,
        if (predictionId != null) 'predictionId': predictionId,
        'restrictToUpi': restrictToUpi,
      },
    );
  }

  // Start PhonePe Web Checkout
  Future<Map<String, dynamic>> startPhonePeTransaction(double amount, {int? predictionId, bool restrictToUpi = false}) async {
    try {
      // 1. Get Redirect URL from backend
      print('Requesting Web Checkout URL from backend for amount: $amount upiOnly: $restrictToUpi');
      final tokenResponse = await getSdkToken(amount, predictionId: predictionId, restrictToUpi: restrictToUpi);
      
      String redirectUrl = tokenResponse['redirectUrl'] ?? '';
      String mTxnId = tokenResponse['merchantTransactionId'] ?? '';

      if (redirectUrl.isEmpty) {
        throw Exception('Invalid response from server: Missing redirect URL');
      }

      // 2. Launch URL in-app
      print('Launching PhonePe In-App WebView: $redirectUrl');
      final Uri url = Uri.parse(redirectUrl);
      
      if (!await launchUrl(
        url,
        mode: LaunchMode.inAppWebView, // Open inside the app
        webViewConfiguration: const WebViewConfiguration(
          enableJavaScript: true,
          enableDomStorage: true,
        ),
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

  // Start Payment with specific UPI App
  Future<UpiTransactionResponse?> startUpiTransaction({
    required ApplicationMeta app,
    required double amount,
    required String merchantTransactionId,
  }) async {
    try {
      return await _upiPay.initiateTransaction(
        amount: amount.toString(),
        app: app.upiApplication,
        receiverUpiAddress: "merchant@ybl", // This should come from backend config
        receiverName: 'Astrocric',
        transactionRef: merchantTransactionId,
        transactionNote: 'Recharge Wallet',
      );
    } catch (e) {
      print('UPI Transaction Error: $e');
      return null;
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
