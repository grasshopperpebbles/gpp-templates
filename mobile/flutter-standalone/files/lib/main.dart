import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // TODO: Initialize local database
  // TODO: Set up error handling

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}
