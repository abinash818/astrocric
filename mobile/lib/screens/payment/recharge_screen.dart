import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/payment_service.dart';
import '../../providers/auth_provider.dart';

class RechargeScreen extends StatefulWidget {
  const RechargeScreen({Key? key}) : super(key: key);

  @override
  State<RechargeScreen> createState() => _RechargeScreenState();
}

class _RechargeScreenState extends State<RechargeScreen> {
  final TextEditingController _amountController = TextEditingController();
  final List<double> _presetAmounts = [100, 200, 500, 1000];
  final PaymentService _paymentService = PaymentService();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _proceedToPay({bool restrictToUpi = false, bool nativeUpi = false}) async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      String? merchantTransactionId;

      // 1. Pay via Native UPI Module
      if (nativeUpi) {
        final tokenResponse = await _paymentService.getSdkToken(amount);
        merchantTransactionId = tokenResponse['merchantTransactionId'];
        
        if (merchantTransactionId != null && merchantTransactionId.isNotEmpty) {
           final result = await _paymentService.launchNativeUpi(
             amount: amount, 
             merchantTransactionId: merchantTransactionId,
             note: "Wallet Recharge"
           );
           
           if (result['status'] == 'success' || result['status'] == 'submitted') {
             // Verify with backend
             await _pollPaymentStatus(merchantTransactionId, maxAttempts: 5); // Quick check
             return;
           } else if (result['status'] == 'cancelled') {
             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Cancelled')));
           } else {
             ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'] ?? 'Payment Failed')));
           }
        }
      } 
      // 2. Pay via Web Checkout
      else {
        final result = await _paymentService.startPhonePeTransaction(amount, restrictToUpi: restrictToUpi);
        if (result['success'] == true) {
           merchantTransactionId = result['merchantTransactionId'];
           // Valid Merchant ID? Start Polling
           if (merchantTransactionId != null) {
              _showPollingDialog(merchantTransactionId);
              return; 
           }
        } else {
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'] ?? 'Failed to initiate')));
        }
      }
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() { _isLoading = false; });
    }
  }

  void _showPollingDialog(String merchantTransactionId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Processing Payment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Please complete payment in your browser/app...'),
          ],
        ),
      ),
    );
    // Start polling in background
    _pollPaymentStatus(merchantTransactionId, isDialog: true);
  }

  Future<void> _pollPaymentStatus(String merchantTransactionId, {int maxAttempts = 20, bool isDialog = false}) async {
    for (int i = 0; i < maxAttempts; i++) {
        await Future.delayed(const Duration(seconds: 3));
        if (!mounted) return;

        final result = await _paymentService.verifyPayment(merchantTransactionId);
        
        if (result['success'] == true) {
            if (isDialog && mounted) Navigator.of(context).pop(); // Close dialog
            await context.read<AuthProvider>().init(); // Refresh wallet
            if (mounted) {
               ScaffoldMessenger.of(context).showSnackBar(
                 SnackBar(content: Text(result['message'] ?? 'Wallet Recharged!'), backgroundColor: Colors.green),
               );
               Navigator.of(context).pop(); // Close Screen
            }
            return;
        } else if (result['code'] == 'PAYMENT_ERROR') {
            // Stop polling on definite failure
             if (isDialog && mounted) Navigator.of(context).pop();
             if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Failed')));
             return;
        }
    }
    // Timeout
    if (isDialog && mounted) Navigator.of(context).pop();
    if (mounted) {
       ScaffoldMessenger.of(context).showSnackBar(
         const SnackBar(content: Text('Payment pending. Check history later.')),
       );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recharge Wallet'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter Amount',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                prefixText: '₹ ',
                border: OutlineInputBorder(),
                hintText: 'Enter amount to add',
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Quick Select',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _presetAmounts.map((amount) {
                return ActionChip(
                  label: Text('₹${amount.toInt()}'),
                  onPressed: () {
                    _amountController.text = amount.toStringAsFixed(0);
                  },
                );
              }).toList(),
            ),
            
            const Spacer(),
            
            // Single Main Button - Standard Web Checkout
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : () => _proceedToPay(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade700,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Proceed to Pay (Web Checkout)',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: _isLoading ? null : () => _proceedToPay(nativeUpi: true),
                  icon: const Icon(Icons.apps),
                  label: const Text('Pay via Local UPI App'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.blue.shade700,
                    side: BorderSide(color: Colors.blue.shade700),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
