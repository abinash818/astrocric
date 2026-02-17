class User {
  final int id;
  final String phone;
  final String? name;
  final String? email;
  final double walletBalance;

  User({
    required this.id,
    required this.phone,
    this.name,
    this.email,
    required this.walletBalance,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      phone: json['phone'],
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
