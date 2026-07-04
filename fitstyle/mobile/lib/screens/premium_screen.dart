import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';


class PremiumScreen extends StatefulWidget {
  const PremiumScreen({super.key});

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  bool _isLoading = false;
  bool _isPremium = false;
  String? _error;


  @override
  void initState() {
    super.initState();
    _checkPlan();
  }

  Future<void> _checkPlan() async {
    setState(() => _isLoading = true);
    final result = await ApiService.getBillingPlan();
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (result.isSuccess) {
        final user = result.data?['user'] as Map<String, dynamic>?;
        _isPremium = (user?['plan'] ?? 'free') == 'premium';
      }
    });
  }

  Future<void> _handleCheckout() async {
    setState(() { _isLoading = true; _error = null; });

    final result = await ApiService.createCheckout();
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result.isSuccess) {
      if (result.data?['alreadyPremium'] == true) {
        setState(() => _isPremium = true);
        return;
      }

      final checkoutUrl = result.data?['checkoutUrl'] as String?;
      final checkoutFields = result.data?['checkoutFields'] as Map<String, dynamic>?;
      final invoiceNumber = result.data?['order']?['invoiceNumber'] as String?;
      final amount = result.data?['order']?['amount'] as num?;

      if (checkoutUrl != null && checkoutFields != null && invoiceNumber != null) {
        if (!mounted) return;
        final paymentResult = await Navigator.push<bool>(
          context,
          MaterialPageRoute(
            builder: (_) => _PaymentWebView(
              checkoutUrl: checkoutUrl,
              checkoutFields: checkoutFields,
              invoiceNumber: invoiceNumber,
              amount: amount?.toInt() ?? 79000,
            ),
          ),
        );

        if (paymentResult == true) {
          // Try to confirm payment
          final confirmResult = await ApiService.confirmPayment(invoiceNumber);
          if (confirmResult.isSuccess) {
            // Refresh user data
            final meResult = await ApiService.getMe();
            if (meResult.isSuccess && mounted) {
              setState(() => _isPremium = true);
              _showSuccessDialog();
            }
          }
        }
        // Regardless of result, refresh plan
        _checkPlan();
      } else {
        setState(() => _error = 'Không thể tạo liên kết thanh toán.');
      }
    } else {
      setState(() => _error = result.errorMessage);
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Column(children: [
          const Icon(Icons.celebration_rounded, color: AppColors.warning, size: 48),
          const SizedBox(height: 12),
          Text('Nâng cấp thành công!', textAlign: TextAlign.center, style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ]),
        content: Text(
          'Chúc mừng bạn đã trở thành thành viên Premium! Tận hưởng tất cả tính năng không giới hạn.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning, foregroundColor: Colors.white),
              child: Text('Tuyệt vời!', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
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
        title: Text('Premium', style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.warning))
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              child: _isPremium ? _buildPremiumActive() : _buildUpgradeOffer(),
            ),
    );
  }

  Widget _buildPremiumActive() {
    return Column(
      children: [
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: AppColors.gradientPremium,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(children: [
            const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 56),
            const SizedBox(height: 12),
            Text('Premium Active', style: GoogleFonts.montserrat(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 8),
            Text('Bạn đang sử dụng gói Premium', style: GoogleFonts.inter(fontSize: 14, color: Colors.white70)),
          ]),
        ),
        const SizedBox(height: 24),
        ..._features.map((f) => _featureRow(f['icon'] as IconData, f['text'] as String, true)),
      ],
    );
  }

  Widget _buildUpgradeOffer() {
    return Column(
      children: [
        const SizedBox(height: 8),

        // Premium hero
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1a1a2e), Color(0xFF16213e), Color(0xFF0f3460)],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
          ),
          child: Column(children: [
            ShaderMask(
              shaderCallback: (b) => AppColors.gradientPremium.createShader(b),
              child: const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 56),
            ),
            const SizedBox(height: 12),
            ShaderMask(
              shaderCallback: (b) => AppColors.gradientPremium.createShader(b),
              child: Text('FitStyle Premium', style: GoogleFonts.montserrat(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
            ),
            const SizedBox(height: 8),
            Text('Mở khóa toàn bộ sức mạnh AI', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
          ]),
        ),
        const SizedBox(height: 24),

        // Price
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
          ),
          child: Column(children: [
            Text('79.000đ', style: GoogleFonts.montserrat(fontSize: 32, fontWeight: FontWeight.w900, color: AppColors.warning)),
            Text('/ tháng', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
          ]),
        ),
        const SizedBox(height: 24),

        // Features comparison
        Text('Tính năng Premium', style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        const SizedBox(height: 16),
        ..._features.map((f) => _featureRow(f['icon'] as IconData, f['text'] as String, false)),
        const SizedBox(height: 24),

        if (_error != null) ...[
          Container(
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(_error!, style: GoogleFonts.inter(fontSize: 13, color: AppColors.danger)),
          ),
        ],

        SizedBox(
          width: double.infinity,
          height: 54,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: AppColors.gradientPremium,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [BoxShadow(color: AppColors.warning.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 4))],
            ),
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleCheckout,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: Text('Nâng cấp ngay', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text('Thanh toán an toàn qua SePay', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
      ],
    );
  }

  Widget _featureRow(IconData icon, String text, bool active) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderDefault),
        ),
        child: Row(children: [
          Icon(icon, color: active ? AppColors.warning : AppColors.primaryLight, size: 20),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textPrimary))),
          Icon(Icons.check_circle, color: active ? AppColors.health : AppColors.warning, size: 18),
        ]),
      ),
    );
  }

  static final _features = [
    {'icon': Icons.analytics_outlined, 'text': 'Phân tích vóc dáng AI không giới hạn'},
    {'icon': Icons.checkroom_outlined, 'text': 'Phối đồ ảo AI không giới hạn'},
    {'icon': Icons.restaurant_menu, 'text': 'Thực đơn dinh dưỡng cá nhân hóa'},
    {'icon': Icons.auto_awesome, 'text': 'Lời khuyên AI chuyên sâu'},
    {'icon': Icons.history, 'text': 'Lịch sử phân tích đầy đủ'},
    {'icon': Icons.support_agent, 'text': 'Hỗ trợ ưu tiên 24/7'},
  ];
}


