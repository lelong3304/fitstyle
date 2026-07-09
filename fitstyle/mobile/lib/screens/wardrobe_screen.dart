import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'tryon_screen.dart';

class WardrobeScreen extends StatefulWidget {
  final Function(int, {String? garmentUrl, String? garmentName})? onNavigateToTab;

  const WardrobeScreen({super.key, this.onNavigateToTab});

  @override
  State<WardrobeScreen> createState() => _WardrobeScreenState();
}

class _WardrobeScreenState extends State<WardrobeScreen> {
  List<dynamic> _products = [];
  List<String> _categories = [];
  List<String> _styles = [];
  List<dynamic> _bodyShapes = [];

  bool _isLoading = true;
  String? _error;

  String? _selectedCategory;
  String? _selectedStyle;
  String? _selectedShape;
  String? _selectedGender;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() { _isLoading = true; _error = null; });
    final result = await ApiService.getProducts(
      category: (_selectedCategory?.isNotEmpty ?? false) ? _selectedCategory : null,
      gender: (_selectedGender?.isNotEmpty ?? false) ? _selectedGender : null,
      style: (_selectedStyle?.isNotEmpty ?? false) ? _selectedStyle : null,
      bodyShape: (_selectedShape?.isNotEmpty ?? false) ? _selectedShape : null,
    );
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (result.isSuccess) {
        _products = (result.data?['products'] as List?) ?? [];
        _categories = List<String>.from(result.data?['categories'] ?? []);
        _styles = List<String>.from(result.data?['styles'] ?? []);
        _bodyShapes = List<dynamic>.from(result.data?['bodyShapes'] ?? []);

        // Attempt to auto-select latest analysis shape if none is selected
        if (_selectedShape == null && _bodyShapes.isNotEmpty) {
          _fetchLatestAnalysisAndSetFilter();
        }
      } else {
        _error = result.errorMessage;
      }
    });
  }

  Future<void> _fetchLatestAnalysisAndSetFilter() async {
    final res = await ApiService.getAnalyses();
    if (res.isSuccess && mounted) {
      final list = res.data?['analyses'] as List?;
      if (list != null && list.isNotEmpty) {
        final latest = list.first as Map<String, dynamic>?;
        final shapeKey = latest?['result']?['bodyShape']?['key'] ?? latest?['result']?['bodyShape'];
        if (shapeKey != null) {
          setState(() {
            _selectedShape = shapeKey.toString();
          });
          _loadProducts();
        }
      }
    }
  }

  Future<void> _openProductLink(String? url, String productId) async {
    if (url == null || url.isEmpty) return;

    // Track affiliate click in background
    ApiService.trackAffiliateClick(
      productId: productId,
      bodyShape: _selectedShape,
    );

    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Tủ đồ gợi ý', style: GoogleFonts.montserrat(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
              const SizedBox(height: 6),
              Text('Sản phẩm được gợi ý phù hợp với dáng bạn.', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
            ],
          ),
        ),

        // Scrollable filters row
        _buildFiltersRow(),
        const Divider(color: AppColors.borderDefault, height: 1),

        // Product grid
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : _error != null
                  ? _buildErrorState()
                  : _products.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _loadProducts,
                          color: AppColors.primary,
                          child: GridView.builder(
                            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: 0.58, // Expanded for buttons
                            ),
                            itemCount: _products.length,
                            itemBuilder: (_, i) => _buildProductCard(_products[i] as Map<String, dynamic>),
                          ),
                        ),
        ),
      ],
    );
  }

  Widget _buildFiltersRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _buildFilterDropdown<String>(
            hint: 'Dáng người',
            value: _selectedShape,
            items: [
              const DropdownMenuItem(value: '', child: Text('Tất cả dáng')),
              ..._bodyShapes.map((s) => DropdownMenuItem(value: s['key']?.toString() ?? '', child: Text(s['label']?.toString() ?? ''))),
            ],
            onChanged: (v) {
              setState(() => _selectedShape = (v == null || v.isEmpty) ? null : v);
              _loadProducts();
            },
          ),
          const SizedBox(width: 8),
          _buildFilterDropdown<String>(
            hint: 'Nhóm sản phẩm',
            value: _selectedCategory,
            items: [
              const DropdownMenuItem(value: '', child: Text('Tất cả nhóm')),
              ..._categories.map((c) => DropdownMenuItem(value: c, child: Text(c))),
            ],
            onChanged: (v) {
              setState(() => _selectedCategory = (v == null || v.isEmpty) ? null : v);
              _loadProducts();
            },
          ),
          const SizedBox(width: 8),
          _buildFilterDropdown<String>(
            hint: 'Phong cách',
            value: _selectedStyle,
            items: [
              const DropdownMenuItem(value: '', child: Text('Tất cả phong cách')),
              ..._styles.map((s) => DropdownMenuItem(value: s, child: Text(s))),
            ],
            onChanged: (v) {
              setState(() => _selectedStyle = (v == null || v.isEmpty) ? null : v);
              _loadProducts();
            },
          ),
          const SizedBox(width: 8),
          _buildFilterDropdown<String>(
            hint: 'Giới tính',
            value: _selectedGender,
            items: const [
              DropdownMenuItem(value: '', child: Text('Tất cả giới tính')),
              DropdownMenuItem(value: 'male', child: Text('Nam')),
              DropdownMenuItem(value: 'female', child: Text('Nữ')),
            ],
            onChanged: (v) {
              setState(() => _selectedGender = (v == null || v.isEmpty) ? null : v);
              _loadProducts();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFilterDropdown<T>({
    required String hint,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value ?? ('' as T),
          hint: Text(hint, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          dropdownColor: AppColors.bgCardElevated,
          icon: const Icon(Icons.arrow_drop_down, color: AppColors.textMuted, size: 16),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
    final name = product['name'] as String? ?? '';
    final image = product['imageUrl'] as String? ?? product['image'] as String? ?? '';
    final price = product['price'];
    final brand = product['brand'] as String? ?? '';
    final link = product['affiliateUrl'] as String? ?? product['link'] as String? ?? product['url'] as String? ?? '';
    final id = product['_id'] as String? ?? product['id'] as String? ?? '';

    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              child: image.isNotEmpty
                  ? Image.network(
                      image,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _imagePlaceholder(),
                    )
                  : _imagePlaceholder(),
            ),
          ),
          // Info & Actions
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (brand.isNotEmpty)
                  Text(brand, style: GoogleFonts.inter(fontSize: 10, color: AppColors.primaryLight, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(name, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary), maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                if (price != null)
                  Text(
                    _formatPrice(price),
                    style: GoogleFonts.montserrat(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.secondary),
                  ),
                const SizedBox(height: 10),
                
                // Action Buttons: Thử phối (full-width)
                SizedBox(
                  width: double.infinity,
                  child: GestureDetector(
                    onTap: () {
                      widget.onNavigateToTab?.call(2, garmentUrl: image, garmentName: name); // Switch to Try-On tab (index 2)
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        gradient: AppColors.gradientPrimary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.checkroom, color: Colors.white, size: 13),
                          const SizedBox(width: 4),
                          Text('Thử phối', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatPrice(dynamic price) {
    if (price is num) {
      final formatted = price.toInt().toString().replaceAllMapped(
        RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]}.',
      );
      return '${formatted}đ';
    }
    return price.toString();
  }

  Widget _imagePlaceholder() => Container(
    color: AppColors.bgCardElevated,
    child: const Center(child: Icon(Icons.checkroom_outlined, color: AppColors.textMuted, size: 32)),
  );

  Widget _buildEmptyState() => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.shopping_bag_outlined, size: 48, color: AppColors.textMuted),
    const SizedBox(height: 12),
    Text('Chưa có sản phẩm nào', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
    const SizedBox(height: 8),
    Text('Hãy thay đổi bộ lọc hoặc phân tích vóc dáng.', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
  ]));

  Widget _buildErrorState() => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
    const SizedBox(height: 12),
    Text(_error ?? 'Đã xảy ra lỗi', style: GoogleFonts.inter(fontSize: 14, color: AppColors.danger)),
    const SizedBox(height: 12),
    TextButton(onPressed: _loadProducts, child: Text('Thử lại', style: GoogleFonts.inter(color: AppColors.primaryLight))),
  ]));
}
