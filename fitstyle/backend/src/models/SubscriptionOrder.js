import mongoose from "mongoose";

const subscriptionOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      default: 79000
    },
    currency: {
      type: String,
      default: "VND"
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "failed"],
      default: "pending",
      index: true
    },
    provider: {
      type: String,
      default: "sepay"
    },
    couponCode: {
      type: String,
      default: null,
      uppercase: true,
      trim: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    originalAmount: {
      type: Number,
      default: 79000
    },
    paidAt: {
      type: Date,
      default: null
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const SubscriptionOrder =
  mongoose.models.SubscriptionOrder || mongoose.model("SubscriptionOrder", subscriptionOrderSchema);
