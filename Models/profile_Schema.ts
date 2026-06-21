import mongoose from "mongoose";

const CustomerProfileSchema = new mongoose.Schema(
  {
    auth_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
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
    Is_Verified: {
      type: Boolean,
      default: false,
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
