import 'dart:ui' show PointMode;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'register_screen.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() { _isLoading = true; _errorMessage = null; });

    final result = await ApiService.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    if (result.isSuccess) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      setState(() { _isLoading = false; _errorMessage = result.errorMessage; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgBody,
      body: Stack(
        children: [
          // ── Soft background ambient glow ──
          Positioned(
            top: -150,
            left: 0,
            right: 0,
            child: Container(
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.12),
                    Colors.transparent,
                  ],
                  radius: 0.8,
                ),
              ),
            ),
          ),
          // ── Premium Dot Matrix pattern ──
          Positioned.fill(
            child: CustomPaint(
              painter: DottedBackgroundPainter(),
            ),
          ),
          // ── Form Content ──
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(height: 20),
                        _buildLogo(),
                        const SizedBox(height: 8),
                        _buildSubtitle(),
                        const SizedBox(height: 36),
                        _buildForm(),
                        const SizedBox(height: 32),
                        _buildRegisterLink(),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo() {
    return Column(
      children: [
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            color: const Color(0xFFEFF0EB), // Cream background matching the logo's native color
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.borderDefault, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.45),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(21),
            child: Image.asset(
              'assets/logo.jpg',
              fit: BoxFit.cover,
            ),
          ),
        ),
        const SizedBox(height: 18),
        ShaderMask(
          shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
          child: Text(
            'FitStyle AI',
            style: GoogleFonts.montserrat(
              fontSize: 30, fontWeight: FontWeight.w800,
              color: Colors.white, letterSpacing: -0.5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubtitle() {
    return Text(
      'Đăng nhập để tiếp tục',
      style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted),
    );
  }

  Widget _buildForm() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.danger.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.danger.withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(_errorMessage!,
                        style: GoogleFonts.inter(fontSize: 13, color: AppColors.danger),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
            ],

            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 15),
              decoration: const InputDecoration(
                hintText: 'Email',
                prefixIcon: Icon(Icons.email_outlined),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Vui lòng nhập email.';
                if (!v.contains('@') || !v.contains('.')) return 'Email không hợp lệ.';
                return null;
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _handleLogin(),
              style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 15),
              decoration: InputDecoration(
                hintText: 'Mật khẩu',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Vui lòng nhập mật khẩu.';
                if (v.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
                return null;
              },
            ),
            const SizedBox(height: 24),

            GradientButton(
              text: 'Đăng nhập',
              isLoading: _isLoading,
              onPressed: _isLoading ? null : _handleLogin,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegisterLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('Chưa có tài khoản? ',
          style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 14),
        ),
        GestureDetector(
          onTap: () => Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const RegisterScreen()),
          ),
          child: Text('Đăng ký ngay',
            style: GoogleFonts.inter(color: AppColors.textLink, fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

/// Dải họa tiết chấm Dot Matrix tinh tế làm đẹp background
class DottedBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.03) // Very soft dot color to fit the dark aesthetic
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    const double spacing = 24.0;
    for (double x = spacing / 2; x < size.width; x += spacing) {
      for (double y = spacing / 2; y < size.height; y += spacing) {
        canvas.drawPoints(PointMode.points, [Offset(x, y)], paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
