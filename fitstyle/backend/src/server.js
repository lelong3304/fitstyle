import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { getAdminDashboard } from "./adminDashboard.js";
import { analyzeProfile, validateProfile } from "./analysis.js";
import { loginUser, registerUser, requireAdmin, requireAuth } from "./auth.js";
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

app.get("/api/auth/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

app.get("/api/admin/dashboard", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const dashboard = await getAdminDashboard();
    return res.json({ dashboard });
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
    const personUpload = await uploadTryOnImage(req.files?.personImage?.[0], "person");
    const garmentUpload = await uploadTryOnImage(req.files?.garmentImage?.[0], "garment");
    const result = await createTryOn({
      personImageUrl: personUpload?.url || req.body.personImageUrl,
      garmentImageUrl: garmentUpload?.url || req.body.garmentImageUrl,
      removeBackground: req.body.removeBackground === "true" || req.body.removeBackground === true
    });

    return res.json({
      ...result,
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

  return res.status(err.statusCode || 500).json({ message: err.message || "Có lỗi server.", errors: [err.message] });
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
