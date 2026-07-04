import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

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
    setState(() {
      _isLoading = false;
      if (result.isSuccess) {
        _detail = result.data;
      } else {
        _error = result.errorMessage;
      }
    });
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
    final result = item['result'] as Map<String, dynamic>? ?? {};
    final bmi = result['bmi'];
    final bodyShape = result['bodyShape'];
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
                    'BMI: ${_fmt(bmi?['value'])} — ${bmi?['label'] ?? ''}',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Dáng: ${bodyShape?['label'] ?? bodyShape ?? 'N/A'} · $dateStr',
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

  Widget _buildDetailView() {
    final result = _detail?['result'] as Map<String, dynamic>? ?? _detail ?? {};
    final bmi = result['bmi'];
    final bodyFat = result['bodyFat'];
    final bodyShape = result['bodyShape'];
    final tdee = result['tdee'];
    final targetCalories = result['targetCalories'];
    final advice = result['advice'] ?? result['visionAdvice'];

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary), onPressed: () => setState(() => _detail = null)),
            const SizedBox(width: 4),
            Text('Chi tiết phân tích', style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          ]),
          const SizedBox(height: 20),

          Row(children: [
            Expanded(child: _metricCard('BMI', '${_fmt(bmi?['value'])}', bmi?['label'] ?? '', AppColors.primary)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard('Body Fat', '${_fmt(bodyFat?['percent'])}%', bodyFat?['label'] ?? '', AppColors.health)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _metricCard('TDEE', '${_fmt(tdee)}', 'kcal/ngày', AppColors.warning)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard('Target', '${_fmt(targetCalories)}', 'kcal mục tiêu', AppColors.secondary)),
          ]),
          const SizedBox(height: 20),

          if (bodyShape != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.borderDefault)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Hình dáng cơ thể', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                ShaderMask(
                  shaderCallback: (b) => AppColors.gradientPrimary.createShader(b),
                  child: Text(bodyShape?['label'] ?? bodyShape.toString(), style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                ),
                if (bodyShape is Map && bodyShape['description'] != null) ...[
                  const SizedBox(height: 8),
                  Text(bodyShape['description'], style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.5)),
                ],
              ]),
            ),
            const SizedBox(height: 20),
          ],

          if (advice != null && advice.toString().isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.primary.withValues(alpha: 0.2))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Lời khuyên AI', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Text(advice.toString(), style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.6)),
              ]),
            ),
          ],
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
