import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/payment_service.dart';

class WalletPaymentScreen extends StatefulWidget {
  final double amount;

  const WalletPaymentScreen({
    Key? key,
    required this.amount,
  }) : super(key: key);

  @override
  State<WalletPaymentScreen> createState() => _WalletPaymentScreenState();
}

class _WalletPaymentScreenState extends State<WalletPaymentScreen> {
  final PaymentService _paymentService = PaymentService();
  late WebViewController _webViewController;
  bool _isLoading = true;
  String? _merchantTransactionId;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializePayment();
  }

  Future<void> _initializePayment() async {
    try {
      // Create wallet recharge order
      final orderData = await _paymentService.rechargeWallet(widget.amount);
      
      if (orderData['success'] == true) {
        setState(() {
          _merchantTransactionId = orderData['merchantTransactionId'];
        });

        // Initialize WebView
        _webViewController = WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setNavigationDelegate(
            NavigationDelegate(
              onPageStarted: (url) {
                print('Page started: $url');
              },
              onPageFinished: (url) {
                setState(() => _isLoading = false);
                
                // Check if payment completed
                if (url.contains('/payment/callback')) {
                  _verifyPayment();
                }
              },
              onNavigationRequest: (request) {
                print('Navigation request: ${request.url}');
                return NavigationDecision.navigate;
              },
            ),
          )
          ..loadRequest(Uri.parse(orderData['redirectUrl']));
      } else {
        setState(() {
          _error = 'Failed to initiate recharge';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyPayment() async {
    if (_merchantTransactionId == null) return;

    setState(() => _isLoading = true);

    try {
      final result = await _paymentService.verifyPayment(_merchantTransactionId!);
      
      if (result['success'] == true) {
        // Payment successful
        Navigator.pop(context, true); // Return success to previous screen
      } else {
        _showErrorDialog('Payment verification failed');
      }
    } catch (e) {
      _showErrorDialog('Error verifying payment: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recharge Payment'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          if (_error != null)
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(_error!),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Go Back'),
                  ),
                ],
              ),
            )
          else if (_merchantTransactionId != null)
            WebViewWidget(controller: _webViewController),
          
          if (_isLoading)
            Container(
              color: Colors.white,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Processing payment...'),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red, size: 32),
            SizedBox(width: 8),
            Text('Payment Failed'),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context, false); // Return to prediction screen
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
