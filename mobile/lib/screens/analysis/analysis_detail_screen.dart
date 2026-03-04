import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/analysis.dart';
import '../../services/analysis_service.dart';
import '../../services/payment_service.dart';
import '../../config/theme_constants.dart';

class AnalysisDetailScreen extends StatefulWidget {
  final int matchId;

  const AnalysisDetailScreen({Key? key, required this.matchId}) : super(key: key);

  @override
  State<AnalysisDetailScreen> createState() => _AnalysisDetailScreenState();
}

class _AnalysisDetailScreenState extends State<AnalysisDetailScreen> {
  final AnalysisService _analysisService = AnalysisService();
  final PaymentService _predictionService = PaymentService();
  late Future<MatchAnalysis> _analysisFuture;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadAnalysis();
  }

  void _loadAnalysis() {
    _analysisFuture = _analysisService.getPredictionByMatch(widget.matchId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.warmWhite,
      appBar: AppBar(
        title: const Text(
          'EXPERT ANALYSIS',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 18),
        ),
        backgroundColor: AppTheme.deepBlue,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: FutureBuilder<MatchAnalysis>(
        future: _analysisFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: ${snapshot.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => setState(() => _loadAnalysis()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final prediction = snapshot.data!;

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Match Info Header
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                  decoration: const BoxDecoration(
                    color: AppTheme.deepBlue,
                    borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${prediction.match?.team1 ?? ''} vs ${prediction.match?.team2 ?? ''}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        prediction.title.toUpperCase(),
                        style: const TextStyle(
                          color: AppTheme.primaryGold,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),

                // Confidence Badge
                if (prediction.confidencePercentage != null)
                  Container(
                    margin: const EdgeInsets.all(24),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(color: AppTheme.primaryGold.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10)),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.analytics_rounded, color: AppTheme.primaryGold, size: 28),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'CONFIDENCE SCORE',
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                            ),
                            Text(
                              '${prediction.confidencePercentage}% Match Sync',
                              style: const TextStyle(
                                color: AppTheme.deepBlue,
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                // Content
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: prediction.isPurchased
                      ? _buildFullPrediction(prediction)
                      : _buildPreview(prediction),
                ),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPreview(MatchAnalysis prediction) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'PREVIEW INSIGHTS',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: AppTheme.primaryGold,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          prediction.previewText ?? 'Unlock the full analysis to see expert insights!',
          style: const TextStyle(fontSize: 15, height: 1.6, color: AppTheme.textMain, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 32),
        
        // Locked Content Indicator
        Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: AppTheme.divineCream,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.primaryGold.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              const Icon(Icons.lock_person_rounded, size: 56, color: AppTheme.primaryGold),
              const SizedBox(height: 20),
              const Text(
                'FULL ANALYSIS LOCKED',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.deepBlue,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Unlock to see detailed planetary support, winner insights, and expert astrology reports',
                style: TextStyle(color: AppTheme.textSecondary, height: 1.5, fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 32),
        
        // Unlock Button
        ElevatedButton(
          onPressed: () => _unlockAnalysis(prediction),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.deepBlue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 20),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            elevation: 8,
            shadowColor: AppTheme.deepBlue.withOpacity(0.4),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.auto_awesome, color: AppTheme.primaryGold),
              const SizedBox(width: 12),
              Text(
                'UNLOCK FOR 🪙 ${prediction.price.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFullPrediction(MatchAnalysis prediction) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.green.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.verified_rounded, color: Colors.green.shade700, size: 20),
              const SizedBox(width: 8),
              Text(
                'PURCHASED & VERIFIED',
                style: TextStyle(
                  color: Colors.green.shade700,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 32),
        
        if (prediction.analysisResult != null) ...[
          const Text(
            'PLANETARY SUPPORT',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 12,
              color: AppTheme.primaryGold,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.deepBlue, AppTheme.deepBlue.withOpacity(0.8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(color: AppTheme.deepBlue.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8)),
              ],
            ),
            child: Text(
              prediction.analysisResult!,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: 1,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 32),
        ],
        
        const Text(
          'ASTROLOGICAL ANALYSIS',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 12,
            color: AppTheme.textSecondary,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.primaryGold.withOpacity(0.1)),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: Text(
            prediction.fullAnalysis ?? 'No detailed analysis available',
            style: const TextStyle(
              fontSize: 15,
              height: 1.7,
              color: AppTheme.textMain,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  void _unlockAnalysis(MatchAnalysis prediction) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final walletBalance = authProvider.user?.walletBalance ?? 0.0;
    
    if (walletBalance < prediction.price) {
      _showRechargeDialog();
      return;
    }

    // Show Confirmation Dialog
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unlock Analysis'),
        content: Text('Confirm unlocking this analysis for 🪙 ${prediction.price.toStringAsFixed(0)}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade700, foregroundColor: Colors.white),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);
    
    try {
      final response = await _predictionService.unlockAnalysisWithWallet(prediction.matchId);
      
      if (response['success'] == true) {
        await authProvider.refreshProfile();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Analysis unlocked successfully!'), backgroundColor: Colors.green),
          );
          _loadAnalysis();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response['error'] ?? 'Failed to unlock analysis'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showRechargeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Insufficient Astro Coins'),
        content: const Text('You don\'t have enough coins to unlock this analysis. Please recharge your wallet.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to recharge screen if available
              // For now, let's assume there's a dashboard or profile screen
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
            child: const Text('Recharge'),
          ),
        ],
      ),
    );
  }
}
