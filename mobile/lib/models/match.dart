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
      hasPrediction: json['has_prediction'] ?? false,
    );
  }
}
