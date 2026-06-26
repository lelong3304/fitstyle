import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { getAdminDashboard } from "./adminDashboard.js";
import { analyzeProfile, validateProfile } from "./analysis.js";
import { loginUser, publicUser, registerUser, requireAdmin, requireAuth } from "./auth.js";
import { bodyShapeOptions } from "./catalog.js";
import { uploadTryOnImage } from "./cloudinary.js";
import { connectDatabase, hasMongoConfig } from "./db.js";
import { AffiliateClick } from "./models/AffiliateClick.js";
import { createTryOn } from "./pixelcut.js";
import { extractProductFromUrl } from "./productExtractor.js";
import {
  createCatalogProduct,
  deleteCatalogProduct,
  getCatalogProduct,
  listCatalogProducts,
  patchCatalogProduct,
  updateCatalogProduct
} from "./productStore.js";
import { getAnalysis, listAnalyses, saveAnalysis } from "./storage.js";
import { analyzeBodyPhoto } from "./vision.js";
import {
  activatePremiumByInvoice,
  assertCanUseTryOn,
  createPremiumCheckout,
  getFreshUser,
  getPremiumMealPlan,
  recordTryOnUsage
} from "./subscription.js";
import { User } from "./models/User.js";

dotenv.config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5173";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "FitStyle AI API",
    database: hasMongoConfig() ? "mongodb" : "json-fallback"
  });
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const session = await registerUser(req.body);
    return res.status(201).json(session);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const session = await loginUser(req.body);
    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getFreshUser(req.user.id);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.put("/api/auth/profile", requireAuth, async (req, res, next) => {
  try {
    await connectDatabase();
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    if (name) user.name = String(name).trim();

    await user.save();
    return res.json({ user: publicUser(user), message: "Cập nhật thông tin thành công." });
  } catch (error) {
    return next(error);
  }
});

app.put("/api/auth/password", requireAuth, async (req, res, next) => {
  try {
    await connectDatabase();
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const passwordMatches = await bcrypt.compare(String(currentPassword || ""), user.passwordHash);
    if (!passwordMatches) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    return res.json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/billing/plan", requireAuth, async (req, res, next) => {
  try {
    const user = await getFreshUser(req.user.id);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/billing/checkout", requireAuth, async (req, res, next) => {
  try {
    const checkout = await createPremiumCheckout(req.user.id);
    return res.json(checkout);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/billing/confirm", requireAuth, async (req, res, next) => {
  try {
    const result = await activatePremiumByInvoice(req.body.invoiceNumber, req.body);
    const user = await getFreshUser(req.user.id);
    return res.json({ ...result, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/sepay/webhook", async (req, res, next) => {
  try {
    const { gateway, transactionDate, accountNumber, code, content, transferType, transferAmount } = req.body;

    console.log("=== SEPAY WEBHOOK IPN RECEIVED ===");
    console.log("Body:", req.body);

    // Kiểm tra token bảo mật IPN (Authorization header) nếu được cấu hình trong .env
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const ipnToken = process.env.SEPAY_IPN_TOKEN;
    if (ipnToken && authHeader !== `Apikey ${ipnToken}`) {
      console.warn("Cảnh báo: Yêu cầu IPN không hợp lệ hoặc sai Token bảo mật.");
      return res.status(401).json({ success: false, message: "Không có quyền truy cập." });
    }

    if (transferType !== "in") {
      return res.json({ success: true, message: "Bỏ qua giao dịch tiền ra." });
    }

    // Tìm mã hóa đơn trong nội dung chuyển tiền (ví dụ: FS16877839301234)
    // Mã hóa đơn bắt đầu bằng FS và theo sau bởi các chữ số hoặc ký tự
    const invoiceMatch = content?.match(/FS[A-Z0-9]+/i);
    if (!invoiceMatch) {
      return res.status(400).json({ success: false, message: "Không tìm thấy mã hóa đơn hợp lệ trong nội dung chuyển khoản." });
    }

    const invoiceNumber = invoiceMatch[0].toUpperCase();
    console.log(`Tìm thấy mã hóa đơn: ${invoiceNumber}, Số tiền nhận: ${transferAmount}`);

    // Kích hoạt Premium
    const result = await activatePremiumByInvoice(invoiceNumber, req.body);
    console.log(`Đã tự động kích hoạt Premium cho hóa đơn ${invoiceNumber}. Kết quả:`, result);

    return res.json({
      success: true,
      message: `Đã kích hoạt gói Premium thành công cho hóa đơn ${invoiceNumber}`,
      result
    });
  } catch (error) {
    console.error("Lỗi xử lý SePay webhook:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi xử lý server."
    });
  }
});app.post("/api/chat-bot", async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung tin nhắn." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: "Tôi là trợ lý ảo FitStyle AI. Do chưa được cấu hình GEMINI_API_KEY ở backend, tôi chỉ có thể trả lời giả lập: FitStyle AI là ứng dụng giúp bạn phân tích chỉ số sức khỏe, đọc dáng người và gợi ý outfit thời trang phù hợp!"
      });
    }

    const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const systemInstruction = "Bạn là trợ lý ảo AI thông minh của FitStyle AI, một ứng dụng phân tích sức khỏe (BMI, TDEE, lượng calo cần nạp) và đề xuất phối đồ thời trang phù hợp theo vóc dáng cơ thể (quả lê, quả táo, đồng hồ cát, v.v.). Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt, tập trung tư vấn về phong cách ăn mặc thời trang và chế độ ăn uống, tập luyện lành mạnh.";

    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(item => {
        contents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text }]
        });
      });
    }
    
    contents.push({
      role: "user",
      parts: [{ text: `${systemInstruction}\n\nNgười dùng hỏi: ${message}` }]
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Lỗi gọi API Gemini.");
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, tôi không thể trả lời câu hỏi này.";

    return res.json({ reply });
  } catch (error) {
    console.error("Lỗi Chat Bot:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xử lý câu hỏi." });
  }
});


