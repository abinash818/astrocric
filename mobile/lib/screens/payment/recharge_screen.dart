import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/payment_service.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme_constants.dart';

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
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _proceedToPay({bool restrictToUpi = false, bool nativeUpi = false}) async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      _showError('Please enter a valid amount');
      return;
    }

    setState(() => _isLoading = true);

    try {
      String? merchantTransactionId;
      if (nativeUpi) {
         final result = await _paymentService.startNativeUpiTransaction(
             amount: amount, 
             note: "Astro Coins Recharge"
         );
         
         if (result['status'] == 'success' || result['status'] == 'submitted') {
             merchantTransactionId = result['merchantTransactionId'];
             if (merchantTransactionId != null) {
                _showSuccess('Checking Payment Status...');
                await _pollPaymentStatus(merchantTransactionId, maxAttempts: 10); 
             }
             return;
         } else if (result['status'] == 'cancelled') {
             _showError('Payment Cancelled');
         } else {
             _showError(result['message'] ?? 'Payment Failed');
         }
      } 
      else {
        final result = await _paymentService.startPhonePeTransaction(amount, restrictToUpi: restrictToUpi);
        if (result['success'] == true) {
           merchantTransactionId = result['merchantTransactionId'];
           if (merchantTransactionId != null) {
              _showPollingDialog(merchantTransactionId);
              return; 
           }
        } else {
           _showError(result['message'] ?? 'Failed to initiate');
        }
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      if (mounted) setState(() { _isLoading = false; });
    }
  }

  void _showPollingDialog(String merchantTransactionId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text('Processing Payment', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.deepBlue)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            CircularProgressIndicator(color: AppTheme.primaryGold),
            SizedBox(height: 20),
            Text('Please complete payment in your browser/app...', textAlign: TextAlign.center),
          ],
        ),
      ),
    );
    _pollPaymentStatus(merchantTransactionId, isDialog: true);
  }

  Future<void> _pollPaymentStatus(String merchantTransactionId, {int maxAttempts = 20, bool isDialog = false}) async {
    for (int i = 0; i < maxAttempts; i++) {
        await Future.delayed(const Duration(seconds: 3));
        if (!mounted) return;

        final result = await _paymentService.verifyPayment(merchantTransactionId);
        
        if (result['success'] == true) {
            if (isDialog && mounted) Navigator.of(context).pop();
            await context.read<AuthProvider>().init();
            if (mounted) {
               _showSuccess(result['message'] ?? 'Wallet Recharged!');
               Navigator.of(context).pop();
            }
            return;
        } else if (result['code'] == 'PAYMENT_ERROR') {
             if (isDialog && mounted) Navigator.of(context).pop();
             _showError('Payment Failed');
             return;
        }
    }
    if (isDialog && mounted) Navigator.of(context).pop();
    _showError('Payment pending. Check history later.');
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.redAccent),
    );
  }

  void _showSuccess(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.warmWhite,
      appBar: AppBar(
        title: const Text(
          'RECHARGE WALLET',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 18),
        ),
        backgroundColor: AppTheme.deepBlue,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'RECHARGE AMOUNT',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.primaryGold, letterSpacing: 2),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.deepBlue),
              decoration: InputDecoration(
                prefixText: '🪙 ',
                hintText: '0',
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide(color: AppTheme.primaryGold.withOpacity(0.2)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: const BorderSide(color: AppTheme.primaryGold, width: 2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'QUICK SELECT',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.textSecondary, letterSpacing: 1.5),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _presetAmounts.map((amount) {
                return InkWell(
                  onTap: () => setState(() => _amountController.text = amount.toStringAsFixed(0)),
                  borderRadius: BorderRadius.circular(15),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(
                      color: _amountController.text == amount.toStringAsFixed(0) ? AppTheme.primaryGold : Colors.white,
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(color: AppTheme.primaryGold.withOpacity(0.5)),
                      boxShadow: [
                        if (_amountController.text == amount.toStringAsFixed(0))
                          BoxShadow(color: AppTheme.primaryGold.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Text(
                      '🪙 ${amount.toInt()}',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        color: _amountController.text == amount.toStringAsFixed(0) ? Colors.white : AppTheme.deepBlue,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            
            const SizedBox(height: 60),
            
            _buildPaymentButton(
              label: 'WEB CHECKOUT',
              icon: Icons.language_rounded,
              onPressed: _isLoading ? null : () => _proceedToPay(),
              isPrimary: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentButton({
    required String label, 
    required IconData icon, 
    required VoidCallback? onPressed,
    required bool isPrimary,
  }) {
    return SizedBox(
      width: double.infinity,
      child: isPrimary 
        ? ElevatedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon, size: 20),
            label: _isLoading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(label, style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.deepBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 20),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              shadowColor: AppTheme.deepBlue.withOpacity(0.4),
            ),
          )
        : OutlinedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon, size: 20),
            label: Text(label, style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.deepBlue,
              side: const BorderSide(color: AppTheme.primaryGold, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 20),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
          ),
    );
  }
}
