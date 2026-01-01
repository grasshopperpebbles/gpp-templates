import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';

/// DatabaseHelper - Singleton class for managing SQLite database
///
/// Handles database initialization, schema versioning, and migrations.
/// Provides access to the database instance for repositories.
class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  static Database? _database;

  // Current schema version
  static const int _databaseVersion = 1;
  static String _databaseName = 'app.db';

  factory DatabaseHelper() {
    return _instance;
  }

  DatabaseHelper._internal();

  /// Set custom database name (for testing)
  static void setDatabaseName(String name) {
    _databaseName = name;
    _database = null; // Force re-initialization
  }

  /// Get database instance (creates if doesn't exist)
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  /// Initialize database
  Future<Database> _initDatabase() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, _databaseName);

    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  /// Create database schema
  Future<void> _onCreate(Database db, int version) async {
    // TODO: Create your tables here
    // Example:
    // await db.execute('''
    //   CREATE TABLE items (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     name TEXT NOT NULL,
    //     created_at INTEGER NOT NULL
    //   )
    // ''');
  }

  /// Handle database migrations
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // TODO: Implement migrations as needed
    // Example:
    // if (oldVersion < 2) {
    //   await db.execute('ALTER TABLE items ADD COLUMN description TEXT');
    // }
  }

  /// Close database connection
  Future<void> close() async {
    final db = await database;
    await db.close();
    _database = null;
  }
}
