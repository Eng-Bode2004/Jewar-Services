import mongoose from "mongoose";

const CustomerProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    referral_code: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerProfile",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CustomerProfile", CustomerProfileSchema);
