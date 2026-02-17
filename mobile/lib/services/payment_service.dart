import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> createOrder(int predictionId) async {
    final response = await _apiService.post(
      '/payment/create-order',
      {'predictionId': predictionId},
    );
    return response;
  }

  Future<Map<String, dynamic>> verifyPayment(String merchantTransactionId) async {
    final response = await _apiService.post(
      '/payment/verify',
      {'merchantTransactionId': merchantTransactionId},
    );
    return response;
  }

  Future<List<Map<String, dynamic>>> getPaymentHistory() async {
    final response = await _apiService.get('/payment/history');
    return List<Map<String, dynamic>>.from(response['payments']);
  }
}
