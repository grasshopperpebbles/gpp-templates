# Flutter Standalone Template

This template provides a standalone Flutter mobile app that works independently without an API backend.

## Features

- **State Management**: Riverpod for reactive state management
- **Local Database**: SQLite with sqflite for data persistence
- **Offline-First**: All data stored locally
- **JSON Serialization**: Code generation with json_serializable

## Project Structure

```
lib/
├── app/
│   └── app.dart          # Main app widget
├── core/
│   └── database/         # Database helper
│       └── database_helper.dart
├── features/             # Feature modules (add your features here)
└── main.dart             # App entry point
```

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

3. **Set up database schema (optional - only if you need local SQLite storage):**
   - The `DatabaseHelper` class is provided but currently has no tables defined
   - If you need local database storage, edit `lib/core/database/database_helper.dart`
   - Uncomment and modify the example in `_onCreate()` method to create your tables
   - Example:
     ```dart
     await db.execute('''
       CREATE TABLE items (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT NOT NULL,
         created_at INTEGER NOT NULL
       )
     ''');
     ```
   - **If you don't need local storage, you can ignore this file entirely**

4. **Run code generation (only if using json_serializable):**
   ```bash
   flutter pub run build_runner build
   ```

## Usage

### Database (Optional - only if you set up tables)

If you've configured tables in `database_helper.dart`:

```dart
final db = DatabaseHelper();
final database = await db.database;

// Create records
await database.insert('items', {
  'name': 'Item name',
  'created_at': DateTime.now().millisecondsSinceEpoch,
});

// Query records
final results = await database.query('items');

// Update records
await database.update(
  'items',
  {'name': 'Updated name'},
  where: 'id = ?',
  whereArgs: [1],
);

// Delete records
await database.delete('items', where: 'id = ?', whereArgs: [1]);
```

**Note:** The database helper is provided as a utility. If you don't need local SQLite storage, you can ignore it entirely.

## Next Steps

1. **Update project name in `pubspec.yaml` (optional):**
   - Change `name: mobile_app` to your desired package name
   - Update import statements in test files if you change the name

2. **Start building your app:**
   - Add your feature modules in `lib/features/`
   - Implement data models with json_serializable if needed
   - Set up Riverpod providers for state management
   - Add data export/import functionality if needed
