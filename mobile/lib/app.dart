import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'config/theme_constants.dart';

class AstrocricApp extends StatelessWidget {
  const AstrocricApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) {
            final auth = AuthProvider();
            auth.init();
            return auth;
          },
        ),
      ],
      child: MaterialApp(
        title: 'Astrocric',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            print('App: Auth State Changed - isLoading: ${authProvider.isLoading}, isAuthenticated: ${authProvider.isAuthenticated}');
            if (authProvider.isLoading) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }

            return authProvider.isAuthenticated
                ? const HomeScreen()
                : const LoginScreen();
          },
        ),
      ),
    );
  }
}
