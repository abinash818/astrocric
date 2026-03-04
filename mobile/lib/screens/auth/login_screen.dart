import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme_constants.dart';
import 'signup_screen.dart';
import 'reset_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showError('Please enter both email and password');
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final error = await authProvider.loginWithEmail(email, password);
    if (error != null) _showError(error);
  }

  Future<void> _handleGoogleSignIn() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final error = await authProvider.loginWithGoogle();
    if (error != null && error != 'Google sign in cancelled') {
      _showError(error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.divineCream,
      body: Stack(
        children: [
          // Background soft circles
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryGold.withOpacity(0.05),
              ),
            ),
          ),
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 30),
                    _buildLogo(),
                    const SizedBox(height: 16),
                    _buildTitle(),
                    const SizedBox(height: 60),
                    _buildFormCard(),
                    const SizedBox(height: 32),
                    _buildFooter(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: AppTheme.primaryGold, width: 2),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryGold.withOpacity(0.2),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
        ),
        child: ClipOval(
          child: Image.asset(
            'assets/images/logo.png',
            width: 140,
            height: 140,
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }

  Widget _buildTitle() {
    return Column(
      children: [
        const Text(
          'S&B ASTRO',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w900,
            color: AppTheme.deepBlue,
            letterSpacing: 2,
          ),
        ),
        const Text(
          'DIVINE GUIDANCE',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppTheme.primaryGold,
            letterSpacing: 3,
          ),
        ),
      ],
    );
  }

  Widget _buildFormCard() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepBlue.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'Welcome Back',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.deepBlue,
            ),
          ),
          const SizedBox(height: 30),
          _buildTextField(
            controller: _emailController,
            label: 'Email Address',
            icon: Icons.alternate_email_rounded,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 20),
          _buildTextField(
            controller: _passwordController,
            label: 'Password',
            icon: Icons.lock_outline_rounded,
            isPassword: true,
            obscureText: _obscurePassword,
            onToggle: () => setState(() => _obscurePassword = !_obscurePassword),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => Navigator.push(context, AppTheme.smoothRoute(const ResetPasswordScreen())),
              child: const Text('Forgot Password?', style: TextStyle(color: AppTheme.deepBlue, fontSize: 13)),
            ),
          ),
          const SizedBox(height: 20),
          _buildPrimaryButton(),
          const SizedBox(height: 24),
          _buildDivider(),
          const SizedBox(height: 24),
          _buildGoogleButton(),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggle,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      obscureText: isPassword && obscureText,
      keyboardType: keyboardType,
      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20, color: AppTheme.deepBlue.withOpacity(0.7)),
        suffixIcon: isPassword
            ? IconButton(
                icon: Icon(obscureText ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18),
                onPressed: onToggle,
              )
            : null,
      ),
    );
  }

  Widget _buildPrimaryButton() {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        return SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: auth.isLoading ? null : _handleLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.deepBlue,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
            ),
            child: auth.isLoading
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('LOGIN', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
          ),
        );
      }
    );
  }

  Widget _buildGoogleButton() {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        return SizedBox(
          width: double.infinity,
          height: 56,
          child: OutlinedButton.icon(
            onPressed: auth.isLoading ? null : _handleGoogleSignIn,
            icon: Image.network('https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png', width: 24),
            label: const Text('SIGN IN WITH GOOGLE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.deepBlue,
              side: BorderSide(color: AppTheme.primaryGold.withOpacity(0.5)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        );
      }
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Divider(color: Colors.grey.withOpacity(0.3))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text('OR', style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.bold)),
        ),
        Expanded(child: Divider(color: Colors.grey.withOpacity(0.3))),
      ],
    );
  }

  Widget _buildFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text('New here?', style: TextStyle(color: AppTheme.textSecondary)),
        TextButton(
          onPressed: () => Navigator.push(context, AppTheme.smoothRoute(const SignupScreen())),
          child: const Text('CREATE ACCOUNT', style: TextStyle(color: AppTheme.primaryGold, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
