import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Service quản lý việc lưu/đọc JWT token và thông tin user
/// vào bộ nhớ cục bộ (SharedPreferences) của thiết bị.
class StorageService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  /// Lưu JWT token
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  /// Đọc JWT token (trả về null nếu chưa đăng nhập)
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Lưu thông tin user dưới dạng JSON string
  static Future<void> saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user));
  }

  /// Đọc thông tin user
  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null) return null;

    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Xóa toàn bộ dữ liệu đăng nhập (dùng khi Đăng xuất)
  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  /// Kiểm tra nhanh xem đã có token chưa
  static Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
