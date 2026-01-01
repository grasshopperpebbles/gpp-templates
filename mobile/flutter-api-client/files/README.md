# Flutter API Client Template

This template provides a Flutter mobile app that connects to an API backend.

## Features

- **HTTP Client**: Configured with `http` package (can be upgraded to `dio`)
- **State Management**: Riverpod for reactive state management
- **Local Database**: SQLite with sqflite for offline data storage
- **API Service Layer**: Base classes for API communication
- **Error Handling**: Structured error handling patterns
- **JSON Serialization**: Code generation with json_serializable
- **Configuration**: Centralized app config with environment variable support

## Quick Start

### Automated Setup (Recommended)

After scaffolding, run the setup script:

```bash
cd apps/mobile
chmod +x setup.sh
./setup.sh
```

This will:
- ✅ Install dependencies (`flutter pub get`)
- ✅ Generate platform folders (android/, ios/, web/)
- ✅ Run code generation (if needed)
- ⚠️  Remind you to configure API base URL

### Manual Setup

If you prefer to set up manually:

1. **Install dependencies:**
   ```bash
   flutter pub get
   ```

2. **Generate platform folders (if you need Android/iOS/Web builds):**
   ```bash
   flutter create --platforms=android,ios,web .
   ```

3. **Configure API base URL:**
   - **Option 1 (Recommended):** Use environment variable
     ```bash
     flutter run --dart-define=API_BASE_URL=https://api.yoursite.com
     ```
   - **Option 2:** Update `lib/core/config/app_config.dart`
     ```dart
     static const String apiBaseUrl = 'https://api.yoursite.com';
     ```
   - **Option 3:** Pass directly to ApiClient
     ```dart
     final apiClient = ApiClient(baseUrl: 'https://api.yoursite.com');
     ```

4. **Set up database schema (optional - only if you need local SQLite storage):**
   - Edit `lib/core/database/database_helper.dart`
   - Uncomment and modify the example in `_onCreate()` method to create your tables

5. **Run code generation (only if using json_serializable):**
   ```bash
   flutter pub run build_runner build
   ```

## Project Structure

```
lib/
├── app/
│   └── app.dart              # Main app widget
├── core/
│   ├── api/                  # API client and services
│   │   ├── api_client.dart
│   │   └── api_service.dart
│   ├── config/               # App configuration
│   │   └── app_config.dart
│   └── database/             # Database helper
│       └── database_helper.dart
├── features/                 # Feature modules (add your features here)
└── main.dart                 # App entry point
```

## Usage

### API Client

The API client is pre-configured to use `AppConfig` for the base URL:

```dart
// Uses base URL from AppConfig (or environment variable)
final apiClient = ApiClient();

// Or override with custom URL
final apiClient = ApiClient(baseUrl: 'https://custom-api.com');

// Add authentication
apiClient.setAuthToken('your-token');

// Make requests
final response = await apiClient.get('/users/1');
if (response.isSuccess) {
  print(response.data);
} else {
  print('Error: ${response.error}');
}
```

### Configuration

Configure API base URL via environment variable:

```bash
# Development
flutter run --dart-define=API_BASE_URL=http://localhost:8000

# Production
flutter run --dart-define=API_BASE_URL=https://api.production.com --dart-define=PRODUCTION=true
```

Or update `lib/core/config/app_config.dart` directly.

### Database (Optional - only if you set up tables)

If you've configured tables in `database_helper.dart`:

```dart
final db = DatabaseHelper();
final database = await db.database;

// Use database for queries
final results = await database.query('items');
```

**Note:** The database helper is provided as a utility. If you don't need local SQLite storage, you can ignore it entirely.

## Next Steps

1. **Update project name in `pubspec.yaml` (optional):**
   - Change `name: mobile_app` to your desired package name
   - Update import statements in test files if you change the name

2. **Start building your app:**
   - Add your feature modules in `lib/features/`
   - Implement API services extending `ApiService` (see Usage section above)
   - Set up authentication flow if needed
   - Add error handling and retry logic
   - Configure environment variables for different builds (dev/staging/prod)
