import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiService _apiService = ApiService();
  
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiService.loadToken();
      if (_apiService.token != null) {
        _user = await _authService.getProfile();
        _isAuthenticated = true;
      }
    } catch (e) {
      _isAuthenticated = false;
      _user = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> sendOTP(String phone) async {
    try {
      final response = await _authService.sendOTP(phone);
      return response['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<String?> verifyOTP(String phone, String otp) async {
    try {
      final response = await _authService.verifyOTP(phone, otp);
      
      if (response['success'] == true) {
        _user = User.fromJson(response['user']);
        _isAuthenticated = true;
        notifyListeners();
        return null; // Success
      }
      
      return 'Verification failed';
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
