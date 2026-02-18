import '../models/match.dart';
import 'api_service.dart';

class MatchService {
  final ApiService _apiService = ApiService();

  Future<List<Match>> getUpcomingMatches({int page = 1, int limit = 10}) async {
    final response = await _apiService.get(
      '/matches/upcoming?page=$page&limit=$limit',
    );

    final List<dynamic> matchesJson = response['matches'];
    return matchesJson.map((json) => Match.fromJson(json)).toList();
  }

  Future<List<Match>> getLiveMatches() async {
    final response = await _apiService.get('/matches/live');
    
    final List<dynamic> matchesJson = response['matches'];
    return matchesJson.map((json) => Match.fromJson(json)).toList();
  }

  Future<List<Match>> getFinishedMatches({int page = 1, int limit = 20}) async {
    final response = await _apiService.get(
      '/matches/finished?page=$page&limit=$limit',
    );

    final List<dynamic> matchesJson = response['matches'];
    return matchesJson.map((json) => Match.fromJson(json)).toList();
  }

  Future<Match> getMatchDetails(int matchId) async {
    final response = await _apiService.get('/matches/$matchId');
    return Match.fromJson(response);
  }

  Future<Map<String, dynamic>> getMatchScorecard(int matchId) async {
    final response = await _apiService.get('/matches/$matchId/scorecard');
    return response;
  }
}
