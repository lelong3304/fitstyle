import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import 'meal_plan_screen.dart';
import 'premium_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<dynamic> _analyses = [];
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _detail;
  Map<String, dynamic>? _mealPlan;
  bool _isPremium = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() { _isLoading = true; _error = null; });
    final result = await ApiService.getAnalyses();
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (result.isSuccess) {
        _analyses = (result.data?['analyses'] as List?) ?? [];
      } else {
        _error = result.errorMessage;
      }
    });
  }

  Future<void> _loadDetail(String id) async {
    setState(() { _isLoading = true; _error = null; });
    final result = await ApiService.getAnalysisDetail(id);
    if (!mounted) return;

    if (result.isSuccess) {
      final user = await StorageService.getUser();
      final premium = user?['plan'] == 'premium';
      Map<String, dynamic>? mp;
      if (premium) {
        final mpResult = await ApiService.getMealPlan();
        if (mpResult.isSuccess) {
          mp = mpResult.data?['mealPlan'] as Map<String, dynamic>?;
        }
      }
      setState(() {
        _isPremium = premium;
        _mealPlan = mp;
        _detail = result.data;
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
        _error = result.errorMessage;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_detail != null) return _buildDetailView();

    return RefreshIndicator(
      onRefresh: _loadHistory,
      color: AppColors.primary,
      child: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? _buildErrorState()
              : _analyses.isEmpty
                  ? _buildEmptyState()
                  : _buildList(),
    );
  }

  Widget _buildList() {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      itemCount: _analyses.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text('Lịch sử phân tích', style: GoogleFonts.montserrat(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          );
        }
        final item = _analyses[index - 1] as Map<String, dynamic>;
        return _buildHistoryCard(item);
      },
    );
  }

  Widget _buildHistoryCard(Map<String, dynamic> item) {
    final summary = item['summary'] as Map<String, dynamic>? ?? {};
    final result = item['result'] as Map<String, dynamic>? ?? {};

    // Robust parsing for BMI
    dynamic bmiValue;
    String bmiLabel = '';
    if (summary.containsKey('bmi') && summary['bmi'] != null) {
      bmiValue = summary['bmi'];
    } else {
      final resBmi = result['metrics']?['bmi'] ?? result['bmi'];
      if (resBmi is Map) {
        bmiValue = resBmi['value'];
        bmiLabel = resBmi['label'] ?? '';
      } else {
        bmiValue = resBmi;
      }
    }

    if (bmiValue != null && bmiLabel.isEmpty) {
      final double val = double.tryParse(bmiValue.toString()) ?? 0.0;
      if (val < 18.5) {
        bmiLabel = 'Thiếu cân';
      } else if (val < 23.0) {
        bmiLabel = 'Bình thường';
      } else if (val < 25.0) {
        bmiLabel = 'Thừa cân';
      } else {
        bmiLabel = 'Béo phì';
      }
    }

    // Robust parsing for Body Shape
    String bodyShapeLabel = 'N/A';
    if (summary.containsKey('bodyShape') && summary['bodyShape'] != null) {
      bodyShapeLabel = summary['bodyShape'].toString();
    } else {
      final resShape = result['metrics']?['bodyShape'] ?? result['bodyShape'];
      if (resShape is Map) {
        bodyShapeLabel = resShape['label'] ?? 'N/A';
      } else if (resShape != null) {
        bodyShapeLabel = resShape.toString();
      }
    }

    final createdAt = item['createdAt'] as String? ?? '';
    final dateStr = createdAt.length >= 10 ? createdAt.substring(0, 10) : createdAt;
    final id = item['_id'] as String? ?? item['id'] as String? ?? '';

    return GestureDetector(
      onTap: () => _loadDetail(id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderDefault),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: AppColors.gradientPrimary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.analytics_outlined, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'BMI: ${_fmt(bmiValue)} — $bmiLabel',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Dáng: $bodyShapeLabel · $dateStr',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
          ],
        ),
      ),
    );
  }

  double _fmtDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  Widget _bulletList(List<dynamic> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: items.map((item) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('• ', style: TextStyle(color: AppColors.primaryLight, fontSize: 14)),
              Expanded(
                child: Text(
                  item.toString(),
                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildMealPlanPreviewSection(BuildContext context, bool isPremium, Map<String, dynamic>? mealPlan) {
    if (!isPremium) {
      return Container(
        margin: const EdgeInsets.only(top: 20),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.restaurant_menu, color: AppColors.warning, size: 20),
                const SizedBox(width: 8),
                Text('Tham khảo thực đơn', style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.warning)),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Lịch ăn uống 30 ngày cá nhân hóa được thiết kế riêng theo lượng calo mục tiêu của bạn.',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 16),
            GradientButton(
              text: 'Nâng cấp Premium để xem',
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const PremiumScreen()));
              },
              gradient: AppColors.gradientPremium,
            ),
          ],
        ),
      );
    }

    if (mealPlan == null) {
      return Container(
        margin: const EdgeInsets.only(top: 20),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderDefault),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.restaurant_menu, color: AppColors.primaryLight, size: 20),
                const SizedBox(width: 8),
                Text('Tham khảo thực đơn', style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              ],
            ),
            const SizedBox(height: 16),
            const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          ],
        ),
      );
    }

    final days = mealPlan['days'] as List?;
    if (days == null || days.isEmpty) {
      return const SizedBox.shrink();
    }

    final dayOne = days.first as Map<String, dynamic>;

    return Container(
      margin: const EdgeInsets.only(top: 20),
      padding: const EdgeInsets.all(18),
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
                  const Icon(Icons.restaurant_menu, color: AppColors.primaryLight, size: 20),
                  const SizedBox(width: 8),
                  Text('Tham khảo thực đơn (Ngày 1)', style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                ],
              ),
              if (dayOne['calories'] != null)
                Text(
                  '${dayOne['calories']} kcal',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.warning),
                ),
            ],
          ),
          if (dayOne['focus'] != null) ...[
            const SizedBox(height: 6),
            Text(
              '🎯 Tiêu điểm: ${dayOne['focus']}',
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic),
            ),
          ],
          const SizedBox(height: 16),
          _mealPreviewRow('Bữa sáng', dayOne['breakfast']),
          const Divider(color: AppColors.borderDefault, height: 16),
          _mealPreviewRow('Bữa trưa', dayOne['lunch']),
          const Divider(color: AppColors.borderDefault, height: 16),
          _mealPreviewRow('Bữa tối', dayOne['dinner']),
          if (dayOne['snack'] != null && dayOne['snack'].toString().trim().isNotEmpty) ...[
            const Divider(color: AppColors.borderDefault, height: 16),
            _mealPreviewRow('Bữa phụ', dayOne['snack']),
          ],
          const SizedBox(height: 20),
          GradientButton(
            text: 'Xem Thực đơn 30 ngày đầy đủ',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const MealPlanScreen(isPremium: true)));
            },
          ),
        ],
      ),
    );
  }

  Widget _mealPreviewRow(String label, dynamic value) {
    if (value == null) return const SizedBox.shrink();
    final textVal = value.toString();
    final parts = textVal.split(':');
    final desc = parts.length > 1 ? parts.sublist(1).join(':').trim() : textVal;
    
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            desc,
            style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailView() {
    final result = _detail?['result'] as Map<String, dynamic>? ?? _detail ?? {};
    final metrics = result['metrics'] as Map<String, dynamic>? ?? {};

    final bmi = metrics['bmi'] ?? result['bmi'];
    final bmiCategory = metrics['bmiCategory'] as Map<String, dynamic>? ?? result['bmiCategory'] as Map<String, dynamic>? ?? {};
    final bodyFat = metrics['bodyFat'] as Map<String, dynamic>? ?? result['bodyFat'] as Map<String, dynamic>?;
    final bodyShape = metrics['bodyShape'] as Map<String, dynamic>? ?? result['bodyShape'] as Map<String, dynamic>? ?? {};
    final tdee = metrics['tdee'] ?? result['tdee'];
    final targetCalories = metrics['targetCalories'] ?? result['targetCalories'];

    final vision = result['vision'] as Map<String, dynamic>? ?? {};
    final outfitFit = vision['outfitFit'] as Map<String, dynamic>? ?? {};
    final health = result['health'] as Map<String, dynamic>? ?? {};
    final fashion = result['fashion'] as Map<String, dynamic>? ?? {};
    final photo = result['photo'] as Map<String, dynamic>? ?? {};

    // Robust BMI parsing
    final bmiVal = bmi is Map ? bmi['value'] : bmi;
    String bmiLabel = bmiCategory['label'] ?? (bmi is Map ? (bmi['label'] ?? '') : '');
    if (bmiVal != null && bmiLabel.isEmpty) {
      final double val = _fmtDouble(bmiVal);
      if (val < 18.5) {
        bmiLabel = 'Thiếu cân';
      } else if (val < 23.0) {
        bmiLabel = 'Bình thường';
      } else if (val < 25.0) {
        bmiLabel = 'Thừa cân';
      } else {
        bmiLabel = 'Béo phì';
      }
    }

    // Robust Body Fat parsing
    final fatVal = bodyFat != null ? '${_fmt(bodyFat['percent'])}%' : 'Chưa đủ số đo';
    final fatSub = bodyFat != null ? '${bodyFat['fatMassKg'] ?? '?'}kg mỡ, ${bodyFat['leanMassKg'] ?? '?'}kg nạc' : 'Cần cổ/eo/hông';

    // Robust Body Shape parsing
    final bodyShapeLabel = bodyShape['label'] ?? 'N/A';
    final bodyShapeConf = bodyShape['confidence'] != null ? 'Tin cậy ${(_fmtDouble(bodyShape['confidence']) * 100).round()}%' : 'N/A';

    final observations = vision['observations'] as List? ?? [];
    final outfitScore = outfitFit['score'] ?? vision['outfitScore'];

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
                onPressed: () => setState(() => _detail = null),
              ),
              const SizedBox(width: 4),
              Text('Chi tiết phân tích', style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
            ],
          ),
          const SizedBox(height: 20),

          // Metric cards
          Row(children: [
            Expanded(child: _metricCard('BMI', '${_fmt(bmiVal)}', bmiLabel, AppColors.primary)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard('Body Fat', fatVal, fatSub, AppColors.health)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _metricCard('Calo mục tiêu', targetCalories != null ? '${_fmt(targetCalories)} kcal' : '-- kcal', 'TDEE: ${_fmt(tdee)} kcal', AppColors.warning)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard('Dáng AI', bodyShapeLabel, bodyShapeConf, AppColors.secondary)),
          ]),
          const SizedBox(height: 20),

          // Card 1: AI Phân tích ảnh
          if (vision.isNotEmpty) ...[
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderDefault),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.camera_alt, color: AppColors.primaryLight, size: 20),
                      const SizedBox(width: 8),
                      Text('AI phân tích ảnh', style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text('Dáng người', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  ShaderMask(
                    shaderCallback: (b) => AppColors.gradientPrimary.createShader(b),
                    child: Text(bodyShapeLabel, style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                  ),
                  if (bodyShape['description'] != null) ...[
                    const SizedBox(height: 8),
                    Text(bodyShape['description'], style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4)),
                  ],
                  const Divider(color: AppColors.borderDefault, height: 24),
                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        outfitFit['level'] != null ? (outfitFit['level'] == 'good' ? 'Outfit phù hợp' : outfitFit['level'] == 'normal' ? 'Outfit tạm ổn' : 'Outfit chưa hợp') : 'Nhận xét outfit',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                      ),
                      if (outfitScore != null)
                        Text('$outfitScore/10', style: GoogleFonts.montserrat(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warning)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    outfitFit['summary'] ?? vision['outfitFeedback'] ?? 'Chưa có nhận xét.',
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                  ),
                  
                  if (vision['photoQuality'] != null) ...[
                    const SizedBox(height: 12),
                    Text(vision['photoQuality'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted, fontStyle: FontStyle.italic)),
                  ],
                  
                  if (observations.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text('Quan sát chi tiết:', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    _bulletList(observations),
                  ],
                ],
              ),
            ),
          ],

          // Card 2: Gợi ý sức khỏe
          if (health.isNotEmpty) ...[
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderDefault),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.favorite, color: AppColors.health, size: 20),
                      const SizedBox(width: 8),
                      Text('Gợi ý sức khỏe', style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (bmiCategory['summary'] != null) ...[
                    Text(bmiCategory['summary'], style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4)),
                    const Divider(color: AppColors.borderDefault, height: 24),
                  ],
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(health['calorieMode'] ?? 'Chế độ calo', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      if (health['direction'] != null)
                        Text(health['direction'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.warning, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  if (health['tips'] is List && (health['tips'] as List).isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _bulletList(health['tips'] as List),
                  ],
                ],
              ),
            ),
          ],

          // Card 3: Gợi ý phong cách
          if (fashion.isNotEmpty) ...[
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderDefault),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.checkroom, color: AppColors.secondary, size: 20),
                      const SizedBox(width: 8),
                      Text('Gợi ý phong cách', style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (fashion['focus'] != null) ...[
                    Text(fashion['focus'], style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4)),
                    const SizedBox(height: 14),
                  ],
                  if (fashion['wear'] is List && (fashion['wear'] as List).isNotEmpty) ...[
                    Text('Nên mặc:', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.health)),
                    const SizedBox(height: 8),
                    _bulletList(fashion['wear'] as List),
                    const SizedBox(height: 14),
                  ],
                  if (fashion['avoid'] is List && (fashion['avoid'] as List).isNotEmpty) ...[
                    Text('Nên tránh:', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.danger)),
                    const SizedBox(height: 8),
                    _bulletList(fashion['avoid'] as List),
                  ],
                ],
              ),
            ),
          ],

          // Card 4: Tham khảo thực đơn
          _buildMealPlanPreviewSection(context, _isPremium, _mealPlan),
          const SizedBox(height: 16),

          // Card 5: Disclaimer & Notes
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 24),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.bgCardElevated,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (result['disclaimer'] != null) ...[
                  Text(result['disclaimer'].toString(), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, height: 1.4)),
                  const SizedBox(height: 8),
                ],
                if (bodyFat?['note'] != null) ...[
                  Text(bodyFat['note'].toString(), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, height: 1.4)),
                  const SizedBox(height: 8),
                ],
                if (photo['note'] != null)
                  Text(photo['note'].toString(), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _metricCard(String label, String value, String sub, Color color) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.borderDefault)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      Text(value, style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
      const SizedBox(height: 4),
      Text(sub, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
    ]),
  );

  Widget _buildEmptyState() => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.history_rounded, size: 48, color: AppColors.textMuted),
    const SizedBox(height: 12),
    Text('Chưa có lịch sử phân tích', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
  ]));

  Widget _buildErrorState() => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
    const SizedBox(height: 12),
    Text(_error ?? 'Đã xảy ra lỗi', style: GoogleFonts.inter(fontSize: 14, color: AppColors.danger)),
    const SizedBox(height: 12),
    TextButton(onPressed: _loadHistory, child: Text('Thử lại', style: GoogleFonts.inter(color: AppColors.primaryLight))),
  ]));

  String _fmt(dynamic v) => v == null ? '--' : (v is double ? v.toStringAsFixed(1) : v.toString());
}
