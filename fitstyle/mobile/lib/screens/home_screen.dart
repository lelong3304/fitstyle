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
  String? _selectedGarmentUrl;
  String? _selectedGarmentName;

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

  void _handleNavigateToTab(int index, {String? garmentUrl, String? garmentName}) {
    setState(() {
      _currentNavIndex = index;
      if (garmentUrl != null) {
        _selectedGarmentUrl = garmentUrl;
        _selectedGarmentName = garmentName;
      }
    });
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
                onNavigateToTab: (idx) => _handleNavigateToTab(idx),
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
              TryOnScreen(
                externalGarmentImageUrl: _selectedGarmentUrl,
                externalProductName: _selectedGarmentName,
                onClearExternalData: () {
                  setState(() {
                    _selectedGarmentUrl = null;
                    _selectedGarmentName = null;
                  });
                },
              ),
              WardrobeScreen(
                onNavigateToTab: _handleNavigateToTab,
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
          _buildStyleGrid(context),
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
            GestureDetector(
              onTap: () => _showNotificationsSheet(context),
              child: Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.bgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderDefault),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    const Icon(Icons.notifications_none_rounded, color: AppColors.textPrimary, size: 22),
                    if (isPremium)
                      Positioned(
                        top: 10,
                        right: 10,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.danger,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
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

  Widget _buildStyleGrid(BuildContext context) {
    final styles = [
      {
        'title': 'Tối giản (Minimalism)',
        'desc': 'Tập trung vào sự đơn giản, tinh tế với phom dáng cơ bản và các gam màu trung tính sang trọng.',
        'tag': 'Gam màu trung tính',
        'imageUrl': 'https://res.cloudinary.com/dfdkqvrfl/image/upload/v1783259730/fitstyle-ai/styles/f4zysgmmui97o3vea9cd.jpg',
        'badge': 'Tinh tế',
        'details': [
          'Màu sắc chủ đạo: Trắng, Đen, Xám, Kem, Beige.',
          'Trang phục cơ bản: Áo thun trơn cổ tròn, quần tây ống đứng, blazer tối giản, giày sneaker trắng.',
          'Mẹo phối đồ: Tránh các họa tiết sặc sỡ, ưu tiên chất liệu cao cấp đứng phom và phối tối đa 3 màu trên một outfit.'
        ]
      },
      {
        'title': 'Đường phố (Streetwear)',
        'desc': 'Phong cách bụi bặm, phá cách và cá tính, kết hợp giữa văn hóa hiphop, skate và thể thao đường phố.',
        'tag': 'Năng động',
        'imageUrl': 'https://res.cloudinary.com/dfdkqvrfl/image/upload/v1783259733/fitstyle-ai/styles/vitucbcgm5uh3iszhhex.jpg',
        'badge': 'Cá tính',
        'details': [
          'Màu sắc chủ đạo: Đen, Neon, Graphic in nổi bật, Xám washed.',
          'Trang phục cơ bản: Áo hoodie oversized, quần cargo túi hộp, áo phông graphic, giày sneaker hầm hố.',
          'Mẹo phối đồ: Sử dụng quy tắc layering (xếp lớp), phối đồ oversized và tạo điểm nhấn bằng các phụ kiện như mũ len, xích quần.'
        ]
      },
      {
        'title': 'Cổ điển (Vintage)',
        'desc': 'Mang hơi thở của các thập niên trước với tông màu trầm ấm, họa tiết cổ điển và nét hoài niệm sâu lắng.',
        'tag': 'Hoài niệm',
        'imageUrl': 'https://res.cloudinary.com/dfdkqvrfl/image/upload/v1783259735/fitstyle-ai/styles/xnf2rva2pkcmphhrygze.jpg',
        'badge': 'Hoài cổ',
        'details': [
          'Màu sắc chủ đạo: Nâu đất, Vàng mù tạt, Xanh olive, Đỏ trầm, Denim.',
          'Trang phục cơ bản: Áo khoác da sờn, quần jeans cạp cao, áo dệt kim, sơ mi họa tiết ô kẻ.',
          'Mẹo phối đồ: Sơ vin gọn gàng, sử dụng thắt lưng da bản to cổ điển và ưu tiên phụ kiện kim loại màu đồng/vàng cũ.'
        ]
      },
      {
        'title': 'Thể thao (Sporty)',
        'desc': 'Sự kết hợp hoàn hảo giữa trang phục thể thao khỏe khoắn và thời trang năng động hàng ngày.',
        'tag': 'Khỏe khoắn',
        'imageUrl': 'https://res.cloudinary.com/dfdkqvrfl/image/upload/v1783259741/fitstyle-ai/styles/iiun20vroojtlyhwkrbj.jpg',
        'badge': 'Năng động',
        'details': [
          'Màu sắc chủ đạo: Trắng, Xanh dương đậm, Đỏ tươi, Xám sport.',
          'Trang phục cơ bản: Áo nỉ sweatshirt, quần jogger co giãn, áo thun polo ôm, giày chạy bộ cao cấp.',
          'Mẹo phối đồ: Kết hợp một món đồ ôm sát với một món đồ rộng rãi (ví dụ: quần jogger rộng phối với áo crop hoặc polo gọn gàng).'
        ]
      },
      {
        'title': 'Smart-Casual',
        'desc': 'Phong cách cân bằng hoàn hảo giữa lịch sự trang nhã công sở và nét năng động thường nhật.',
        'tag': 'Thanh lịch công sở',
        'imageUrl': 'https://res.cloudinary.com/dfdkqvrfl/image/upload/v1783259743/fitstyle-ai/styles/c7yunww6jyurgdygx6lt.jpg',
        'badge': 'Thanh lịch',
        'details': [
          'Màu sắc chủ đạo: Xanh navy, Xám, Be, Đen, Xanh pastel.',
          'Trang phục cơ bản: Sơ mi linen hoặc Oxford, quần chinos/tây slimfit, blazer không đệm vai, giày lười loafer.',
          'Mẹo phối đồ: Thay thế áo sơ mi bằng áo thun cổ tròn chất lượng cao bên dưới blazer, xắn nhẹ tay áo để tạo cảm giác tự nhiên.'
        ]
      }
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 0.70,
      children: styles.map((style) => _buildStyleCard(context, style)).toList(),
    );
  }

  Widget _buildStyleCard(BuildContext context, Map<String, dynamic> style) {
    return GestureDetector(
      onTap: () => _showStyleDetail(context, style),
      child: Container(
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
                      style['imageUrl']!,
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
                      child: Text(style['badge']!, style: GoogleFonts.inter(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w600)),
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
                  Text(style['tag']!, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 4),
                  Text(
                    style['title']!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.montserrat(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    style['desc']!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary, height: 1.3),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showStyleDetail(BuildContext context, Map<String, dynamic> style) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: AppColors.bgBody,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Pull handle
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderDefault,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 8),
              
              // Top Bar with Close button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Chi tiết phong cách',
                      style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Large Style Image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Image.network(
                          style['imageUrl']!,
                          width: double.infinity,
                          height: 300,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            height: 300,
                            color: AppColors.bgCardElevated,
                            child: const Icon(Icons.image_not_supported_outlined, color: AppColors.textMuted, size: 40),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      
                      // Style Title and Tagline
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              style['title']!,
                              style: GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              style['badge']!,
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryLight),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        style['tag']!,
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.warning),
                      ),
                      const SizedBox(height: 12),
                      
                      // Description
                      Text(
                        style['desc']!,
                        style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                      ),
                      const SizedBox(height: 24),
                      
                      // Detail Points
                      Text(
                        '💡 Gợi ý phối đồ từ AI:',
                        style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 12),
                      Column(
                        children: (style['details'] as List<String>).map((point) {
                          final parts = point.split(':');
                          final label = parts[0];
                          final desc = parts.sublist(1).join(':');
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.auto_awesome, color: AppColors.primaryLight, size: 16),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: RichText(
                                    text: TextSpan(
                                      style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
                                      children: [
                                        TextSpan(
                                          text: '$label:',
                                          style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                                        ),
                                        TextSpan(text: desc),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
              
              // Action Button
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 30),
                child: GradientButton(
                  text: 'Thử phối đồ ngay 👕',
                  onPressed: () {
                    Navigator.pop(context);
                    onNavigateToTab(2); // Goes to Phối đồ tab
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatPremiumExpiry(String? premiumUntilStr) {
    if (premiumUntilStr == null) return '';
    try {
      final dt = DateTime.parse(premiumUntilStr);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  void _showNotificationsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final list = <Map<String, String>>[];
        
        if (isPremium) {
          final expiry = _formatPremiumExpiry(user?['premiumUntil']);
          list.add({
            'title': 'Kích hoạt Premium thành công 🎉',
            'desc': 'Chúc mừng bạn đã nâng cấp Premium thành công! Hạn dùng gói của bạn là đến hết ngày $expiry.',
            'time': 'Vừa xong',
            'type': 'premium'
          });
        }
        
        list.add({
          'title': 'Mở khóa thực đơn & Phối đồ 💎',
          'desc': isPremium 
              ? 'Cảm ơn bạn đã lựa chọn Premium. Giờ đây bạn đã có quyền truy cập thực đơn 30 ngày và phối đồ không giới hạn.'
              : 'Nâng cấp gói Premium chỉ với 79.000đ/tháng để nhận đầy đủ thực đơn 30 ngày và phối đồ không giới hạn.',
          'time': '1 ngày trước',
          'type': 'promo'
        });
        
        list.add({
          'title': 'Chào mừng đến với FitStyle 👋',
          'desc': 'Chúc bạn có một trải nghiệm tuyệt vời cùng AI phân tích vóc dáng và phối đồ thông minh.',
          'time': '2 ngày trước',
          'type': 'welcome'
        });

        return Container(
          decoration: const BoxDecoration(
            color: AppColors.bgBody,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderDefault,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Thông báo',
                style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const Divider(color: AppColors.borderDefault, height: 20),
                  itemBuilder: (context, index) {
                    final item = list[index];
                    IconData iconData = Icons.notifications_rounded;
                    Color iconColor = AppColors.primaryLight;
                    if (item['type'] == 'premium') {
                      iconData = Icons.workspace_premium_rounded;
                      iconColor = AppColors.warning;
                    } else if (item['type'] == 'promo') {
                      iconData = Icons.auto_awesome;
                      iconColor = AppColors.secondary;
                    }
                    
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: iconColor.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(iconData, color: iconColor, size: 20),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['title']!,
                                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item['desc']!,
                                style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item['time']!,
                                style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
