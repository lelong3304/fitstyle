import { bodyShapeOptions, getProduct as getStaticProduct, listProducts as listStaticProducts, normalizeBodyShapeKey } from "./catalog.js";
import { connectDatabase, hasMongoConfig } from "./db.js";
import { AffiliateClick } from "./models/AffiliateClick.js";
import { Product } from "./models/Product.js";

const allowedShapeKeys = new Set(bodyShapeOptions.map((shape) => shape.key));
const fallbackCategories = [...new Set(listStaticProducts().map((product) => product.category))].sort();
const fallbackStyles = [...new Set(listStaticProducts().flatMap((product) => product.styleTags || []))].sort();

export async function listCatalogProducts({ bodyShape, category, gender, style, includeInactive = false } = {}) {
  if (hasMongoConfig()) {
    await connectDatabase();
    const count = await Product.countDocuments();

    if (count > 0) {
      const filter = {};
      if (!includeInactive) filter.isActive = true;
      if (category) filter.category = category;
      if (gender) filter.gender = { $in: ["unisex", gender] };
      if (style) filter.styleTags = style;

      const normalizedShape = normalizeBodyShapeKey(bodyShape);
      if (normalizedShape) filter.bodyShapeTags = normalizedShape;

      const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
      const categories = await Product.distinct("category", includeInactive ? {} : { isActive: true });
      const styles = await Product.distinct("styleTags", includeInactive ? {} : { isActive: true });
      const clickCounts = await getClickCounts(products.map((product) => product._id.toString()));

      return {
        products: products.map((product) => ({
          ...normalizeMongoProduct(product),
          clickCount: clickCounts.get(product._id.toString()) || 0
        })),
        categories: categories.sort(),
        styles: styles.filter(Boolean).sort(),
        source: "mongodb"
      };
    }
  }

  return {
    products: listStaticProducts({ bodyShape, category, gender, style }),
    categories: fallbackCategories,
    styles: fallbackStyles,
    source: "static"
  };
}

export async function getCatalogProduct(productId) {
  if (hasMongoConfig()) {
    await connectDatabase();
    const product = await Product.findById(productId).lean().catch(() => null);
    if (product) return normalizeMongoProduct(product);
  }

  return getStaticProduct(productId);
}

export async function createCatalogProduct(payload, user) {
  if (!hasMongoConfig()) {
    const error = new Error("Them san pham can MongoDB. Hay cau hinh MONGODB_URI truoc.");
    error.statusCode = 503;
    throw error;
  }

  await connectDatabase();

  const product = await Product.create({
    ...sanitizeProductPayload(payload),
    createdBy: user?.id || null
  });

  return normalizeMongoProduct(product);
}

export async function updateCatalogProduct(productId, payload) {
  if (!hasMongoConfig()) {
    const error = new Error("Cap nhat san pham can MongoDB.");
    error.statusCode = 503;
    throw error;
  }

  await connectDatabase();

  const product = await Product.findByIdAndUpdate(productId, sanitizeProductPayload(payload), {
    new: true,
    runValidators: true
  }).lean();

  if (!product) {
    const error = new Error("Khong tim thay san pham.");
    error.statusCode = 404;
    throw error;
  }

  return normalizeMongoProduct(product);
}

export async function patchCatalogProduct(productId, payload) {
  if (!hasMongoConfig()) {
    const error = new Error("Cap nhat san pham can MongoDB.");
    error.statusCode = 503;
    throw error;
  }

  await connectDatabase();

  const allowedPatch = {};
  if (typeof payload.isActive === "boolean") allowedPatch.isActive = payload.isActive;

  const product = await Product.findByIdAndUpdate(productId, allowedPatch, {
    new: true,
    runValidators: true
  }).lean();

  if (!product) {
    const error = new Error("Khong tim thay san pham.");
    error.statusCode = 404;
    throw error;
  }

  return normalizeMongoProduct(product);
}

export async function deleteCatalogProduct(productId) {
  if (!hasMongoConfig()) {
    const error = new Error("Xoa san pham can MongoDB.");
    error.statusCode = 503;
    throw error;
  }

  await connectDatabase();
  const product = await Product.findByIdAndDelete(productId).lean();

  if (!product) {
    const error = new Error("Khong tim thay san pham.");
    error.statusCode = 404;
    throw error;
  }

  return normalizeMongoProduct(product);
}

export function sanitizeProductPayload(payload = {}) {
  const bodyShapeTags = normalizeList(payload.bodyShapeTags).map(normalizeBodyShapeKey).filter((tag) => allowedShapeKeys.has(tag));
  const product = {
    name: cleanText(payload.name),
    brand: cleanText(payload.brand) || "Shopee",
    category: cleanText(payload.category),
    gender: ["male", "female", "unisex"].includes(payload.gender) ? payload.gender : "unisex",
    price: cleanText(payload.price),
    imageUrl: cleanText(payload.imageUrl),
    affiliateUrl: cleanText(payload.affiliateUrl),
    bodyShapeTags,
    styleTags: normalizeList(payload.styleTags),
    occasionTags: normalizeList(payload.occasionTags),
    colors: normalizeList(payload.colors),
    fit: cleanText(payload.fit),
    reason: cleanText(payload.reason),
    sourceUrl: cleanText(payload.sourceUrl),
    isActive: payload.isActive !== false
  };

  const errors = [];
  if (!product.name) errors.push("Ten san pham la bat buoc.");
  if (!product.category) errors.push("Nhom san pham la bat buoc.");
  if (!isHttpUrl(product.imageUrl)) errors.push("Image URL phai la link http/https hop le.");
  if (!isHttpUrl(product.affiliateUrl)) errors.push("Affiliate URL phai la link http/https hop le.");
  if (product.bodyShapeTags.length === 0) errors.push("Can chon it nhat 1 dang nguoi phu hop.");

  if (errors.length > 0) {
    const error = new Error("Du lieu san pham chua hop le.");
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  return product;
}

function normalizeMongoProduct(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    brand: product.brand,
    category: product.category,
    gender: product.gender,
    price: product.price,
    imageUrl: product.imageUrl,
    affiliateUrl: product.affiliateUrl,
    bodyShapeTags: product.bodyShapeTags || [],
    styleTags: product.styleTags || [],
    occasionTags: product.occasionTags || [],
    colors: product.colors || [],
    fit: product.fit,
    reason: product.reason,
    sourceUrl: product.sourceUrl || "",
    isActive: product.isActive,
    clickCount: product.clickCount || 0,
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt
  };
}

async function getClickCounts(productIds) {
  if (productIds.length === 0) return new Map();

  const rows = await AffiliateClick.aggregate([
    { $match: { productId: { $in: productIds } } },
    { $group: { _id: "$productId", count: { $sum: 1 } } }
  ]);

  return new Map(rows.map((row) => [row._id, row.count]));
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map(cleanText)
    .filter(Boolean);
}

function cleanText(value) {
  return String(value || "").trim();
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
