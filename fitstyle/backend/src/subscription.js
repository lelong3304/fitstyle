import { SePayPgClient } from "sepay-pg-node";
import { connectDatabase } from "./db.js";
import { Analysis } from "./models/Analysis.js";
import { SubscriptionOrder } from "./models/SubscriptionOrder.js";
import { User } from "./models/User.js";
import { Coupon } from "./models/Coupon.js";

export const PREMIUM_PRICE = 79000;
export const PREMIUM_DAYS = 30;
export const FREE_TRY_ON_LIMIT = 1;

export function isPremiumUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.plan !== "premium") return false;
  return user.premiumUntil instanceof Date && user.premiumUntil.getTime() > Date.now();
}

export function formatPlan(user) {
  const premium = isPremiumUser(user);
  return {
    plan: premium ? "premium" : "free",
    premium,
    premiumUntil: premium ? user.premiumUntil?.toISOString() : null,
    tryOnUsageCount: user.tryOnUsageCount || 0,
    freeTryOnLimit: FREE_TRY_ON_LIMIT,
    remainingFreeTryOn: premium ? null : Math.max(0, FREE_TRY_ON_LIMIT - (user.tryOnUsageCount || 0))
  };
}

export async function getFreshUser(userId) {
  await connectDatabase();
  return User.findById(userId);
}

export async function assertCanUseTryOn(userId) {
  const user = await getFreshUser(userId);
  if (!user) {
    const error = new Error("Không tìm thấy tài khoản.");
    error.statusCode = 401;
    throw error;
  }

  if (isPremiumUser(user)) return { user, premium: true };

  if ((user.tryOnUsageCount || 0) >= FREE_TRY_ON_LIMIT) {
    const error = new Error("Gói Free chỉ được phối đồ 1 lần. Nâng cấp Premium 79.000đ/tháng để phối đồ không giới hạn.");
    error.statusCode = 402;
    error.code = "PREMIUM_REQUIRED";
    error.plan = formatPlan(user);
    throw error;
  }

  return { user, premium: false };
}

export async function recordTryOnUsage(user) {
  if (!user || isPremiumUser(user)) return formatPlan(user);
  user.tryOnUsageCount = (user.tryOnUsageCount || 0) + 1;
  await user.save();
  return formatPlan(user);
}

function requireSepayConfig() {
  const merchantId = process.env.SEPAY_MERCHANT_ID;
  const secretKey = process.env.SEPAY_MERCHANT_SECRET_KEY;

  if (!merchantId || !secretKey) {
    const error = new Error("Chưa cấu hình SEPAY_MERCHANT_ID hoặc SEPAY_MERCHANT_SECRET_KEY.");
    error.statusCode = 503;
    throw error;
  }

  return { merchantId, secretKey };
}

export async function createPremiumCheckout(userId, clientOrigin = null, couponCode = null) {
  await connectDatabase();
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("Không tìm thấy tài khoản.");
    error.statusCode = 401;
    throw error;
  }

  if (isPremiumUser(user)) {
    return {
      alreadyPremium: true,
      plan: formatPlan(user)
    };
  }

  // Khởi tạo các giá trị thanh toán mặc định
  let finalAmount = PREMIUM_PRICE;
  let discountAmount = 0;
  let validatedCoupon = null;

  if (couponCode && couponCode.trim() !== "") {
    const cleanedCode = couponCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanedCode, isActive: true });
    if (!coupon) {
      const error = new Error("Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa.");
      error.statusCode = 400;
      throw error;
    }

    if (coupon.usedCount >= coupon.maxUses) {
      const error = new Error("Mã giảm giá đã hết lượt sử dụng.");
      error.statusCode = 400;
      throw error;
    }

    validatedCoupon = coupon;
    if (coupon.type === "percentage") {
      discountAmount = Math.round((PREMIUM_PRICE * coupon.value) / 100);
    } else if (coupon.type === "fixed") {
      discountAmount = coupon.value;
    }
    finalAmount = Math.max(0, PREMIUM_PRICE - discountAmount);
  }

  const { merchantId, secretKey } = requireSepayConfig();
  
  // Sử dụng clientOrigin động từ request nếu hợp lệ, ngược lại dùng fallback cấu hình
  let frontendOrigin = clientOrigin;
  if (!frontendOrigin || !frontendOrigin.startsWith("http")) {
    const originStr = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    const origins = originStr.split(",").map(o => o.trim());
    frontendOrigin = origins.find(o => o.startsWith("https://")) || origins[0];
  }

  if (frontendOrigin && frontendOrigin.includes("127.0.0.1")) {
    frontendOrigin = frontendOrigin.replace("127.0.0.1", "localhost");
  }

  const invoiceNumber = `FS${Date.now()}${String(user._id).slice(-4)}`.toUpperCase();

  // Xử lý nâng cấp miễn phí nếu mã giảm giá giảm 100% (finalAmount == 0)
  if (validatedCoupon && finalAmount === 0) {
    const baseDate = user.premiumUntil instanceof Date && user.premiumUntil > new Date() ? user.premiumUntil : new Date();
    const premiumUntil = new Date(baseDate.getTime() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);

    user.plan = "premium";
    user.premiumUntil = premiumUntil;
    await user.save();

    const order = await SubscriptionOrder.create({
      userId: user._id,
      invoiceNumber,
      amount: 0,
      originalAmount: PREMIUM_PRICE,
      discountAmount: discountAmount,
      couponCode: validatedCoupon.code,
      status: "paid",
      paidAt: new Date(),
      rawPayload: { note: "Kích hoạt miễn phí bằng mã giảm giá 100%" }
    });

    validatedCoupon.usedCount = (validatedCoupon.usedCount || 0) + 1;
    await validatedCoupon.save();

    return {
      freeUpgrade: true,
      alreadyPremium: true,
      plan: formatPlan(user),
      order: {
        id: order._id.toString(),
        invoiceNumber,
        amount: 0,
        currency: "VND",
        status: "paid"
      }
    };
  }

  const order = await SubscriptionOrder.create({
    userId: user._id,
    invoiceNumber,
    amount: finalAmount,
    originalAmount: PREMIUM_PRICE,
    discountAmount: discountAmount,
    couponCode: validatedCoupon?.code || null
  });

  const client = new SePayPgClient({
    env: process.env.SEPAY_ENV || "sandbox",
    merchant_id: merchantId,
    secret_key: secretKey
  });

  const checkoutUrl = client.checkout.initCheckoutUrl();
  const checkoutFields = client.checkout.initOneTimePaymentFields({
    payment_method: "BANK_TRANSFER",
    order_invoice_number: invoiceNumber,
    order_amount: finalAmount,
    currency: "VND",
    order_description: `Nang cap FitStyle AI Premium ${invoiceNumber}`,
    success_url: `${frontendOrigin}/premium?payment=success&invoice=${invoiceNumber}`,
    error_url: `${frontendOrigin}/premium?payment=error&invoice=${invoiceNumber}`,
    cancel_url: `${frontendOrigin}/premium?payment=cancel&invoice=${invoiceNumber}`
  });

  return {
    order: {
      id: order._id.toString(),
      invoiceNumber,
      amount: finalAmount,
      currency: "VND",
      status: order.status
    },
    checkoutUrl,
    checkoutFields
  };
}

