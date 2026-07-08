import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "customer", "admin"],
      default: "customer"
    },
    plan: {
      type: String,
      enum: ["free", "premium"],
      default: "free"
    },
    premiumUntil: {
      type: Date,
      default: null
    },
    tryOnUsageCount: {
      type: Number,
      default: 0
    },
    tryOnLastUsed: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);

