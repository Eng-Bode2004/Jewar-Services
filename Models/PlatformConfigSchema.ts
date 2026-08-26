import mongoose from "mongoose";

const PlatformConfigSchema = new mongoose.Schema(
  {
    app_fee_percent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    default_delivery_fee: {
      type: Number,
      default: 15,
      min: 0,
    },
    delivery_fee_per_km: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Singleton pattern — one config document per platform.
PlatformConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      app_fee_percent: 10,
      default_delivery_fee: 15,
      delivery_fee_per_km: 0,
    });
  }
  return config;
};

export default mongoose.model("PlatformConfig", PlatformConfigSchema);
