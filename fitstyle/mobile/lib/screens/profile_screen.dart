import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const ProfileScreen({super.key, required this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _profileFormKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _emailController;
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isProfileLoading = false;
  bool _isPasswordLoading = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  late Map<String, dynamic> _currentUser;

  @override
  void initState() {
    super.initState();
    _currentUser = Map<String, dynamic>.from(widget.user);
    _nameController = TextEditingController(text: _currentUser['name']);
    _emailController = TextEditingController(text: _currentUser['email']);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleUpdateProfile() async {
    if (!_profileFormKey.currentState!.validate()) return;

    setState(() => _isProfileLoading = true);

    final result = await ApiService.updateProfile(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
    );

    if (!mounted) return;

    setState(() => _isProfileLoading = false);

    if (result.isSuccess) {
      setState(() {
        _currentUser = result.data?['user'] as Map<String, dynamic>;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cập nhật thông tin cá nhân thành công!'),
          backgroundColor: AppColors.health,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.errorMessage ?? 'Không thể cập nhật hồ sơ.'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  Future<void> _handleUpdatePassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;

    setState(() => _isPasswordLoading = true);

    final result = await ApiService.updatePassword(
      currentPassword: _currentPasswordController.text,
      newPassword: _newPasswordController.text,
    );

    if (!mounted) return;

    setState(() => _isPasswordLoading = false);

    if (result.isSuccess) {
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đổi mật khẩu thành công!'),
          backgroundColor: AppColors.health,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.errorMessage ?? 'Đổi mật khẩu thất bại.'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  Future<void> _handleLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgCardElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Đăng xuất',
          style: GoogleFonts.montserrat(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        content: Text(
          'Bạn có chắc chắn muốn đăng xuất?',
          style: GoogleFonts.inter(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Hủy',
              style: GoogleFonts.inter(color: AppColors.textMuted),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Đăng xuất',
              style: GoogleFonts.inter(
                color: AppColors.danger,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );

    if (shouldLogout == true && mounted) {
      final navigator = Navigator.of(context);
      await ApiService.logout();
      navigator.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _currentUser['name'] ?? 'Người dùng';
    final isPremium = (_currentUser['plan'] ?? 'free') == 'premium';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        Navigator.of(context).pop(_currentUser);
      },
      child: Scaffold(
        backgroundColor: AppColors.bgBody,
        appBar: AppBar(
          backgroundColor: AppColors.bgBody,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
            onPressed: () => Navigator.of(context).pop(_currentUser),
          ),
          title: Text(
            'Hồ sơ cá nhân',
            style: GoogleFonts.montserrat(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAvatarSection(name, isPremium),
              const SizedBox(height: 28),
              _buildProfileEditSection(),
              const SizedBox(height: 24),
              _buildPasswordEditSection(),
              const SizedBox(height: 32),
              _buildLogoutButton(),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarSection(String name, bool isPremium) {
    return Center(
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: AppColors.gradientPrimary,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: GoogleFonts.montserrat(
                  fontSize: 34,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            name,
            style: GoogleFonts.montserrat(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              gradient: isPremium ? AppColors.gradientPremium : null,
              color: isPremium ? null : AppColors.bgCardElevated,
              borderRadius: BorderRadius.circular(8),
              border: isPremium ? null : Border.all(color: AppColors.borderDefault),
            ),
            child: Text(
              isPremium ? 'Premium ✨' : 'Tài khoản thường',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isPremium ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileEditSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Form(
        key: _profileFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thông tin cá nhân',
              style: GoogleFonts.montserrat(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'Họ và tên',
                prefixIcon: Icon(Icons.person_outline),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Vui lòng nhập họ tên.';
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'Email',
                prefixIcon: Icon(Icons.email_outlined),
                helperText: 'Lưu ý: Không đổi được email nếu có ràng buộc hệ thống.',
                helperStyle: TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Vui lòng nhập email.';
                if (!v.contains('@')) return 'Email không hợp lệ.';
                return null;
              },
            ),
            const SizedBox(height: 18),
            GradientButton(
              text: 'Lưu thay đổi',
              isLoading: _isProfileLoading,
              onPressed: _isProfileLoading ? null : _handleUpdateProfile,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordEditSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Form(
        key: _passwordFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Đổi mật khẩu',
              style: GoogleFonts.montserrat(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _currentPasswordController,
              obscureText: _obscureCurrent,
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Mật khẩu hiện tại',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(_obscureCurrent ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Nhập mật khẩu hiện tại.';
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _newPasswordController,
              obscureText: _obscureNew,
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Mật khẩu mới (tối thiểu 6 kí tự)',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(_obscureNew ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  onPressed: () => setState(() => _obscureNew = !_obscureNew),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Nhập mật khẩu mới.';
                if (v.length < 6) return 'Mật khẩu mới quá ngắn.';
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _confirmPasswordController,
              obscureText: _obscureConfirm,
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Xác nhận mật khẩu mới',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Xác nhận lại mật khẩu.';
                if (v != _newPasswordController.text) return 'Mật khẩu không khớp.';
                return null;
              },
            ),
            const SizedBox(height: 18),
            GradientButton(
              text: 'Đổi mật khẩu',
              isLoading: _isPasswordLoading,
              onPressed: _isPasswordLoading ? null : _handleUpdatePassword,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        onPressed: _handleLogout,
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.danger, width: 1.2),
          ),
          backgroundColor: AppColors.danger.withValues(alpha: 0.05),
        ),
        icon: const Icon(Icons.logout_rounded, color: AppColors.danger, size: 20),
        label: Text(
          'Đăng xuất khỏi ứng dụng',
          style: GoogleFonts.inter(
            color: AppColors.danger,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
