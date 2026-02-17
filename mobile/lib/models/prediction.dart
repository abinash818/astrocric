class Prediction {
  final int id;
  final int matchId;
  final String title;
  final String? previewText;
  final String? fullPrediction;
  final String? predictedWinner;
  final int? confidencePercentage;
  final double price;
  final bool isPurchased;
  final MatchInfo? match;

  Prediction({
    required this.id,
    required this.matchId,
    required this.title,
    this.previewText,
    this.fullPrediction,
    this.predictedWinner,
    this.confidencePercentage,
    required this.price,
    required this.isPurchased,
    this.match,
  });

  factory Prediction.fromJson(Map<String, dynamic> json) {
    return Prediction(
      id: json['id'],
      matchId: json['matchId'],
      title: json['title'],
      previewText: json['previewText'],
      fullPrediction: json['fullPrediction'],
      predictedWinner: json['predictedWinner'],
      confidencePercentage: json['confidencePercentage'],
      price: (json['price'] ?? 0).toDouble(),
      isPurchased: json['isPurchased'] ?? false,
      match: json['match'] != null ? MatchInfo.fromJson(json['match']) : null,
    );
  }
}

class MatchInfo {
  final String team1;
  final String team2;
  final DateTime matchDate;
  final String status;

  MatchInfo({
    required this.team1,
    required this.team2,
    required this.matchDate,
    required this.status,
  });

  factory MatchInfo.fromJson(Map<String, dynamic> json) {
    return MatchInfo(
      team1: json['team1'],
      team2: json['team2'],
      matchDate: DateTime.parse(json['matchDate']),
      status: json['status'],
    );
  }
}
