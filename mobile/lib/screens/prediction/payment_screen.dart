import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/payment_service.dart';

class PaymentScreen extends StatefulWidget {
  final int predictionId;
  final double amount;
  final String title;

  const PaymentScreen({
    Key? key,
    required this.predictionId,
    required this.amount,
    required this.title,
  }) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
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
      // Create payment order
      final orderData = await _paymentService.createOrder(widget.predictionId);
      
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
          _error = 'Failed to create payment order';
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
        _showSuccessDialog();
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
        title: const Text('Payment'),
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

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 32),
            SizedBox(width: 8),
            Text('Payment Successful!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Amount: ₹${widget.amount.toStringAsFixed(2)}'),
            const SizedBox(height: 8),
            Text('Prediction: ${widget.title}'),
            const SizedBox(height: 16),
            const Text('You can now view the full prediction!'),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context, true); // Return to prediction screen with success
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('View Prediction'),
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
