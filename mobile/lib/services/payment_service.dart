import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();

  // Create SDK Token (from Backend) - used for both SDK and Web Flow
  Future<Map<String, dynamic>> getSdkToken(double amount, {int? predictionId, bool restrictToUpi = false, bool nativeUpi = false}) async {
    return await _apiService.post(
      '/payment/sdk-token',
      {
        'amount': amount,
        if (predictionId != null) 'predictionId': predictionId,
        'restrictToUpi': restrictToUpi,
        'nativeUpi': nativeUpi
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

  // Launch Generic UPI Intent (Let Android OS choose app)
  Future<bool> launchGenericUpi(double amount, String merchantTransactionId) async {
    try {
      // Construct standard UPI URI
      // Note: In production you should get the VPA (pa) and Name (pn) from backend config too
      final uri = Uri.parse(
        'upi://pay?pa=merchant@ybl&pn=Astrocric&am=$amount&tr=$merchantTransactionId&tn=Recharge Wallet&cu=INR'
      );
      
      print('Launching Generic UPI URI: $uri');
      
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return true;
      } else {
        print('No UPI app found to handle URI');
        // Fallback handled by UI
        return false;
      }
    } catch (e) {
      print('Generic UPI Launch Error: $e');
      return false;
    }
  }

  static const MethodChannel _channel = MethodChannel('com.example.astrocric/upi');

  // Launch Native Android UPI Module (Using Backend Intent)
  Future<Map<String, dynamic>> startNativeUpiTransaction({
    required double amount, 
    String note = "Recharge Wallet"
  }) async {
    try {
      // 1. Get UPI Intent from Backend
      print("Fetching UPI Intent for amount: $amount");
      final response = await getSdkToken(amount, restrictToUpi: true, nativeUpi: true);
      
      if (response['intentUrl'] == null) {
          throw Exception("Failed to get UPI Intent URL");
      }

      final String intentUrl = response['intentUrl'];
      final String merchantTransactionId = response['merchantTransactionId'];
      
      print('Invoking Native UPI Activity with URI: $intentUrl');
      
      // 2. Launch Native Module
      final result = await _channel.invokeMethod('launchPayment', {
        'upiLink': intentUrl,
      });
      
      if (result != null) {
        // Merge our transaction ID into result for easier UI handling
        final map = Map<String, dynamic>.from(result);
        map['merchantTransactionId'] = merchantTransactionId;
        return map;
      } else {
        return {'status': 'failure', 'message': 'Null response from native module'};
      }
    } on PlatformException catch (e) {
      print("Native UPI PlatformException: ${e.message}");
      return {'status': 'failure', 'message': e.message};
    } catch (e) {
      print("Native UPI Error: $e");
      return {'status': 'failure', 'message': e.toString()};
    }
  }

  // Verify Payment Status (Backend)
  Future<Map<String, dynamic>> verifyPayment(String merchantTransactionId) async {
    try {
      final response = await _apiService.get('/payment/status/$merchantTransactionId');
      return Map<String, dynamic>.from(response);
    } catch (e) {
      print('Verify Payment Error: $e');
      return {'success': false, 'message': e.toString()};
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
    return response['payments'] ?? [];
  }
}
