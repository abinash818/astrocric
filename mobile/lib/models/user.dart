class User {
  final String id;
  final String? phone;
  final String? name;
  final String? email;
  final double walletBalance;

  User({
    required this.id,
    this.phone,
    this.name,
    this.email,
    required this.walletBalance,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'].toString(), // Safely handle int or string
      phone: json['phone']?.toString(), // Safely handle null
      name: json['name'],
      email: json['email'],
      walletBalance: (json['walletBalance'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'name': name,
      'email': email,
      'walletBalance': walletBalance,
    };
  }
}
