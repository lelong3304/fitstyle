import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import 'meal_plan_screen.dart';
import 'premium_screen.dart';

class AnalyzeScreen extends StatefulWidget {
  const AnalyzeScreen({super.key});

  @override
  State<AnalyzeScreen> createState() => _AnalyzeScreenState();
}

class _AnalyzeScreenState extends State<AnalyzeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _ageCtrl = TextEditingController(text: '21');
  final _heightCtrl = TextEditingController(text: '172');
  final _weightCtrl = TextEditingController(text: '65');
  final _neckCtrl = TextEditingController();
  final _chestCtrl = TextEditingController();
  final _waistCtrl = TextEditingController();
  final _hipCtrl = TextEditingController();

  String _gender = 'male';
  String _activityLevel = 'light';
  String _goal = 'maintain';
  File? _bodyPhoto;
  bool _isLoading = false;
  Map<String, dynamic>? _result;
  String? _error;
  Map<String, dynamic>? _mealPlan;
  bool _isPremium = false;

  final _picker = ImagePicker();

  @override
  void dispose() {
    _ageCtrl.dispose();
    _heightCtrl.dispose();
    _weightCtrl.dispose();
    _neckCtrl.dispose();
    _chestCtrl.dispose();
    _waistCtrl.dispose();
    _hipCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(source: source, maxWidth: 1200, imageQuality: 85);
      if (picked != null) {
        setState(() => _bodyPhoto = File(picked.path));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể mở thư viện ảnh: $e')),
        );
      }
    }
  }

  Future<void> _handleAnalyze() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _error = null; _result = null; });

    final fields = <String, String>{
      'age': _ageCtrl.text.trim(),
      'gender': _gender,
      'heightCm': _heightCtrl.text.trim(),
      'weightKg': _weightCtrl.text.trim(),
      'activityLevel': _activityLevel,
      'goal': _goal,
    };
    if (_neckCtrl.text.trim().isNotEmpty) fields['neckCm'] = _neckCtrl.text.trim();
    if (_chestCtrl.text.trim().isNotEmpty) fields['chestCm'] = _chestCtrl.text.trim();
    if (_waistCtrl.text.trim().isNotEmpty) fields['waistCm'] = _waistCtrl.text.trim();
    if (_hipCtrl.text.trim().isNotEmpty) fields['hipCm'] = _hipCtrl.text.trim();

    final result = await ApiService.analyze(profileFields: fields, bodyPhoto: _bodyPhoto);

    if (!mounted) return;
    setState(() { _isLoading = false; });

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
        _result = result.data;
      });
    } else {
      setState(() {
        _error = result.errorMessage;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_result != null) return _buildResult();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Phân tích vóc dáng', style: GoogleFonts.montserrat(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
            const SizedBox(height: 6),
            Text('Nhập thông số cơ thể và chụp ảnh để AI phân tích.', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
            const SizedBox(height: 24),

            if (_error != null) ...[
              _errorBanner(_error!),
              const SizedBox(height: 16),
            ],

            // Ảnh
            _buildPhotoSection(),
            const SizedBox(height: 20),

            // Thông số cơ bản
            _sectionTitle('Thông số cơ bản'),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _buildField('Tuổi', _ageCtrl, suffix: 'tuổi')),
              const SizedBox(width: 12),
              Expanded(child: _buildDropdown('Giới tính', _gender, {'male': 'Nam', 'female': 'Nữ'}, (v) => setState(() => _gender = v!))),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _buildField('Chiều cao', _heightCtrl, suffix: 'cm')),
              const SizedBox(width: 12),
              Expanded(child: _buildField('Cân nặng', _weightCtrl, suffix: 'kg')),
            ]),
            const SizedBox(height: 20),

            // Số đo chi tiết
            _sectionTitle('Số đo chi tiết (tuỳ chọn)'),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _buildField('Cổ', _neckCtrl, suffix: 'cm', required: false)),
              const SizedBox(width: 12),
              Expanded(child: _buildField('Ngực', _chestCtrl, suffix: 'cm', required: false)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _buildField('Eo', _waistCtrl, suffix: 'cm', required: false)),
              const SizedBox(width: 12),
              Expanded(child: _buildField('Mông', _hipCtrl, suffix: 'cm', required: false)),
            ]),
            const SizedBox(height: 20),

            // Mục tiêu
            _sectionTitle('Mục tiêu & Vận động'),
            const SizedBox(height: 12),
            _buildDropdown('Mức vận động', _activityLevel, {
              'sedentary': 'Ít vận động',
              'light': 'Nhẹ nhàng (1-3 buổi/tuần)',
              'moderate': 'Trung bình (3-5 buổi/tuần)',
              'active': 'Tích cực (5-7 buổi/tuần)',
            }, (v) => setState(() => _activityLevel = v!)),
            const SizedBox(height: 12),
            _buildDropdown('Mục tiêu', _goal, {
              'lose': 'Giảm cân/giảm mỡ',
              'maintain': 'Duy trì săn chắc hơn',
              'gain': 'Tăng cân/tăng cơ',
            }, (v) => setState(() => _goal = v!)),
            const SizedBox(height: 28),

            GradientButton(
              text: 'Bắt đầu phân tích',
              isLoading: _isLoading,
              onPressed: _isLoading ? null : _handleAnalyze,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _bodyPhoto != null ? AppColors.primary.withValues(alpha: 0.4) : AppColors.borderDefault),
      ),
      child: Column(
        children: [
          if (_bodyPhoto != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(_bodyPhoto!, height: 200, width: double.infinity, fit: BoxFit.cover),
            ),
            const SizedBox(height: 12),
          ],
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _pickPhoto(ImageSource.gallery),
              icon: const Icon(Icons.photo_library_outlined, size: 18),
              label: Text(_bodyPhoto != null ? 'Chọn ảnh khác từ thư viện' : 'Chọn ảnh từ thư viện', style: GoogleFonts.inter(fontSize: 13)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primaryLight,
                side: const BorderSide(color: AppColors.borderDefault),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
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

  Widget _buildResult() {
    final metrics = _result?['metrics'] as Map<String, dynamic>? ?? {};

    final bmi = metrics['bmi'] ?? _result?['bmi'];
    final bmiCategory = metrics['bmiCategory'] as Map<String, dynamic>? ?? _result?['bmiCategory'] as Map<String, dynamic>? ?? {};
    final bodyFat = metrics['bodyFat'] as Map<String, dynamic>? ?? _result?['bodyFat'] as Map<String, dynamic>?;
    final bodyShape = metrics['bodyShape'] as Map<String, dynamic>? ?? _result?['bodyShape'] as Map<String, dynamic>? ?? {};
    final tdee = metrics['tdee'] ?? _result?['tdee'];
    final targetCalories = metrics['targetCalories'] ?? _result?['targetCalories'];

    final vision = _result?['vision'] as Map<String, dynamic>? ?? {};
    final outfitFit = vision['outfitFit'] as Map<String, dynamic>? ?? {};
    final health = _result?['health'] as Map<String, dynamic>? ?? {};
    final fashion = _result?['fashion'] as Map<String, dynamic>? ?? {};
    final photo = _result?['photo'] as Map<String, dynamic>? ?? {};

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
                onPressed: () => setState(() => _result = null),
              ),
              const SizedBox(width: 4),
              Text('Kết quả phân tích', style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
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
                if (_result?['disclaimer'] != null) ...[
                  Text(_result!['disclaimer'].toString(), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, height: 1.4)),
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

          GradientButton(text: 'Phân tích lại', onPressed: () => setState(() { _result = null; _bodyPhoto = null; _mealPlan = null; })),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  String _fmt(dynamic v) => v == null ? '--' : (v is double ? v.toStringAsFixed(1) : v.toString());

  Widget _metricCard(String label, String value, String sub, Color color) {
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
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 4),
          Text(sub, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _sectionTitle(String t) => Text(t, style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary));

  Widget _buildField(String label, TextEditingController ctrl, {String? suffix, bool required = true}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: TextInputType.number,
      style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
      decoration: InputDecoration(hintText: label, suffixText: suffix),
      validator: required ? (v) => (v == null || v.trim().isEmpty) ? 'Bắt buộc' : null : null,
    );
  }

  Widget _buildDropdown(String label, String value, Map<String, String> items, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(hintText: label),
      dropdownColor: AppColors.bgCardElevated,
      style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
      items: items.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
      onChanged: onChanged,
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
