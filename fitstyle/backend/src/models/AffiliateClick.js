import mongoose from "mongoose";

const affiliateClickSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    productId: {
      type: String,
      required: true,
      index: true
    },
    productName: {
      type: String,
      required: true
    },
    bodyShape: {
      type: String,
      default: ""
    },
    affiliateUrl: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

affiliateClickSchema.index({ createdAt: -1 });
affiliateClickSchema.index({ userId: 1, createdAt: -1 });

export const AffiliateClick =
  mongoose.models.AffiliateClick || mongoose.model("AffiliateClick", affiliateClickSchema);
