import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage"
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    maxUses: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
