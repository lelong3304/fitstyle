import { connectDatabase, hasMongoConfig } from "./db.js";
import { AffiliateClick } from "./models/AffiliateClick.js";
import { Analysis } from "./models/Analysis.js";
import { Product } from "./models/Product.js";
import { User } from "./models/User.js";

export async function getAdminDashboard() {
  if (!hasMongoConfig()) {
    const error = new Error("Dashboard admin can MongoDB.");
    error.statusCode = 503;
    throw error;
  }

  await connectDatabase();

  const [
    totalUsers,
    adminUsers,
    customerUsers,
    totalAnalyses,
    analysesWithPhoto,
    totalProducts,
    activeProducts,
    inactiveProducts,
    totalAffiliateClicks,
    recentUsers,
    recentAnalyses,
    clicksByProduct,
    bodyShapeRows,
    productCategoryRows,
    dailyAnalysisRows,
    dailyClickRows
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: { $in: ["customer", "user"] } }),
    Analysis.countDocuments(),
    Analysis.countDocuments({ "photo.received": true }),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: false }),
    AffiliateClick.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt").lean(),
    Analysis.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("profile result createdAt")
      .lean(),
    AffiliateClick.aggregate([
      { $group: { _id: "$productId", productName: { $last: "$productName" }, clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 8 }
    ]),
    Analysis.aggregate([
      { $group: { _id: "$result.metrics.bodyShape.key", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } },
      { $sort: { count: -1 } }
    ]),
    aggregateDaily(Analysis),
    aggregateDaily(AffiliateClick)
  ]);

  return {
    totals: {
      users: totalUsers,
      admins: adminUsers,
      customers: customerUsers,
      analyses: totalAnalyses,
      analysesWithPhoto,
      products: totalProducts,
      activeProducts,
      inactiveProducts,
      affiliateClicks: totalAffiliateClicks,
      tryOnReadyProducts: activeProducts
    },
    conversion: {
      clicksPerAnalysis: totalAnalyses ? round(totalAffiliateClicks / totalAnalyses, 2) : 0,
      photoAnalysisRate: totalAnalyses ? round((analysesWithPhoto / totalAnalyses) * 100, 1) : 0,
      activeProductRate: totalProducts ? round((activeProducts / totalProducts) * 100, 1) : 0
    },
    recentUsers: recentUsers.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: toIso(user.createdAt)
    })),
    recentAnalyses: recentAnalyses.map((analysis) => ({
      id: analysis._id.toString(),
      createdAt: toIso(analysis.createdAt),
      gender: analysis.profile?.gender || "",
      bmi: analysis.result?.metrics?.bmi || null,
      bodyShape: analysis.result?.metrics?.bodyShape?.label || analysis.result?.metrics?.bodyShape?.key || "Chưa có dáng",
      outfitScore: analysis.result?.vision?.outfitFit?.score ?? null
    })),
    topProducts: clicksByProduct.map((row) => ({
      productId: row._id,
      name: row.productName,
      clicks: row.clicks
    })),
    bodyShapes: bodyShapeRows
      .filter((row) => row._id)
      .map((row) => ({ key: row._id, count: row.count })),
    productCategories: productCategoryRows
      .filter((row) => row._id)
      .map((row) => ({ category: row._id, count: row.count, active: row.active })),
    daily: {
      analyses: fillLast7Days(dailyAnalysisRows),
      clicks: fillLast7Days(dailyClickRows)
    }
  };
}

function aggregateDaily(model) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return model.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

function fillLast7Days(rows) {
  const rowMap = new Map(rows.map((row) => [row._id, row.count]));
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    days.push({ date: key, count: rowMap.get(key) || 0 });
  }

  return days;
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}
