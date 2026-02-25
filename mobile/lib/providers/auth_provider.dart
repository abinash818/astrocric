import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = true;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;

  Future<void> init() async {
    _authService.userChanges.listen((firebaseUser) async {
      _isLoading = true;
      notifyListeners();

      if (firebaseUser != null) {
        try {
          _user = await _authService.getProfile();
          _isAuthenticated = true;
        } catch (e) {
          _user = null;
          _isAuthenticated = false;
        }
      } else {
        _user = null;
        _isAuthenticated = false;
      }

      _isLoading = false;
      notifyListeners();
    });
  }

  Future<String?> loginWithEmail(String email, String password) async {
    try {
      await _authService.loginWithEmail(email, password);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  Future<String?> signupWithEmail(String email, String password) async {
    try {
      await _authService.signupWithEmail(email, password);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  Future<String?> loginWithGoogle() async {
    try {
      final result = await _authService.loginWithGoogle();
      if (result == null) return 'Google sign in cancelled';
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  Future<String?> resetPassword(String email) async {
    try {
      await _authService.resetPassword(email);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
  }

  // Legacy support for older components during transition
  Future<bool> sendOTP(String phone) async => false;
  Future<String?> verifyOTP(String phone, String otp) async => 'Service deprecated';
}
