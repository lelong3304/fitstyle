import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'services/storage_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Thanh trạng thái trong suốt để hòa vào nền tối
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AppColors.bgBody,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  runApp(const FitStyleApp());
}

class FitStyleApp extends StatelessWidget {
  const FitStyleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FitStyle AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const AuthGate(),
    );
  }
}

/// AuthGate kiểm tra trạng thái đăng nhập khi khởi động ứng dụng.
///
/// - Nếu đã có JWT token hợp lệ → vào thẳng HomeScreen (auto-login).
/// - Nếu chưa hoặc token hết hạn → đưa về LoginScreen.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _checking = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final hasToken = await StorageService.hasToken();

    if (!hasToken) {
      if (mounted) setState(() { _checking = false; _isLoggedIn = false; });
      return;
    }

    // Token tồn tại → gọi API /auth/me để xác thực token còn hợp lệ không
    final result = await ApiService.getMe();

    if (mounted) {
      setState(() {
        _checking = false;
        _isLoggedIn = result.isSuccess;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              SizedBox(height: 20),
              Text(
                'Đang tải...',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return _isLoggedIn ? const HomeScreen() : const LoginScreen();
  }
}
