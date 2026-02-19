import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:upi_pay/upi_pay.dart';
import 'package:upi_pay/types/meta.dart';
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
  List<ApplicationMeta> _installedApps = [];
  ApplicationMeta? _selectedApp;

  @override
  void initState() {
    super.initState();
    _loadInstalledApps();
  }

  Future<void> _loadInstalledApps() async {
    final apps = await _paymentService.getInstalledUpiApps();
    if (mounted) {
      setState(() {
        _installedApps = apps;
      });
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _proceedToPay({bool restrictToUpi = false}) async {
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
      // If specific UPI web flow requested
      if (restrictToUpi) {
           final result = await _paymentService.startPhonePeTransaction(amount, restrictToUpi: true);
           _handlePaymentResult(result);
           return;
      }

      final tokenResponse = await _paymentService.getSdkToken(amount);
      final String mTxnId = tokenResponse['merchantTransactionId'] ?? '';
      
      if (mTxnId.isEmpty) {
        throw Exception('Failed to initiate transaction');
      }

      if (_selectedApp != null) {
        // Start direct payment
        _startUpiPayment(_selectedApp!, amount, mTxnId);
      } else {
        // Check for available UPI apps (if user clicks general proceed)
        if (_installedApps.isNotEmpty) {
           _showUpiAppSelection(context, _installedApps, amount, mTxnId);
        } else {
          // Fallback to Web Checkout
          final result = await _paymentService.startPhonePeTransaction(amount);
          _handlePaymentResult(result);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _handlePaymentResult(Map<String, dynamic> result) async {
    if (!mounted) return;
    if (result['success'] == true) {
      await context.read<AuthProvider>().init();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Wallet recharged successfully!')),
        );
        Navigator.pop(context);
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Payment Failed')),
      );
    }
  }

  void _showUpiAppSelection(BuildContext context, List<ApplicationMeta> apps, double amount, String txnId) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Select UPI App',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: apps.length,
                  separatorBuilder: (_, __) => const Divider(),
                  itemBuilder: (context, index) {
                    final app = apps[index];
                    return ListTile(
                      leading: const Icon(Icons.payment, color: Colors.blue),
                      title: Text(app.upiApplication.getAppName()),
                      onTap: () {
                        Navigator.pop(context);
                        _startUpiPayment(app, amount, txnId);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _startUpiPayment(ApplicationMeta app, double amount, String txnId) async {
    setState(() => _isLoading = true);
    try {
      final response = await _paymentService.startUpiTransaction(
        app: app,
        amount: amount,
        merchantTransactionId: txnId,
      );

      if (!mounted) return;

      if (response != null && response.status == UpiTransactionStatus.success) {
        _handlePaymentResult({'success': true});
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment not completed or failed')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('UPI Error: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
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
            if (_installedApps.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text(
                'Pay Directly via App',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 80,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _installedApps.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 16),
                  itemBuilder: (context, index) {
                    final app = _installedApps[index];
                    final isSelected = _selectedApp == app;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedApp = app;
                        });
                      },
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isSelected ? Colors.blue : Colors.grey.shade300,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(12),
                              color: isSelected ? Colors.blue.withOpacity(0.05) : Colors.transparent,
                            ),
                            child: const Icon(Icons.payment, color: Colors.blue, size: 28),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            app.upiApplication.getAppName(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              color: isSelected ? Colors.blue : Colors.black,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ] else ...[
               const SizedBox(height: 24),
               Container(
                 padding: const EdgeInsets.all(12),
                 decoration: BoxDecoration(
                   color: Colors.amber.shade50,
                   borderRadius: BorderRadius.circular(8),
                   border: Border.all(color: Colors.amber.shade200),
                 ),
                 child: Column(
                   children: [
                     const Row(
                       children: [
                         Icon(Icons.info_outline, color: Colors.amber),
                         SizedBox(width: 12),
                         Expanded(
                           child: Text(
                             'No UPI apps detected. Use the button below to pay via UPI Web.',
                             style: TextStyle(fontSize: 12, color: Colors.black87),
                           ),
                         ),
                       ],
                     ),
                     const SizedBox(height: 12),
                     SizedBox(
                       width: double.infinity,
                       child: OutlinedButton.icon(
                         onPressed: _isLoading ? null : () => _proceedToPay(restrictToUpi: true),
                         icon: const Icon(Icons.web),
                         label: const Text("Pay via UPI (Web Checkout)"),
                         style: OutlinedButton.styleFrom(
                           foregroundColor: Colors.blue,
                           side: const BorderSide(color: Colors.blue),
                         ),
                       ),
                     ),
                   ],
                 ),
               ),
            ],
            const Spacer(),
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
                        'Proceed to Pay',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
