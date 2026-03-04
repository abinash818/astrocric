import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api_service.dart';
import 'dart:js' as js;

class PaymentService {
  final ApiService _apiService = ApiService();

  // Create SDK Token (from Backend) - used for both SDK and Web Flow
  Future<Map<String, dynamic>> getSdkToken(double amount, {int? analysisId, bool restrictToUpi = false, bool nativeUpi = false}) async {
    final response = await _apiService.post(
      '/payment/sdk-token',
      {
        'amount': amount,
        if (analysisId != null) 'analysisId': analysisId,
        'restrictToUpi': restrictToUpi,
        'nativeUpi': nativeUpi
      },
    );
    return response.data;
  }

  // Start PhonePe Web Checkout
  Future<Map<String, dynamic>> startPhonePeTransaction(double amount, {int? analysisId, bool restrictToUpi = false}) async {
    try {
      print('Requesting Web Checkout URL from backend for amount: $amount upiOnly: $restrictToUpi');
      final tokenResponse = await getSdkToken(amount, analysisId: analysisId, restrictToUpi: restrictToUpi);
      
      String redirectUrl = tokenResponse['redirectUrl'] ?? '';
      String mTxnId = tokenResponse['merchantTransactionId'] ?? '';

      if (redirectUrl.isEmpty) {
        throw Exception('Invalid response from server: Missing redirect URL');
      }

      print('Launching PhonePe In-App WebView: $redirectUrl');
      final Uri url = Uri.parse(redirectUrl);
      
      if (!await launchUrl(
        url,
        mode: LaunchMode.inAppWebView,
        webViewConfiguration: const WebViewConfiguration(
          enableJavaScript: true,
          enableDomStorage: true,
        ),
      )) {
        throw Exception('Could not launch payment URL: $redirectUrl');
      }

      print('Payment launched. Transaction ID: $mTxnId');
      return {'success': true, 'message': 'Payment initiated', 'merchantTransactionId': mTxnId};

    } catch (e) {
      print('Payment Web Checkout Error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  // Launch Generic UPI Intent - not applicable on web
  Future<bool> launchGenericUpi(double amount, String merchantTransactionId) async {
    return false;
  }

  static const MethodChannel _channel = MethodChannel('com.astrocric/upi');

  // Native UPI - not applicable on web
  Future<Map<String, dynamic>> startNativeUpiTransaction({
    required double amount, 
    String note = "Recharge Wallet"
  }) async {
    return {'status': 'failure', 'message': 'Native UPI not supported on web'};
  }

  // Verify Payment Status (Backend)
  Future<Map<String, dynamic>> verifyPayment(String merchantTransactionId) async {
    try {
      final response = await _apiService.get('/payment/status/$merchantTransactionId');
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      print('Verify Payment Error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> createOrder(int analysisId) async {
    final response = await _apiService.post(
      '/payment/create-order',
      {'analysisId': analysisId},
    );
    return response.data;
  }
  
  Future<List<dynamic>> getPaymentHistory() async {
    final response = await _apiService.get('/payment/history');
    return response.data['payments'] ?? [];
  }

  // Unlock analysis using wallet coins
  Future<Map<String, dynamic>> unlockAnalysisWithWallet(int matchId) async {
    try {
      final response = await _apiService.post(
        '/payment/unlock-analysis',
        {'matchId': matchId},
      );
      return response.data;
    } catch (e) {
      print('Wallet Unlock Error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // PhonePe Web Iframe Support (Web only)
  Future<void> startPhonePeWebIframeTransaction({
    required String redirectUrl,
    required Function(String) onResult,
  }) async {
    try {
      if (js.context.hasProperty('checkout')) {
         js.context.callMethod('checkout', [
           redirectUrl, 
           'IFRAME', 
           js.allowInterop((response) {
             onResult(response as String);
           })
         ]);
      } else {
        await launchUrl(Uri.parse(redirectUrl), mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      print('Web Iframe Launch Error: $e');
    }
  }
}
