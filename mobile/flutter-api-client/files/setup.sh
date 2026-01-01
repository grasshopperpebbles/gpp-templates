#!/bin/bash
# Flutter API Client Setup Script
# Run this after scaffolding to complete setup

set -e

echo "🚀 Setting up Flutter API Client..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
flutter pub get

# 2. Generate platform folders (if needed)
if [ ! -d "android" ] || [ ! -d "ios" ] || [ ! -d "web" ]; then
  echo "📱 Generating platform folders..."
  flutter create --platforms=android,ios,web .
else
  echo "✅ Platform folders already exist"
fi

# 3. Check if API base URL needs configuration
if grep -q "https://api.example.com" lib/core/api/api_client.dart; then
  echo "⚠️  API base URL not configured!"
  echo "   Please update lib/core/api/api_client.dart with your API base URL"
  echo "   Or set FLUTTER_API_BASE_URL environment variable"
fi

# 4. Run code generation (if json_serializable is used)
if grep -q "@JsonSerializable" lib/**/*.dart 2>/dev/null || [ -f "lib/core/models" ]; then
  echo "🔨 Running code generation..."
  flutter pub run build_runner build --delete-conflicting-outputs
else
  echo "ℹ️  No json_serializable models found, skipping code generation"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update lib/core/api/api_client.dart with your API base URL"
echo "  2. Configure database schema in lib/core/database/database_helper.dart (if needed)"
echo "  3. Start building your features in lib/features/"