/// WebView để hiển thị trang thanh toán SePay.
/// Gửi form POST tới checkoutUrl với các fields đã ký.
class _PaymentWebView extends StatefulWidget {
  final String checkoutUrl;
  final Map<String, dynamic> checkoutFields;
  final String invoiceNumber;
  final int amount;

  const _PaymentWebView({
    required this.checkoutUrl,
    required this.checkoutFields,
    required this.invoiceNumber,
    required this.amount,
  });

  @override
  State<_PaymentWebView> createState() => _PaymentWebViewState();
}

class _PaymentWebViewState extends State<_PaymentWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasWebViewError = false;

  @override
  void initState() {
    super.initState();
    try {
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(NavigationDelegate(
          onPageStarted: (_) => setState(() => _isLoading = true),
          onPageFinished: (_) => setState(() => _isLoading = false),
          onNavigationRequest: (request) {
            // Intercept success/error/cancel callbacks
            final url = request.url;
            if (url.contains('payment=success')) {
              Navigator.pop(context, true);
              return NavigationDecision.prevent;
            }
            if (url.contains('payment=error') || url.contains('payment=cancel')) {
              Navigator.pop(context, false);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ))
        ..loadRequest(Uri.parse('about:blank'));

      // Build and submit form via JS
      _submitCheckoutForm();
    } catch (e) {
      _hasWebViewError = true;
      _isLoading = false;
    }
  }

  void _submitCheckoutForm() {
    final fields = widget.checkoutFields;
    final formInputs = StringBuffer();
    fields.forEach((key, value) {
      final escaped = value.toString().replaceAll("'", "\\'").replaceAll('"', '\\"');
      formInputs.write('<input type="hidden" name="$key" value="$escaped">');
    });

    final html = '''
<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{background:#101018;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.loading{text-align:center}.spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,0.2);border-top-color:#f59e0b;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}</style></head>
<body><div class="loading"><div class="spinner" style="margin:0 auto 16px"></div><p>Đang chuyển đến cổng thanh toán...</p></div>
<form id="payForm" method="POST" action="${widget.checkoutUrl}">$formInputs</form>
<script>document.getElementById('payForm').submit();</script></body></html>
''';

    _controller.loadHtmlString(html);
  }

  Widget _buildFallbackView() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderDefault),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 48),
              const SizedBox(height: 16),
              Text(
                'Lỗi khởi tạo cổng thanh toán',
                style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),
              Text(
                'Môi trường chạy thử chưa được biên dịch đầy đủ mã nguồn native WebView.\n\nVui lòng tắt app hoàn toàn và chạy lại lệnh:\nflutter run\n\nHoặc thanh toán bằng chuyển khoản trực tiếp với thông tin bên dưới.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 20),
              const Divider(color: AppColors.borderDefault),
              const SizedBox(height: 16),
              _transferInfoRow('Nội dung chuyển khoản:', widget.invoiceNumber, isBold: true),
              _transferInfoRow('Số tiền:', '${widget.amount.toString().replaceAllMapped(RegExp(r"(\d{1,3})(?=(\d{3})+(?!\d))"), (Match m) => "${m[1]}.")} đ'),
              _transferInfoRow('Cổng tự động nhận diện:', 'SePay IPN'),
              const SizedBox(height: 24),
              GradientButton(
                text: 'Xác nhận tôi đã chuyển khoản',
                onPressed: () {
                  Navigator.pop(context, true);
                },
                gradient: AppColors.gradientPremium,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _transferInfoRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
          SelectableText(
            value,
            style: GoogleFonts.montserrat(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
              color: isBold ? AppColors.warning : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgBody,
      appBar: AppBar(
        backgroundColor: AppColors.bgCard,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context, false),
        ),
        title: Text('Thanh toán', style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        centerTitle: true,
      ),
      body: _hasWebViewError ? _buildFallbackView() : Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(child: CircularProgressIndicator(color: AppColors.warning)),
        ],
      ),
    );
  }
}
