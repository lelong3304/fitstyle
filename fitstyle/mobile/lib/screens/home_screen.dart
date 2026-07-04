import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';
import 'profile_screen.dart';
import 'analyze_screen.dart';
import 'tryon_screen.dart';
import 'wardrobe_screen.dart';
import 'history_screen.dart';
import 'premium_screen.dart';
import 'meal_plan_screen.dart';
import 'chat_bot_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _latestAnalysis;
  bool _isLoading = true;
  int _currentNavIndex = 0;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _fadeAnim = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _loadUser();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> _loadUser() async {
    final user = await StorageService.getUser();
    Map<String, dynamic>? latest;

    final res = await ApiService.getAnalyses();
    if (res.isSuccess) {
      final list = res.data?['analyses'] as List?;
      if (list != null && list.isNotEmpty) {
        latest = list.first as Map<String, dynamic>?;
      }
    }

    if (mounted) {
      setState(() {
        _user = user;
        _latestAnalysis = latest;
        _isLoading = false;
      });
      _fadeController.forward();
    }
  }

  void _onUserUpdated(Map<String, dynamic> updatedUser) {
    setState(() => _user = updatedUser);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.bgBody,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    final name = _user?['name'] ?? 'Người dùng';
    final isPremium = (_user?['plan'] ?? 'free') == 'premium';

    return Scaffold(
      backgroundColor: AppColors.bgBody,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: IndexedStack(
            index: _currentNavIndex,
            children: [
              _HomeTab(
                name: name,
                isPremium: isPremium,
                user: _user,
                latestAnalysis: _latestAnalysis,
                onNavigateToTab: (index) {
                  setState(() => _currentNavIndex = index);
                },
                onProfileTap: () async {
                  final result = await Navigator.of(context).push<Map<String, dynamic>>(
                    MaterialPageRoute(builder: (_) => ProfileScreen(user: _user!)),
                  );
                  if (result != null) {
                    _onUserUpdated(result);
                    _loadUser(); // Refresh latest analysis too
                  }
                },
              ),
              const AnalyzeScreen(),
              const TryOnScreen(),
              WardrobeScreen(
                onNavigateToTab: (index) {
                  setState(() => _currentNavIndex = index);
                },
              ),
              const HistoryScreen(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatBotScreen()));
        },
        backgroundColor: Colors.transparent,
        elevation: 0,
        highlightElevation: 0,
        child: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            gradient: AppColors.gradientPrimary,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.4),
                blurRadius: 15,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bgCard,
        border: Border(top: BorderSide(color: AppColors.borderDefault, width: 0.8)),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentNavIndex,
        onTap: (i) => setState(() => _currentNavIndex = i),
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: AppColors.primaryLight,
        unselectedItemColor: AppColors.textMuted,
        selectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 11),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            activeIcon: Icon(Icons.home_rounded, color: AppColors.primaryLight),
            label: 'Trang chủ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            activeIcon: Icon(Icons.analytics, color: AppColors.primaryLight),
            label: 'Phân tích',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.checkroom_outlined),
            activeIcon: Icon(Icons.checkroom, color: AppColors.primaryLight),
            label: 'Phối đồ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_bag_outlined),
            activeIcon: Icon(Icons.shopping_bag, color: AppColors.primaryLight),
            label: 'Tủ đồ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history_rounded),
            activeIcon: Icon(Icons.history_rounded, color: AppColors.primaryLight),
            label: 'Lịch sử',
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// TAB 1: TRANG CHỦ (Figma Redesign)
// ═══════════════════════════════════════════════════════════
class _HomeTab extends StatelessWidget {
  final String name;
  final bool isPremium;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? latestAnalysis;
  final ValueChanged<int> onNavigateToTab;
  final VoidCallback onProfileTap;

