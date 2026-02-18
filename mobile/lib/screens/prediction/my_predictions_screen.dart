import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/prediction.dart';
import '../../services/prediction_service.dart';

class MyPredictionsScreen extends StatefulWidget {
  const MyPredictionsScreen({Key? key}) : super(key: key);

  @override
  State<MyPredictionsScreen> createState() => _MyPredictionsScreenState();
}

class _MyPredictionsScreenState extends State<MyPredictionsScreen> {
  final PredictionService _predictionService = PredictionService();
  late Future<List<Prediction>> _predictionsFuture;

  @override
  void initState() {
    super.initState();
    _loadPredictions();
  }

  void _loadPredictions() {
    _predictionsFuture = _predictionService.getPurchasedPredictions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Predictions'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: FutureBuilder<List<Prediction>>(
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
                    'No purchased predictions yet',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Purchase predictions to see them here',
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
                return _PredictionCard(prediction: predictions[index]);
              },
            ),
          );
        },
      ),
    );
  }
}

class _PredictionCard extends StatelessWidget {
  final Prediction prediction;

  const _PredictionCard({required this.prediction});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.all(16),
        title: Text(
          prediction.title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              '${prediction.match?.team1 ?? ''} vs ${prediction.match?.team2 ?? ''}',
              style: TextStyle(color: Colors.grey.shade700),
            ),
            if (prediction.match?.matchDate != null) ...[
              const SizedBox(height: 4),
              Text(
                DateFormat('MMM dd, yyyy').format(prediction.match!.matchDate.toLocal()),
                style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
              ),
            ],
          ],
        ),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.check_circle, color: Colors.green.shade700),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '₹${prediction.price.toStringAsFixed(0)}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            if (prediction.confidencePercentage != null)
              Text(
                '${prediction.confidencePercentage}%',
                style: TextStyle(
                  color: Colors.green.shade700,
                  fontSize: 12,
                ),
              ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (prediction.predictedWinner != null) ...[
                  const Text(
                    'Predicted Winner',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      prediction.predictedWinner!,
                      style: TextStyle(
                        color: Colors.blue.shade700,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                const Text(
                  'Full Analysis',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  prediction.fullPrediction ?? 'No detailed prediction available',
                  style: const TextStyle(fontSize: 14, height: 1.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
