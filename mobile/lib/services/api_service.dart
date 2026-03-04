import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();
  String? _token;
  bool _isInitialized = false;

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        if (e.response?.statusCode == 401) {
          print('ApiService: 401 Unauthorized detected. Clearing token...');
          clearToken();
          // Note: In a real app, you might trigger a global logout event here
        }
        return handler.next(e);
      },
    ));
  }

  String? get token => _token;

  Future<void> ensureInitialized() async {
    if (_isInitialized) return;
    await loadToken();
    _isInitialized = true;
  }

  Future<void> setToken(String token) async {
    _token = token;
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<void> loadToken() async {
    _token = await _storage.read(key: 'auth_token');
  }

  Future<void> clearToken() async {
    _token = null;
    await _storage.delete(key: 'auth_token');
  }

  Future<Response> get(String endpoint, {bool requiresAuth = true}) async {
    await ensureInitialized();
    try {
      return await _dio.get(endpoint);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> post(String endpoint, Map<String, dynamic> body, {bool requiresAuth = true}) async {
    await ensureInitialized();
    try {
      return await _dio.post(endpoint, data: body);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> put(String endpoint, Map<String, dynamic> body, {bool requiresAuth = true}) async {
    await ensureInitialized();
    try {
      return await _dio.put(endpoint, data: body);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Exception _handleDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
      return Exception('Connection timeout. Please check your internet.');
    }
    if (e.type == DioExceptionType.connectionError) {
      return Exception('No internet connection.');
    }
    
    final errorMessage = e.response?.data?['error'] ?? e.message ?? 'Request failed';
    return Exception(errorMessage);
  }
}
