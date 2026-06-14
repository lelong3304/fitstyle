import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    profile: {
      age: String,
      gender: String,
      heightCm: String,
      weightKg: String,
      neckCm: String,
      chestCm: String,
      waistCm: String,
      hipCm: String,
      activityLevel: String,
      goal: String
    },
    photo: {
      received: Boolean,
      filename: String
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

analysisSchema.index({ createdAt: -1 });
analysisSchema.index({ userId: 1, createdAt: -1 });

export const Analysis = mongoose.models.Analysis || mongoose.model("Analysis", analysisSchema);