  const _HomeTab({
    required this.name,
    required this.isPremium,
    this.user,
    this.latestAnalysis,
    required this.onNavigateToTab,
    required this.onProfileTap,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header với Avatar & Thông báo ──
          _buildHeaderRow(),
          const SizedBox(height: 24),

          // ── Slider Banners (Carousel) ──
          _buildHeroBanners(context),
          const SizedBox(height: 28),

          // ── Tròn Categories dạng Figma ──
          _buildCategoryCirculars(context),
          const SizedBox(height: 28),

          // ── Thẻ chỉ số sức khỏe ngày hôm nay (Stats Row) ──
          if (latestAnalysis != null) ...[
            _buildSectionHeader('Chỉ số của bạn', showSeeAll: false),
            const SizedBox(height: 14),
            _buildStatsRow(),
            const SizedBox(height: 28),
          ],

          // ── Banner Nâng cấp nếu là Free ──
          if (!isPremium) ...[
            _buildPremiumPromo(context),
            const SizedBox(height: 28),
          ],

          // ── Gợi ý outfits phổ biến ──
          _buildSectionHeader('Gợi ý phong cách nổi bật', showSeeAll: true),
          const SizedBox(height: 14),
          _buildStyleGrid(),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildHeaderRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back 👋',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 4),
            Text(
              name,
              style: GoogleFonts.montserrat(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderDefault),
              ),
              child: const Icon(Icons.notifications_none_rounded, color: AppColors.textPrimary, size: 22),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: onProfileTap,
              child: Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  gradient: AppColors.gradientPrimary,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHeroBanners(BuildContext context) {
    return SizedBox(
      height: 170,
      child: PageView(
        physics: const BouncingScrollPhysics(),
        children: [
          _buildBannerCard(
            title: 'Khám phá vóc dáng',
            subtitle: 'AI quét tỉ lệ mỡ và đề xuất dáng đồ',
            buttonText: 'Quét ngay',
            gradient: const LinearGradient(
              colors: [Color(0xFF2e1b4e), Color(0xFF140c26)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            icon: Icons.qr_code_scanner_rounded,
            onTap: () => onNavigateToTab(1),
          ),
          _buildBannerCard(
            title: 'Thử đồ ảo AI',
            subtitle: 'Ướm thử mọi trang phục lên cơ thể bạn',
            buttonText: 'Thử đồ',
            gradient: const LinearGradient(
              colors: [Color(0xFF4c1d33), Color(0xFF260c18)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            icon: Icons.checkroom_rounded,
            onTap: () => onNavigateToTab(2),
          ),
        ],
      ),
    );
  }

  Widget _buildBannerCard({
    required String title,
    required String subtitle,
    required String buttonText,
    required LinearGradient gradient,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(title, style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 6),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                const SizedBox(height: 14),
                ElevatedButton(
                  onPressed: onTap,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(buttonText, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 1,
            child: Icon(icon, size: 56, color: AppColors.textSecondary.withValues(alpha: 0.15)),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCirculars(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildCircularItem(Icons.analytics_outlined, 'Phân tích', Colors.purple, () => onNavigateToTab(1)),
        _buildCircularItem(Icons.checkroom_rounded, 'Thử đồ', const Color(0xFFF43F5E), () => onNavigateToTab(2)),
        _buildCircularItem(Icons.restaurant_menu_outlined, 'Dinh dưỡng', const Color(0xFF10B981), () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => MealPlanScreen(isPremium: isPremium)));
        }),
        _buildCircularItem(Icons.shopping_bag_outlined, 'Tủ đồ', Colors.blue, () => onNavigateToTab(3)),
        _buildCircularItem(Icons.history_rounded, 'Lịch sử', Colors.orange, () => onNavigateToTab(4)),
      ],
    );
  }

  Widget _buildCircularItem(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: color.withValues(alpha: 0.25), width: 1.2),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, {required bool showSeeAll}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        if (showSeeAll)
          GestureDetector(
            onTap: () => onNavigateToTab(3),
            child: Text('Tất cả', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textLink)),
          ),
      ],
    );
  }

  Widget _buildStatsRow() {
    final profile = latestAnalysis?['profile'] as Map<String, dynamic>?;
    final result = latestAnalysis?['result'] as Map<String, dynamic>?;
    final summary = latestAnalysis?['summary'] as Map<String, dynamic>?;

    final height = profile?['heightCm']?.toString() ?? '--';
    final weight = profile?['weightKg']?.toString() ?? '--';

    final bmi = summary?['bmi'] ?? result?['metrics']?['bmi'] ?? result?['bmi'];
    final bmiVal = bmi is Map ? (bmi['value']?.toString() ?? '--') : (bmi?.toString() ?? '--');

    return Row(
      children: [
        Expanded(child: _buildMetricCard('Chiều cao', '$height cm', Icons.straighten_rounded, AppColors.primary)),
        const SizedBox(width: 12),
        Expanded(child: _buildMetricCard('Cân nặng', '$weight kg', Icons.monitor_weight_outlined, AppColors.health)),
        const SizedBox(width: 12),
        Expanded(child: _buildMetricCard('Chỉ số BMI', bmiVal, Icons.speed_rounded, AppColors.secondary)),
      ],
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon, Color color) {
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
              Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
              Icon(icon, color: color.withValues(alpha: 0.6), size: 16),
            ],
          ),
          const SizedBox(height: 10),
          Text(value, style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildPremiumPromo(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PremiumScreen())),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.warning.withValues(alpha: 0.15), AppColors.secondary.withValues(alpha: 0.08)],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.warning.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(gradient: AppColors.gradientPremium, borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.workspace_premium, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Nâng cấp Premium ✨', style: GoogleFonts.montserrat(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.warning)),
                  const SizedBox(height: 2),
                  Text('Mở khóa Virtual Try-On không giới hạn.', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.warning, size: 14),
          ],
        ),
      ),
    );
  }

  Widget _buildStyleGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 0.72,
      children: [
        _buildProductCard(
          title: 'Áo thun Casual Fit',
          brand: 'Shopee · Nam',
          price: '189.000₫',
          imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80',
          bodyShape: 'Cân đối',
        ),
        _buildProductCard(
          title: 'Quần tây Slimfit',
          brand: 'Lazada · Unisex',
          price: '299.000₫',
          imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&q=80',
          bodyShape: 'Cân đối',
        ),
      ],
    );
  }

  Widget _buildProductCard({
    required String title,
    required String brand,
    required String price,
    required String imageUrl,
    required String bodyShape,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: Image.network(
                    imageUrl,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: AppColors.bgCardElevated,
                      child: const Icon(Icons.image_not_supported_outlined, color: AppColors.textMuted),
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(bodyShape, style: GoogleFonts.inter(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(brand, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
                const SizedBox(height: 4),
                Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.montserrat(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                const SizedBox(height: 6),
                Text(price, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primaryLight)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
