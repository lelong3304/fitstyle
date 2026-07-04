import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'premium_screen.dart';

class MealPlanScreen extends StatefulWidget {
  final bool isPremium;

  const MealPlanScreen({super.key, required this.isPremium});

  @override
  State<MealPlanScreen> createState() => _MealPlanScreenState();
}

class _MealPlanScreenState extends State<MealPlanScreen> {
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _mealPlan;
  int _activeWeek = 1;
  int _selectedDay = 1;

  @override
  void initState() {
    super.initState();
    if (widget.isPremium) {
      _loadMealPlan();
    }
  }

  Future<void> _loadMealPlan() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await ApiService.getMealPlan();

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (result.isSuccess) {
        _mealPlan = result.data?['mealPlan'] as Map<String, dynamic>?;
        if (_mealPlan != null) {
          final days = _mealPlan!['days'] as List?;
          if (days != null && days.isNotEmpty) {
            _selectedDay = days.first['day'] as int? ?? 1;
            _activeWeek = ((_selectedDay - 1) ~/ 7) + 1;
          }
        }
      } else {
        _error = result.errorMessage;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgBody,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('Thực đơn 30 ngày', style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        centerTitle: true,
      ),
      body: !widget.isPremium ? _buildPremiumLockView() : _buildMealPlanContent(),
    );
  }

  Widget _buildPremiumLockView() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.restaurant_menu, color: AppColors.warning, size: 48),
              ),
              const SizedBox(height: 20),
              Text(
                'Tính năng Premium ✨',
                style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.warning),
              ),
              const SizedBox(height: 12),
              Text(
                'Lịch ăn uống 30 ngày được thiết kế riêng theo lượng calo mục tiêu (Tăng/Giảm/Duy trì cân nặng) từ kết quả phân tích dáng người của bạn.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 24),
              GradientButton(
                text: 'Nâng cấp Premium ngay',
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (_) => const PremiumScreen()),
                  );
                },
                gradient: AppColors.gradientPremium,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMealPlanContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
            const SizedBox(height: 12),
            Text(_error ?? 'Đã xảy ra lỗi', style: GoogleFonts.inter(color: AppColors.danger)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadMealPlan, child: const Text('Thử lại')),
          ],
        ),
      );
    }

    if (_mealPlan == null) {
      return const Center(child: Text('Không tìm thấy dữ liệu thực đơn.'));
    }

    final targetCalories = _mealPlan!['targetCalories'] ?? '--';
    final direction = _mealPlan!['direction'] ?? '';
    final isCustom = _mealPlan!['generatedFromLatestAnalysis'] == true;
    final days = (_mealPlan!['days'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    final activeDayObj = days.firstWhere(
      (d) => d['day'] == _selectedDay,
      orElse: () => days.isNotEmpty ? days.first : {},
    );

    return Column(
      children: [
        // Top overview bar
        Container(
          width: double.infinity,
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderDefault),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.local_fire_department, color: AppColors.primaryLight, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Mục tiêu: $targetCalories kcal/ngày',
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      direction,
                      style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isCustom ? AppColors.health.withValues(alpha: 0.15) : AppColors.bgCardElevated,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isCustom ? 'Cá nhân hóa' : 'Thực đơn mẫu',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isCustom ? AppColors.health : AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Week tabs selector
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: SizedBox(
            height: 38,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 5,
              itemBuilder: (context, index) {
                final w = index + 1;
                final startDay = (w - 1) * 7 + 1;
                final endDay = w * 7 > 30 ? 30 : w * 7;
                final isActive = _activeWeek == w;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _activeWeek = w;
                        _selectedDay = startDay;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: isActive ? AppColors.gradientPrimary : null,
                        color: isActive ? null : AppColors.bgCard,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: isActive ? Colors.transparent : AppColors.borderDefault),
                      ),
                      child: Text(
                        'Tuần $w ($startDay-$endDay)',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isActive ? Colors.white : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),

        // Day numbers horizontal view
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: SizedBox(
            height: 62,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: days
                  .where((d) => d['day'] >= (_activeWeek - 1) * 7 + 1 && d['day'] <= _activeWeek * 7 && d['day'] <= 30)
                  .map((d) {
                final dayNum = d['day'] as int? ?? 1;
                final calories = d['calories'] ?? '';
                final isSelected = _selectedDay == dayNum;
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedDay = dayNum),
                    child: Container(
                      width: 72,
                      decoration: BoxDecoration(
                        gradient: isSelected ? AppColors.gradientPremium : null,
                        color: isSelected ? null : AppColors.bgCard,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isSelected ? Colors.transparent : AppColors.borderDefault),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Ngày $dayNum',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$calories kcal',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              color: isSelected ? Colors.white70 : AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        // Active day meals details
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Thực đơn Ngày $_selectedDay',
                      style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                    if (activeDayObj['calories'] != null)
                      Text(
                        'Tổng: ${activeDayObj['calories']} kcal',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.warning),
                      ),
                  ],
                ),
                if (activeDayObj['focus'] != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    '🎯 Tiêu điểm: ${activeDayObj['focus']}',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic),
                  ),
                ],
                const SizedBox(height: 16),

                _buildMealCard('Bữa sáng', activeDayObj['breakfast'] as String?, '🌅'),
                const SizedBox(height: 12),
                _buildMealCard('Bữa trưa', activeDayObj['lunch'] as String?, '☀️'),
                const SizedBox(height: 12),
                _buildMealCard('Bữa tối', activeDayObj['dinner'] as String?, '🌆'),
                const SizedBox(height: 12),
                _buildMealCard('Bữa phụ', activeDayObj['snack'] as String?, '🍎'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMealCard(String mealTitle, String? mealText, String icon) {
    if (mealText == null || mealText.trim().isEmpty) return const SizedBox.shrink();

    final parts = mealText.split(':');
    final header = parts[0];
    final desc = parts.sublist(1).join(':').trim();

    // Clean up calories label
    final calBadge = header.replaceFirst(RegExp('$mealTitle\\s+khoảng\\s+'), '').replaceFirst('Bữa phụ khoảng ', '').trim();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(icon, style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 8),
                  Text(mealTitle, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.bgCardElevated,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  calBadge,
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.warning),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            desc,
            style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
          ),
        ],
      ),
    );
  }
}
