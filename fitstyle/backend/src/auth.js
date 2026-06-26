import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDatabase, hasMongoConfig } from "./db.js";
import { User } from "./models/User.js";
import { formatPlan } from "./subscription.js";

const TOKEN_EXPIRES_IN = "7d";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-only-fitstyle-secret-change-me";
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    ...formatPlan(user)
  };
}

function signToken(user) {
  return jwt.sign(publicUser(user), getJwtSecret(), { expiresIn: TOKEN_EXPIRES_IN });
}

export async function registerUser({ name, email, password }) {
  if (!hasMongoConfig()) {
    const error = new Error("Đăng ký cần MongoDB. Hãy cấu hình MONGODB_URI trước.");
    error.statusCode = 503;
    throw error;
  }

  await connectDatabase();

  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanName || !cleanEmail || cleanPassword.length < 6) {
    const error = new Error("Tên, email và mật khẩu tối thiểu 6 ký tự là bắt buộc.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    const error = new Error("Email này đã được đăng ký.");
    error.statusCode = 409;
    throw error;
  }

  const userCount = await User.countDocuments();
  const passwordHash = await bcrypt.hash(cleanPassword, 10);
  const user = await User.create({
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    role: userCount === 0 ? "admin" : "customer"
  });

  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

export async function loginUser({ email, password }) {
  if (!hasMongoConfig()) {
    const error = new Error("Đăng nhập cần MongoDB. Hãy cấu hình MONGODB_URI trước.");
    error.statusCode = 503;
    throw error;
  }

  await connectDatabase();

  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
  const passwordMatches = user ? await bcrypt.compare(String(password || ""), user.passwordHash) : false;

  if (!user || !passwordMatches) {
    const error = new Error("Email hoặc mật khẩu không đúng.");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

export function authenticateOptional(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch {
    return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
  }
}

export function requireAuth(req, res, next) {
  authenticateOptional(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ message: "Bạn cần đăng nhập để dùng chức năng này." });
    }

    return next();
  });
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền thực hiện thao tác này." });
  }

  return next();
}

export { publicUser };