export async function activatePremiumByInvoice(invoiceNumber, payload = null) {
  await connectDatabase();
  const order = await SubscriptionOrder.findOne({ invoiceNumber });
  if (!order) {
    const error = new Error("Không tìm thấy hóa đơn Premium.");
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(order.userId);
  if (!user) {
    const error = new Error("Không tìm thấy tài khoản của hóa đơn.");
    error.statusCode = 404;
    throw error;
  }

  if (order.status !== "paid") {
    const baseDate = user.premiumUntil instanceof Date && user.premiumUntil > new Date() ? user.premiumUntil : new Date();
    const premiumUntil = new Date(baseDate.getTime() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);

    user.plan = "premium";
    user.premiumUntil = premiumUntil;
    await user.save();

    order.status = "paid";
    order.paidAt = new Date();
    order.rawPayload = payload;
    await order.save();

    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode });
      if (coupon) {
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
      }
    }
  } else {
    order.rawPayload = payload;
    await order.save();
  }

  return {
    plan: formatPlan(user),
    order: {
      invoiceNumber: order.invoiceNumber,
      status: order.status,
      amount: order.amount,
      paidAt: order.paidAt?.toISOString()
    }
  };
}

function mealOptions(day, calories) {
  const breakfast = Math.round(calories * 0.25);
  const lunch = Math.round(calories * 0.35);
  const dinner = Math.round(calories * 0.3);
  const snack = calories - breakfast - lunch - dinner;
  const proteins = ["ức gà", "cá hồi", "trứng", "thịt bò nạc", "đậu hũ", "tôm", "sữa chua Hy Lạp"];
  const carbs = ["cơm gạo lứt", "khoai lang", "yến mạch", "bún gạo", "bánh mì nguyên cám", "mì soba"];
  const veg = ["salad rau xanh", "bông cải", "dưa leo", "cà rốt", "rau luộc", "nấm áp chảo"];
  const p = proteins[day % proteins.length];
  const c = carbs[day % carbs.length];
  const v = veg[day % veg.length];

  return {
    breakfast: `Bữa sáng khoảng ${breakfast} kcal: yến mạch hoặc bánh mì nguyên cám, trứng/sữa chua, thêm trái cây.`,
    lunch: `Bữa trưa khoảng ${lunch} kcal: ${p}, ${c}, ${v}.`,
    dinner: `Bữa tối khoảng ${dinner} kcal: protein nạc, nhiều rau, tinh bột vừa phải.`,
    snack: `Bữa phụ khoảng ${snack} kcal: trái cây, hạt, sữa chua hoặc whey nếu cần đủ protein.`
  };
}

export async function getPremiumMealPlan(userId) {
  const user = await getFreshUser(userId);
  if (!isPremiumUser(user)) {
    const error = new Error("Lịch ăn 30 ngày chỉ dành cho gói Premium.");
    error.statusCode = 402;
    error.code = "PREMIUM_REQUIRED";
    error.plan = formatPlan(user);
    throw error;
  }

  const latest = await Analysis.findOne({ userId }).sort({ createdAt: -1 }).lean();
  const targetCalories = latest?.result?.metrics?.targetCalories || 2000;
  const direction = latest?.result?.health?.direction || "Duy trì sức khỏe";

  const days = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const calories = Math.round(targetCalories + ((index % 5) - 2) * 45);
    return {
      day,
      calories,
      focus: day % 7 === 0 ? "Ngày linh hoạt, giữ tổng calo và protein" : direction,
      ...mealOptions(index, calories)
    };
  });

  return {
    targetCalories,
    direction,
    generatedFromLatestAnalysis: Boolean(latest),
    days
  };
}
