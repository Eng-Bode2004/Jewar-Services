import PlatformConfigSchema from "../Models/PlatformConfigSchema.js";

class PlatformConfigServices {
  async getConfig() {
    return PlatformConfigSchema.getConfig();
  }

  async updateConfig(data) {
    const config = await PlatformConfigSchema.getConfig();
    const allowed = ["app_fee_percent", "default_delivery_fee", "delivery_fee_per_km"];
    for (const key of allowed) {
      if (data[key] !== undefined && data[key] !== null) {
        config[key] = data[key];
      }
    }
    await config.save();
    return { status: "success", config };
  }
}

export default new PlatformConfigServices();
