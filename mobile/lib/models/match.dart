class Match {
  final int id;
  final String apiMatchId;
  final String team1;
  final String team2;
  final String? team1FlagUrl;
  final String? team2FlagUrl;
  final DateTime matchDate;
  final String matchType;
  final String venue;
  final String status;
  final String? result;
  final String? team1Score;
  final String? team2Score;
  final bool hasPrediction;

  Match({
    required this.id,
    required this.apiMatchId,
    required this.team1,
    required this.team2,
    this.team1FlagUrl,
    this.team2FlagUrl,
    required this.matchDate,
    required this.matchType,
    required this.venue,
    required this.status,
    this.result,
    this.team1Score,
    this.team2Score,
    this.hasPrediction = false,
  });

  factory Match.fromJson(Map<String, dynamic> json) {
    return Match(
      id: json['id'],
      apiMatchId: json['api_match_id'] ?? '',
      team1: json['team1'],
      team2: json['team2'],
      team1FlagUrl: json['team1_flag_url'],
      team2FlagUrl: json['team2_flag_url'],
      matchDate: DateTime.parse(json['match_date']),
      matchType: json['match_type'] ?? 'Unknown',
      venue: json['venue'] ?? 'TBD',
      status: json['status'] ?? 'upcoming',
      result: json['result'],
      team1Score: json['team1_score'],
      team2Score: json['team2_score'],
      hasPrediction: json['has_prediction'] ?? false,
    );
  }
}
