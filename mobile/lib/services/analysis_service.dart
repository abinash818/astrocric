import '../models/analysis.dart';
import 'api_service.dart';

class AnalysisService {
  final ApiService _apiService = ApiService();

  Future<MatchAnalysis> getPredictionByMatch(int matchId) async {
    final response = await _apiService.get('/analysis/match/$matchId');
    return MatchAnalysis.fromJson(response);
  }

  Future<List<MatchAnalysis>> getPurchasedPredictions() async {
    final response = await _apiService.get('/analysis/purchased');
    final List<dynamic> predictionsJson = response['analyses'];
    return predictionsJson.map((json) => MatchAnalysis.fromJson(json)).toList();
  }
}
