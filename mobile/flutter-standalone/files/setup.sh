#!/bin/bash
# Flutter Standalone Setup Script
# Run this after scaffolding to complete setup

set -e

echo "🚀 Setting up Flutter Standalone..."

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

# 3. Run code generation (if json_serializable is used)
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
echo "  1. Configure database schema in lib/core/database/database_helper.dart (if needed)"
echo "  2. Start building your features in lib/features/"
