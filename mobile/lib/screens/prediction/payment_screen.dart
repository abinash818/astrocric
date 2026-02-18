import 'package:flutter/material.dart';
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
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _startPayment();
  }

  Future<void> _startPayment() async {
    try {
      final result = await _paymentService.startPhonePeTransaction(
          widget.amount, 
          predictionId: widget.predictionId
      );
      
      if (mounted) {
        setState(() => _isLoading = false);
        
        if (result['success'] == true) {
          _showSuccessDialog();
        } else {
          _showErrorDialog(result['message'] ?? 'Payment Failed');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
            _error = e.toString();
            _isLoading = false;
        });
        _showErrorDialog('Error: ${e.toString()}');
      }
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
      body: Center(
        child: _isLoading 
            ? const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Processing Payment...'),
                  Text('Please do not press back or close the app', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              )
            : _error != null 
                ? Column(
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
                  )
                : const SizedBox(), // Should ideally be handled by dialogs
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
