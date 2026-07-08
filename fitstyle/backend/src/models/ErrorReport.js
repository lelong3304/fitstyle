import mongoose from "mongoose";

const errorReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    screenshotUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const ErrorReport = mongoose.models.ErrorReport || mongoose.model("ErrorReport", errorReportSchema);
