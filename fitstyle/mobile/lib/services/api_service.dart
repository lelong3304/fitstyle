import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

/// Service giao tiếp với FitStyle Backend API.
class ApiService {
  static const String baseUrl = 'https://fitstyle-wzzv.onrender.com';

  static Map<String, String> _jsonHeaders({String? token}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  static Map<String, String> _authHeaders(String token) {
    return {
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
    };
  }

  // ═══ AUTH ═══

  static Future<ApiResult> register({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/register'),
        headers: _jsonHeaders(),
        body: jsonEncode({'name': name, 'email': email, 'password': password}),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 201) {
        await StorageService.saveToken(data['token'] as String);
        await StorageService.saveUser(data['user'] as Map<String, dynamic>);
        return ApiResult.success(data);
      }
      return ApiResult.error(data['message'] as String? ?? 'Đăng ký thất bại.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<ApiResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: _jsonHeaders(),
        body: jsonEncode({'email': email, 'password': password}),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) {
        await StorageService.saveToken(data['token'] as String);
        await StorageService.saveUser(data['user'] as Map<String, dynamic>);
        return ApiResult.success(data);
      }
      return ApiResult.error(data['message'] as String? ?? 'Đăng nhập thất bại.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<ApiResult> getMe() async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.get(Uri.parse('$baseUrl/api/auth/me'), headers: _jsonHeaders(token: token));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) {
        await StorageService.saveUser(data['user'] as Map<String, dynamic>);
        return ApiResult.success(data);
      }
      await StorageService.clearAll();
      return ApiResult.error(data['message'] as String? ?? 'Phiên đăng nhập đã hết hạn.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<ApiResult> updateProfile({required String name, required String email}) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.put(
        Uri.parse('$baseUrl/api/auth/profile'),
        headers: _jsonHeaders(token: token),
        body: jsonEncode({'name': name, 'email': email}),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) {
        await StorageService.saveUser(data['user'] as Map<String, dynamic>);
        return ApiResult.success(data);
      }
      return ApiResult.error(data['message'] as String? ?? 'Cập nhật thất bại.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<ApiResult> updatePassword({required String currentPassword, required String newPassword}) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.put(
        Uri.parse('$baseUrl/api/auth/password'),
        headers: _jsonHeaders(token: token),
        body: jsonEncode({'currentPassword': currentPassword, 'newPassword': newPassword}),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Đổi mật khẩu thất bại.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  // ═══ ANALYZE ═══

  /// Gửi form phân tích vóc dáng + ảnh (multipart).
  static Future<ApiResult> analyze({
    required Map<String, String> profileFields,
    File? bodyPhoto,
  }) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);

      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/api/analyze'));
      request.headers.addAll(_authHeaders(token));
      profileFields.forEach((key, value) => request.fields[key] = value);

      if (bodyPhoto != null) {
        request.files.add(await http.MultipartFile.fromPath('bodyPhoto', bodyPhoto.path));
      }

      final streamedResponse = await request.send();
      final responseBody = await streamedResponse.stream.bytesToString();
      final data = jsonDecode(responseBody) as Map<String, dynamic>;

      if (streamedResponse.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Phân tích thất bại.', statusCode: streamedResponse.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  // ═══ HISTORY ═══

  static Future<ApiResult> getAnalyses() async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.get(Uri.parse('$baseUrl/api/analyses'), headers: _jsonHeaders(token: token));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final records = data is Map ? (data['records'] ?? data['analyses'] ?? []) : (data is List ? data : []);
        return ApiResult.success({'analyses': records});
      }
      return ApiResult.error('Không thể tải lịch sử.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<ApiResult> getAnalysisDetail(String id) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.get(Uri.parse('$baseUrl/api/analyses/$id'), headers: _jsonHeaders(token: token));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Không tìm thấy.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  // ═══ TRY-ON ═══

  /// Gửi 2 ảnh (người + quần áo) cho AI ghép đồ ảo (multipart).
  static Future<ApiResult> tryOn({
    File? personImage,
    File? garmentImage,
    String? personImageUrl,
    String? garmentImageUrl,
    bool removeBackground = false,
  }) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);

      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/api/try-on'));
      request.headers.addAll(_authHeaders(token));

      if (personImage != null) {
        request.files.add(await http.MultipartFile.fromPath('personImage', personImage.path));
      } else if (personImageUrl != null) {
        request.fields['personImageUrl'] = personImageUrl;
      }

      if (garmentImage != null) {
        request.files.add(await http.MultipartFile.fromPath('garmentImage', garmentImage.path));
      } else if (garmentImageUrl != null) {
        request.fields['garmentImageUrl'] = garmentImageUrl;
      }

      request.fields['removeBackground'] = removeBackground.toString();

      final streamedResponse = await request.send();
      final responseBody = await streamedResponse.stream.bytesToString();
      final data = jsonDecode(responseBody) as Map<String, dynamic>;

      if (streamedResponse.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Phối đồ thất bại.', statusCode: streamedResponse.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  // ═══ PRODUCTS ═══

  static Future<ApiResult> getProducts({String? bodyShape, String? gender, String? category, String? style}) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);

      final queryParams = <String, String>{};
      if (bodyShape != null) queryParams['bodyShape'] = bodyShape;
      if (gender != null) queryParams['gender'] = gender;
      if (category != null) queryParams['category'] = category;
      if (style != null) queryParams['style'] = style;

      final uri = Uri.parse('$baseUrl/api/products').replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      final response = await http.get(uri, headers: _jsonHeaders(token: token));
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200) {
        return ApiResult.success(data);
      }
      return ApiResult.error('Không thể tải sản phẩm.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  // ═══ BILLING / PREMIUM ═══

  static Future<ApiResult> getBillingPlan() async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.get(Uri.parse('$baseUrl/api/billing/plan'), headers: _jsonHeaders(token: token));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Lỗi.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<ApiResult> createCheckout({String? couponCode}) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.post(
        Uri.parse('$baseUrl/api/billing/checkout'),
        headers: _jsonHeaders(token: token),
        body: jsonEncode({'couponCode': couponCode}),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Không thể tạo thanh toán.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<ApiResult> applyCoupon(String couponCode) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.post(
        Uri.parse('$baseUrl/api/billing/apply-coupon'),
        headers: _jsonHeaders(token: token),
        body: jsonEncode({'couponCode': couponCode}),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Mã giảm giá không hợp lệ.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<ApiResult> confirmPayment(String invoiceNumber) async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.post(
        Uri.parse('$baseUrl/api/billing/confirm'),
        headers: _jsonHeaders(token: token),
        body: jsonEncode({'invoiceNumber': invoiceNumber}),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Xác nhận thất bại.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  // ═══ MEAL PLAN ═══

  static Future<ApiResult> getMealPlan() async {
    try {
      final token = await StorageService.getToken();
      if (token == null) return ApiResult.error('Chưa đăng nhập.', statusCode: 401);
      final response = await http.get(Uri.parse('$baseUrl/api/meal-plan'), headers: _jsonHeaders(token: token));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) return ApiResult.success(data);
      return ApiResult.error(data['message'] as String? ?? 'Không thể tải thực đơn.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  // ═══ CHAT BOT ═══

  static Future<ApiResult> sendChatMessage({
    required String message,
    required List<Map<String, String>> history,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/chat-bot'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': message,
          'history': history,
        }),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) {
        return ApiResult.success(data);
      }
      return ApiResult.error(data['message'] as String? ?? 'Gửi tin nhắn thất bại.', statusCode: response.statusCode);
    } catch (e) {
      return ApiResult.error('Không thể kết nối đến máy chủ.');
    }
  }

  static Future<void> logout() async {
    await StorageService.clearAll();
  }
}

// ═══ API RESULT WRAPPER ═══

class ApiResult {
  final bool isSuccess;
  final Map<String, dynamic>? data;
  final String? errorMessage;
  final int? statusCode;

  ApiResult._({required this.isSuccess, this.data, this.errorMessage, this.statusCode});

  factory ApiResult.success(Map<String, dynamic> data) => ApiResult._(isSuccess: true, data: data);
  factory ApiResult.error(String message, {int? statusCode}) =>
      ApiResult._(isSuccess: false, errorMessage: message, statusCode: statusCode);
}
