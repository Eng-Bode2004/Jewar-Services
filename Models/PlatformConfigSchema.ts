import mongoose from "mongoose";

const PlatformConfigSchema = new mongoose.Schema(
  {
    // Legacy single app fee (kept for backward compatibility).
    app_fee_percent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    // App fee % applied to the shop's food total (shop_fee_percent if set,
    // falls back to app_fee_percent).
    shop_fee_percent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    // App fee % applied to the driver's delivery fee.
    driver_fee_percent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Platform balance threshold (EGP). Shops/drivers whose tracked
    // platform balance falls below this value are auto-suspended.
    balance_threshold: {
      type: Number,
      default: 0,
      min: 0,
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
      shop_fee_percent: 10,
      driver_fee_percent: 0,
      balance_threshold: 0,
      default_delivery_fee: 15,
      delivery_fee_per_km: 0,
    });
  }
  return config;
};

export default mongoose.model("PlatformConfig", PlatformConfigSchema);
