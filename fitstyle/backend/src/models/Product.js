import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    brand: {
      type: String,
      default: "Shopee",
      trim: true,
      maxlength: 80
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true
    },
    gender: {
      type: String,
      enum: ["unisex", "male", "female"],
      default: "unisex",
      index: true
    },
    price: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    affiliateUrl: {
      type: String,
      required: true,
      trim: true
    },
    bodyShapeTags: {
      type: [String],
      default: [],
      index: true
    },
    styleTags: {
      type: [String],
      default: []
    },
    occasionTags: {
      type: [String],
      default: []
    },
    colors: {
      type: [String],
      default: []
    },
    fit: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120
    },
    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    },
    sourceUrl: {
      type: String,
      default: "",
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1, category: 1, gender: 1 });

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
