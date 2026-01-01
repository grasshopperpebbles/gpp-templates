/// App Configuration
/// 
/// Centralized configuration for the app.
/// Can be extended to load from environment variables or config files.
class AppConfig {
  // API Configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.example.com',
  );

  // App Configuration
  static const String appName = 'Flutter App';
  static const String appVersion = '1.0.0';

  // Environment
  static const bool isProduction = bool.fromEnvironment('PRODUCTION', defaultValue: false);
  static const bool isDevelopment = !isProduction;

  /// Get API base URL
  /// 
  /// Priority:
  /// 1. Environment variable API_BASE_URL
  /// 2. Default value
  static String getApiBaseUrl() {
    return apiBaseUrl;
  }
}
