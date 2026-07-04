import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'premium_screen.dart';

class TryOnScreen extends StatefulWidget {
  static String? externalGarmentImageUrl;
  static String? externalProductName;

  const TryOnScreen({super.key});

  @override
  State<TryOnScreen> createState() => _TryOnScreenState();
}

class _TryOnScreenState extends State<TryOnScreen> {
  File? _personImage;
  File? _garmentImage;
  String? _garmentImageUrl;
  String? _garmentProductName;

  bool _removeBackground = false;
  bool _isLoading = false;
  Map<String, dynamic>? _result;
  String? _error;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _checkForExternalData();
  }

  void _checkForExternalData() {
    if (TryOnScreen.externalGarmentImageUrl != null) {
      setState(() {
        _garmentImageUrl = TryOnScreen.externalGarmentImageUrl;
        _garmentProductName = TryOnScreen.externalProductName;
        _garmentImage = null; // Clear file if URL is set
        _result = null; // Clear old result
      });
      // Clear static fields so they don't persist
      TryOnScreen.externalGarmentImageUrl = null;
      TryOnScreen.externalProductName = null;
    }
  }

  Future<void> _pickImage(bool isPerson) async {
    try {
      final picked = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1200, imageQuality: 85);
      if (picked != null && mounted) {
        setState(() {
          if (isPerson) {
            _personImage = File(picked.path);
          } else {
            _garmentImage = File(picked.path);
            _garmentImageUrl = null; // Clear web URL if user picks a local file
            _garmentProductName = null;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể mở thư viện ảnh: $e')),
        );
      }
    }
  }

  Future<void> _handleTryOn() async {
    if (_personImage == null && _garmentImage == null && _garmentImageUrl == null) {
      setState(() => _error = 'Vui lòng chọn ảnh người mẫu và ảnh quần áo.');
      return;
    }
    setState(() { _isLoading = true; _error = null; _result = null; });

    final result = await ApiService.tryOn(
      personImage: _personImage,
      garmentImage: _garmentImage,
      garmentImageUrl: _garmentImageUrl,
      removeBackground: _removeBackground,
    );

    if (!mounted) return;
    setState(() { _isLoading = false; });

    if (result.isSuccess) {
      setState(() => _result = result.data);
    } else {
      if (result.statusCode == 403 || (result.errorMessage?.contains('Premium') ?? false)) {
        _showPremiumRequired();
      } else {
        setState(() => _error = result.errorMessage);
      }
    }
  }

  void _showPremiumRequired() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(children: [
          const Icon(Icons.workspace_premium_rounded, color: AppColors.warning, size: 24),
          const SizedBox(width: 8),
          Text('Cần Premium', style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ]),
        content: Text(
          'Bạn đã hết lượt phối đồ miễn phí. Nâng cấp Premium để tiếp tục sử dụng không giới hạn!',
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Đóng', style: GoogleFonts.inter(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const PremiumScreen()));
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning, foregroundColor: Colors.white),
            child: Text('Nâng cấp', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // If external data is set dynamically while TryOnScreen is active, check and update
    _checkForExternalData();

    if (_result != null) return _buildResultView();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Phối đồ ảo AI', style: GoogleFonts.montserrat(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          const SizedBox(height: 6),
          Text('Tải ảnh của bạn và quần áo để AI ghép đồ thử ảo.', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 24),

          if (_error != null) ...[
            _errorBanner(_error!),
            const SizedBox(height: 16),
          ],

          // Person image
          _imageCard('Ảnh người mẫu', 'Ảnh chụp toàn thân, nền đơn giản', _personImage, null, () => _pickImage(true)),
          const SizedBox(height: 16),

          // Garment image
          _imageCard(
            _garmentProductName ?? 'Ảnh quần áo',
            'Ảnh sản phẩm quần áo muốn thử',
            _garmentImage,
            _garmentImageUrl,
            () => _pickImage(false),
          ),
          const SizedBox(height: 20),

          // Options
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.borderDefault)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Xóa nền ảnh quần áo', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
                Switch(
                  value: _removeBackground,
                  onChanged: (v) => setState(() => _removeBackground = v),
                  activeThumbColor: AppColors.primaryLight,
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          GradientButton(
            text: _isLoading ? 'AI đang xử lý...' : 'Bắt đầu phối đồ',
            isLoading: _isLoading,
            onPressed: _isLoading ? null : _handleTryOn,
          ),
          const SizedBox(height: 12),
          Center(
            child: Text('⏳ Quá trình xử lý có thể mất 30-60 giây', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
          ),
        ],
      ),
    );
  }

  Widget _imageCard(String title, String subtitle, File? imageFile, String? imageUrl, VoidCallback onTap) {
    final hasImage = imageFile != null || imageUrl != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: hasImage ? AppColors.primary.withValues(alpha: 0.4) : AppColors.borderDefault),
        ),
        child: Column(
          children: [
            if (imageFile != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(imageFile, height: 180, width: double.infinity, fit: BoxFit.cover),
              ),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.check_circle, color: AppColors.health, size: 16),
                const SizedBox(width: 6),
                Text('Đã chọn ảnh · Nhấn để đổi', style: GoogleFonts.inter(fontSize: 12, color: AppColors.health)),
              ]),
            ] else if (imageUrl != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(imageUrl, height: 180, width: double.infinity, fit: BoxFit.cover),
              ),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.auto_awesome, color: AppColors.warning, size: 16),
                const SizedBox(width: 6),
                Text('Sản phẩm gợi ý · Nhấn để đổi', style: GoogleFonts.inter(fontSize: 12, color: AppColors.warning)),
              ]),
            ] else ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.bgCardElevated, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.add_a_photo_outlined, color: AppColors.primaryLight, size: 32),
              ),
              const SizedBox(height: 12),
              Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              const SizedBox(height: 4),
              Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(height: 16),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResultView() {
    final outputUrl = _result?['output_url'] ?? _result?['outputUrl'] ?? _result?['result']?['output_url'];
    final plan = _result?['plan'] as Map<String, dynamic>?;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
              onPressed: () => setState(() {
                _result = null;
                _personImage = null;
                _garmentImage = null;
                _garmentImageUrl = null;
                _garmentProductName = null;
              }),
            ),
            const SizedBox(width: 4),
            Text('Kết quả phối đồ', style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          ]),
          const SizedBox(height: 20),

          if (outputUrl != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                outputUrl,
                width: double.infinity,
                fit: BoxFit.contain,
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return Container(
                    height: 300,
                    alignment: Alignment.center,
                    child: const CircularProgressIndicator(color: AppColors.primary),
                  );
                },
                errorBuilder: (_, __, ___) => Container(
                  height: 200,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(16)),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.broken_image, color: AppColors.textMuted, size: 40),
                    const SizedBox(height: 8),
                    Text('Không thể tải ảnh', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                  ]),
                ),
              ),
            ),
          ] else ...[
            Container(
              height: 200,
              width: double.infinity,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(16)),
              child: Text('Đang chờ kết quả...', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
            ),
          ],
          const SizedBox(height: 16),

          if (plan != null)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.borderDefault)),
              child: Row(children: [
                const Icon(Icons.auto_awesome, color: AppColors.warning, size: 18),
                const SizedBox(width: 10),
                Expanded(child: Text(
                  'Còn ${plan['tryOnRemaining'] ?? '?'} lượt phối đồ',
                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary),
                )),
              ]),
            ),
          const SizedBox(height: 24),

          GradientButton(
            text: 'Phối đồ khác',
            onPressed: () => setState(() {
              _result = null;
              _personImage = null;
              _garmentImage = null;
              _garmentImageUrl = null;
              _garmentProductName = null;
            }),
          ),
        ],
      ),
    );
  }

  Widget _errorBanner(String msg) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.danger.withValues(alpha: 0.25))),
    child: Row(children: [
      const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
      const SizedBox(width: 10),
      Expanded(child: Text(msg, style: GoogleFonts.inter(fontSize: 13, color: AppColors.danger))),
    ]),
  );
}
