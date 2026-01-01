import 'api_client.dart';

/// Base API Service class
///
/// Extend this class to create specific API services.
/// Example:
/// ```dart
/// class UserService extends ApiService {
///   UserService(super.client);
///
///   Future<ApiResponse<User>> getUser(String id) async {
///     return await client.get('/users/$id', fromJson: (json) => User.fromJson(json));
///   }
/// }
/// ```
abstract class ApiService {
  final ApiClient client;

  ApiService(this.client);
}
