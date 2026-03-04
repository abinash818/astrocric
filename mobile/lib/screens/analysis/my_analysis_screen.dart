import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/analysis.dart';
import '../../services/analysis_service.dart';
import '../../config/theme_constants.dart';

class MyAnalysisScreen extends StatefulWidget {
  const MyAnalysisScreen({Key? key}) : super(key: key);

  @override
  State<MyAnalysisScreen> createState() => _MyAnalysisScreenState();
}

class _MyAnalysisScreenState extends State<MyAnalysisScreen> {
  final AnalysisService _analysisService = AnalysisService();
  late Future<List<MatchAnalysis>> _predictionsFuture;

  @override
  void initState() {
    super.initState();
    _loadPredictions();
  }

  void _loadPredictions() {
    _predictionsFuture = _analysisService.getPurchasedPredictions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.warmWhite,
      appBar: AppBar(
        title: const Text(
          'MY ANALYSIS',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 18),
        ),
        backgroundColor: AppTheme.deepBlue,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: FutureBuilder<List<MatchAnalysis>>(
        future: _predictionsFuture,
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
                    onPressed: () => setState(() => _loadPredictions()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final predictions = snapshot.data ?? [];

          if (predictions.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'No purchased analysis yet',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Unlock analysis to see them here',
                    style: TextStyle(color: Colors.grey.shade500),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              setState(() => _loadPredictions());
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: predictions.length,
              itemBuilder: (context, index) {
                return _AnalysisCard(prediction: predictions[index]);
              },
            ),
          );
        },
      ),
    );
  }
}

class _AnalysisCard extends StatelessWidget {
  final MatchAnalysis prediction;

  const _AnalysisCard({required this.prediction});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryGold.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: const RoundedRectangleBorder(side: BorderSide.none),
        title: Text(
          prediction.title,
          style: const TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            color: AppTheme.deepBlue,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              '${prediction.match?.team1 ?? ''} vs ${prediction.match?.team2 ?? ''}',
              style: const TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
            ),
            if (prediction.match?.matchDate != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.calendar_today_rounded, size: 12, color: AppTheme.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    DateFormat('MMM dd, yyyy').format(prediction.match!.matchDate.toLocal()),
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ],
          ],
        ),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.primaryGold.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.stars_rounded, color: AppTheme.primaryGold),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '🪙 ${prediction.price.toStringAsFixed(0)}',
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 16,
                color: AppTheme.deepBlue,
              ),
            ),
            if (prediction.confidencePercentage != null)
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${prediction.confidencePercentage}%',
                  style: TextStyle(
                    color: Colors.green.shade700,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (prediction.analysisResult != null) ...[
                  const Text(
                    'PLANETARY SUPPORT',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      color: AppTheme.primaryGold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.deepBlue, AppTheme.deepBlue.withOpacity(0.8)],
                      ),
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.deepBlue.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Text(
                      prediction.analysisResult!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        letterSpacing: 1,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                const Text(
                  'ASTROLOGICAL ANALYSIS',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.divineCream,
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(color: AppTheme.primaryGold.withOpacity(0.2)),
                  ),
                  child: Text(
                    prediction.fullAnalysis ?? 'No detailed analysis available',
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.6,
                      color: AppTheme.textMain,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