app.get("/api/meal-plan", requireAuth, async (req, res, next) => {
  try {
    const mealPlan = await getPremiumMealPlan(req.user.id);
    return res.json({ mealPlan });
  } catch (error) {
    return next(error);
  }
});
app.get("/api/admin/dashboard", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const dashboard = await getAdminDashboard();
    return res.json({ dashboard });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await connectDatabase();
    const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 });
    
    // Thống kê số lượng Premium
    const totalUsers = users.length;
    const premiumUsersCount = users.filter(u => {
      if (u.plan !== "premium") return false;
      if (!u.premiumUntil) return false;
      return new Date(u.premiumUntil) > new Date();
    }).length;

    return res.json({
      users,
      stats: {
        totalUsers,
        premiumUsersCount
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await connectDatabase();
    const { plan, premiumUntil, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    if (plan !== undefined) user.plan = plan;
    if (premiumUntil !== undefined) user.premiumUntil = premiumUntil ? new Date(premiumUntil) : null;
    if (role !== undefined) user.role = role;

    await user.save();
    return res.json({ message: "Cập nhật người dùng thành công.", user });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await connectDatabase();
    const { name, email, password, role, plan, premiumUntil } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Tên, email và mật khẩu là bắt buộc." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: "Email này đã được sử dụng." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role || "customer",
      plan: plan || "free",
      premiumUntil: plan === "premium" ? (premiumUntil ? new Date(premiumUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) : null
    });

    return res.json({
      message: "Tạo tài khoản người dùng thành công.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        premiumUntil: user.premiumUntil
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await connectDatabase();
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    if (req.user.id === user._id.toString()) {
      return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản của chính mình." });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: "Đã xóa người dùng thành công." });
  } catch (error) {
    return next(error);
  }
});


app.get("/api/analyses", requireAuth, async (req, res, next) => {
  try {
    const records = await listAnalyses({ user: req.user });
    return res.json({ records });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/analyses/:id", requireAuth, async (req, res, next) => {
  try {
    const record = await getAnalysis(req.params.id, { user: req.user });

    if (!record) {
      return res.status(404).json({ message: "Khong tim thay lich su phan tich." });
    }

    return res.json({ record });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/products", requireAuth, async (req, res, next) => {
  try {
    const catalog = await listCatalogProducts({
      bodyShape: req.query.bodyShape,
      category: req.query.category,
      gender: req.query.gender,
      style: req.query.style,
      includeInactive: req.user.role === "admin" && req.query.includeInactive === "true"
    });

    return res.json({
      ...catalog,
      bodyShapes: bodyShapeOptions
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/admin/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await createCatalogProduct(req.body, req.user);
    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
});

app.put("/api/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await updateCatalogProduct(req.params.id, req.body);
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await patchCatalogProduct(req.params.id, req.body);
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await deleteCatalogProduct(req.params.id);
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/admin/products/extract", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await extractProductFromUrl(req.body.url);
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/affiliate-clicks", requireAuth, async (req, res, next) => {
  try {
    const product = await getCatalogProduct(req.body.productId);

    if (!product) {
      return res.status(404).json({ message: "Khong tim thay san pham affiliate." });
    }

    if (hasMongoConfig()) {
      await connectDatabase();
      await AffiliateClick.create({
        userId: req.user.id,
        productId: product.id,
        productName: product.name,
        bodyShape: req.body.bodyShape || "",
        affiliateUrl: product.affiliateUrl
      });
    }

    return res.json({ ok: true, affiliateUrl: product.affiliateUrl });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/analyze", requireAuth, upload.single("bodyPhoto"), async (req, res, next) => {
  try {
    const profile = req.body;
    const errors = validateProfile(profile);

    if (errors.length > 0) {
      return res.status(400).json({ message: "Du lieu chua hop le.", errors });
    }

    const visionAnalysis = await analyzeBodyPhoto(req.file, profile);
    const result = analyzeProfile(profile, visionAnalysis);
    const responsePayload = {
      ...result,
      photo: req.file
        ? {
            received: true,
            filename: req.file.originalname,
            note: visionAnalysis.note
          }
        : {
            received: false,
            note: visionAnalysis.note
          }
    };
    const savedRecord = await saveAnalysis({ profile, result: responsePayload, photo: req.file, user: req.user });

    return res.json({
      ...responsePayload,
      historyId: savedRecord.id
    });
  } catch (error) {
    return next(error);
  }
});

app.post(
  "/api/try-on",
  requireAuth,
  upload.fields([
    { name: "personImage", maxCount: 1 },
    { name: "garmentImage", maxCount: 1 }
  ]),
  async (req, res, next) => {
  try {
    const access = await assertCanUseTryOn(req.user.id);
    const personUpload = await uploadTryOnImage(req.files?.personImage?.[0], "person");
    const garmentUpload = await uploadTryOnImage(req.files?.garmentImage?.[0], "garment");
    const result = await createTryOn({
      personImageUrl: personUpload?.url || req.body.personImageUrl,
      garmentImageUrl: garmentUpload?.url || req.body.garmentImageUrl,
      removeBackground: req.body.removeBackground === "true" || req.body.removeBackground === true
    });

    const plan = await recordTryOnUsage(access.user);

    return res.json({
      ...result,
      plan,
      uploads: {
        person: personUpload,
        garment: garmentUpload
      }
    });
  } catch (error) {
    return next(error);
  }
  }
);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: "Upload anh khong hop le.", errors: [err.message] });
  }

  return res.status(err.statusCode || 500).json({
    message: err.message || "Có lỗi server.",
    code: err.code,
    plan: err.plan,
    errors: [err.message]
  });
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`FitStyle AI API running at http://127.0.0.1:${port}`);
    });
  })
  .catch((error) => {
    console.error("Cannot connect database:", error);
    process.exit(1);
  });

