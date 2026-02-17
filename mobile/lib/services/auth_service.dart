import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> sendOTP(String phone) async {
    return await _apiService.post(
      '/auth/send-otp',
      {'phone': phone},
      requiresAuth: false,
    );
  }

  Future<Map<String, dynamic>> verifyOTP(String phone, String otp) async {
    final response = await _apiService.post(
      '/auth/verify-otp',
      {'phone': phone, 'otp': otp},
      requiresAuth: false,
    );

    if (response['success'] == true && response['token'] != null) {
      await _apiService.setToken(response['token']);
    }

    return response;
  }

  Future<User> getProfile() async {
    final response = await _apiService.get('/auth/profile');
    return User.fromJson(response);
  }

  Future<void> logout() async {
    await _apiService.clearToken();
  }
}
