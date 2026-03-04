import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase;
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiService _apiService = ApiService();
  
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = true;
  bool _isSyncing = false; // Guard against double-sync

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;

  Future<void> init() async {
    print('AuthProvider: Initializing AuthProvider...');
    await _apiService.loadToken();
    
    _authService.userChanges.listen((firebaseUser) async {
      print('AuthProvider: userChanges detected. firebaseUser: ${firebaseUser?.email}');
      
      if (_isSyncing) return;
      
      if (firebaseUser != null) {
        await _handleFirebaseUser(firebaseUser);
      } else {
        _user = null;
        _isAuthenticated = false;
        _isLoading = false;
        notifyListeners();
      }
    });
  }

  /// Shared handler for syncing Firebase user with backend
  Future<void> _handleFirebaseUser(firebase.User firebaseUser) async {
    if (_isSyncing) return;
    _isSyncing = true;
    _isLoading = true;
    notifyListeners(); 

    try {
      print('AuthProvider: Syncing user ${firebaseUser.email} with backend...');
      await _authService.syncWithBackend(firebaseUser);
      
      print('AuthProvider: Fetching profile...');
      _user = await _authService.getProfile();
      _isAuthenticated = (_user != null);
    } catch (e) {
      print('AuthProvider: Auth sync error: $e');
      _user = null;
      _isAuthenticated = false;
    } finally {
      _isSyncing = false;
      _isLoading = false;
      notifyListeners(); 
    }
  }

  Future<void> refreshProfile() async {
    if (_isAuthenticated) {
      try {
        _user = await _authService.getProfile();
        notifyListeners();
      } catch (e) {
        print('Profile Refresh Error: $e');
      }
    }
  }

  Future<String?> loginWithEmail(String email, String password) async {
    try {
      _isLoading = true;
      notifyListeners();
      await _authService.loginWithEmail(email, password);
      return null;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.toString();
    }
  }

  Future<String?> signupWithEmail(String email, String password) async {
    try {
      _isLoading = true;
      notifyListeners();
      await _authService.signupWithEmail(email, password);
      return null;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.toString();
    }
  }

  Future<String?> loginWithGoogle() async {
    try {
      _isLoading = true;
      notifyListeners();
      final result = await _authService.loginWithGoogle();
      if (result == null) {
        _isLoading = false;
        notifyListeners();
        return 'Google sign in cancelled';
      }
      return null;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
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
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.logout();
    } finally {
      _user = null;
      _isAuthenticated = false;
      _isSyncing = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  // Legacy support for older components during transition
  Future<bool> sendOTP(String phone) async => false;
  Future<String?> verifyOTP(String phone, String otp) async => 'Service deprecated';
}
