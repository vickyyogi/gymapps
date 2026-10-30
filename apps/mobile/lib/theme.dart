import 'package:flutter/material.dart';

// MiniDash design tokens — docs/DESIGN.md
abstract final class MiniDash {
  static const primary = Color(0xFF6366F1);
  static const secondary = Color(0xFF14B8A6);
  static const tertiary = Color(0xFFF59E0B);
  static const background = Color(0xFFF3F4F6);
  static const surface = Color(0xFFFFFFFF);
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);

  static const gap = 8.0; // widget grid gap
  static const pad = 12.0; // default component padding
  static const radius = 8.0; // Medium: cards, inputs, buttons
  static const radiusLarge = 12.0; // modals
}

ThemeData miniDashTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: MiniDash.primary,
    surface: MiniDash.surface,
    error: MiniDash.error,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: MiniDash.background,
    cardTheme: const CardThemeData(
      color: MiniDash.surface,
      elevation: 1,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(MiniDash.radius)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: MiniDash.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MiniDash.radius),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(44),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(MiniDash.radius),
        ),
      ),
    ),
  );
}
