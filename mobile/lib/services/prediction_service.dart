import '../models/prediction.dart';
import 'api_service.dart';

class PredictionService {
  final ApiService _apiService = ApiService();

  Future<Prediction> getPredictionByMatch(int matchId) async {
    final response = await _apiService.get('/predictions/match/$matchId');
    return Prediction.fromJson(response);
  }

  Future<List<Prediction>> getPurchasedPredictions() async {
    final response = await _apiService.get('/predictions/purchased');
    final List<dynamic> predictionsJson = response['predictions'];
    return predictionsJson.map((json) => Prediction.fromJson(json)).toList();
  }
}
