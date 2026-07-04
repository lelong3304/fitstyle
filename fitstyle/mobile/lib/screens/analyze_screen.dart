import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

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
      setState(() => _result = result.data);
    } else {
      setState(() => _error = result.errorMessage);
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

  Widget _buildResult() {
    final metrics = _result?['metrics'] as Map<String, dynamic>? ?? {};

    final bmi = metrics['bmi'] ?? _result?['bmi'];
    final bmiCategory = metrics['bmiCategory'] ?? _result?['bmiCategory'];
    final bodyFat = metrics['bodyFat'] ?? _result?['bodyFat'];
    final bodyShape = metrics['bodyShape'] ?? _result?['bodyShape'];
    final tdee = metrics['tdee'] ?? _result?['tdee'];
    final targetCalories = metrics['targetCalories'] ?? _result?['targetCalories'];

    // Robust BMI parsing
    final bmiVal = bmi is Map ? bmi['value'] : bmi;
    String bmiLabel = '';
    if (bmiCategory is Map) {
      bmiLabel = bmiCategory['label'] ?? '';
    } else if (bmi is Map) {
      bmiLabel = bmi['label'] ?? '';
    }
    if (bmiVal != null && bmiLabel.isEmpty) {
      final double val = double.tryParse(bmiVal.toString()) ?? 0.0;
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
    final fatVal = bodyFat is Map ? bodyFat['percent'] : bodyFat;
    final fatLabel = bodyFat is Map ? (bodyFat['label'] ?? '') : '';

    // Robust Body Shape parsing
    final bodyShapeLabel = bodyShape is Map ? (bodyShape['label'] ?? '') : bodyShape?.toString();
    final bodyShapeDesc = bodyShape is Map ? (bodyShape['description'] ?? '') : null;

    // AI advice list / string
    final adviceObj = _result?['advice'] ?? _result?['visionAdvice'] ?? _result?['health']?['tips'];
    String adviceText = '';
    if (adviceObj is List) {
      adviceText = adviceObj.join('\n\n');
    } else if (adviceObj != null) {
      adviceText = adviceObj.toString();
    } else if (_result?['health']?['direction'] != null) {
      adviceText = _result!['health']['direction'].toString();
    }

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
            Expanded(child: _metricCard('Body Fat', fatVal != null ? '${_fmt(fatVal)}%' : '--%', fatLabel, AppColors.health)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _metricCard('TDEE', '${_fmt(tdee)} kcal', 'Năng lượng/ngày', AppColors.warning)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard('Target', '${_fmt(targetCalories)} kcal', 'Mục tiêu calo', AppColors.secondary)),
          ]),
          const SizedBox(height: 20),

          // Body shape
          if (bodyShape != null) ...[
            _sectionTitle('Hình dáng cơ thể'),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderDefault),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShaderMask(
                    shaderCallback: (b) => AppColors.gradientPrimary.createShader(b),
                    child: Text(bodyShapeLabel ?? 'N/A', style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                  ),
                  if (bodyShapeDesc != null && bodyShapeDesc.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(bodyShapeDesc, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.5)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // AI advice
          if (adviceText.isNotEmpty) ...[
            _sectionTitle('Lời khuyên từ AI'),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: Text(adviceText, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.6)),
            ),
            const SizedBox(height: 20),
          ],

          GradientButton(text: 'Phân tích lại', onPressed: () => setState(() { _result = null; _bodyPhoto = null; })),
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
