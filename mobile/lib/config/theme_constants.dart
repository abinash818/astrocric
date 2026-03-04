import 'package:flutter/material.dart';

class AppTheme {
  // Divine Colors
  static const Color primaryGold = Color(0xFFD4AF37);
  static const Color darkGold = Color(0xFFB8860B);
  static const Color deepBlue = Color(0xFF0038A8);
  static const Color softBlue = Color(0xFFE3F2FD);
  static const Color divineCream = Color(0xFFFEF9E7);
  static const Color warmWhite = Color(0xFFFAFAFA);
  
  // Text Colors
  static const Color textMain = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF757575);
  
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: deepBlue,
        primary: deepBlue,
        secondary: primaryGold,
        surface: divineCream,
      ),
      scaffoldBackgroundColor: warmWhite,
      appBarTheme: const AppBarTheme(
        backgroundColor: deepBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      // cardTheme: CardTheme(
      //   color: Colors.white,
      //   elevation: 4,
      //   shadowColor: primaryGold.withOpacity(0.1),
      //   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      // ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryGold,
          foregroundColor: Colors.black,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          elevation: 2,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: deepBlue,
          side: const BorderSide(color: primaryGold, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide(color: primaryGold.withOpacity(0.3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide(color: primaryGold.withOpacity(0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: primaryGold, width: 2),
        ),
        labelStyle: const TextStyle(color: deepBlue),
      ),
    );
  }

  // Soft Page Transitions
  static PageRouteBuilder smoothRoute(Widget page) {
    return PageRouteBuilder(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        const begin = Offset(0.0, 0.05); // Subtle lift
        const end = Offset.zero;
        final curve = CurveTween(curve: Curves.easeOutCubic);
        final opacity = CurveTween(curve: Curves.easeIn);

        return FadeTransition(
          opacity: animation.drive(opacity),
          child: SlideTransition(
            position: animation.drive(Tween(begin: begin, end: end).chain(curve)),
            child: child,
          ),
        );
      },
      transitionDuration: const Duration(milliseconds: 400),
    );
  }
}
