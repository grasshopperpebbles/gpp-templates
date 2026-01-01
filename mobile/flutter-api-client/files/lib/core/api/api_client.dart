import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/app_config.dart';

/// API Client for making HTTP requests to backend API
///
/// Base URL is configured via AppConfig (can use environment variables).
/// To set API base URL:
/// - Set environment variable: API_BASE_URL=https://api.example.com
/// - Or update AppConfig.apiBaseUrl default value
class ApiClient {
  final String baseUrl;
  final Map<String, String> defaultHeaders;

  /// Create API client with base URL from config
  ApiClient({
    String? baseUrl,
    Map<String, String>? headers,
  })  : baseUrl = baseUrl ?? AppConfig.getApiBaseUrl(),
        defaultHeaders = headers ?? {
          'Content-Type': 'application/json',
        };

  /// Add authentication token to headers
  void setAuthToken(String token) {
    defaultHeaders['Authorization'] = 'Bearer $token';
  }

  /// Remove authentication token
  void clearAuthToken() {
    defaultHeaders.remove('Authorization');
  }

  /// GET request
  Future<ApiResponse<T>> get<T>(
    String endpoint, {
    Map<String, String>? queryParams,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    try {
      var uri = Uri.parse('$baseUrl$endpoint');
      if (queryParams != null) {
        uri = uri.replace(queryParameters: queryParams);
      }

      final response = await http.get(uri, headers: defaultHeaders);

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse<T>.error('Network error: $e');
    }
  }

  /// POST request
  Future<ApiResponse<T>> post<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      final response = await http.post(
        uri,
        headers: defaultHeaders,
        body: body != null ? jsonEncode(body) : null,
      );

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse<T>.error('Network error: $e');
    }
  }

  /// PUT request
  Future<ApiResponse<T>> put<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      final response = await http.put(
        uri,
        headers: defaultHeaders,
        body: body != null ? jsonEncode(body) : null,
      );

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse<T>.error('Network error: $e');
    }
  }

  /// DELETE request
  Future<ApiResponse<T>> delete<T>(
    String endpoint, {
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      final response = await http.delete(uri, headers: defaultHeaders);

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse<T>.error('Network error: $e');
    }
  }

  ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>)? fromJson,
  ) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (fromJson != null && response.body.isNotEmpty) {
        try {
          final data = jsonDecode(response.body) as Map<String, dynamic>;
          return ApiResponse<T>.success(fromJson(data));
        } catch (e) {
          return ApiResponse<T>.error('Failed to parse response: $e');
        }
      }
      return ApiResponse<T>.success(null as T);
    } else {
      return ApiResponse<T>.error(
        'Request failed with status ${response.statusCode}: ${response.body}',
      );
    }
  }
}

/// API Response wrapper
class ApiResponse<T> {
  final T? data;
  final String? error;
  final bool isSuccess;

  ApiResponse.success(this.data)
      : error = null,
        isSuccess = true;

  ApiResponse.error(this.error)
      : data = null,
        isSuccess = false;
}
