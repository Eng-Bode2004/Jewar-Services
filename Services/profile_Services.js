import Profile from "../Models/profile_Schema.ts";
import crypto from "crypto";

class CustomerProfileServices {

  async createProfile(data) {
    const profile = await Profile.create(data);
    return profile;
  }

  async editProfile(id, data) {
    const allowed = ["name", "email", "phone", "address", "avatar", "Is_Verified"];
    const updates = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    const profile = await Profile.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!profile) throw new Error("Profile not found");
    return profile;
  }

  async deleteProfile(id) {
    const profile = await Profile.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
    if (!profile) throw new Error("Profile not found");
    return profile;
  }

  async getProfileById(id) {
    const profile = await Profile.findById(id);
    if (!profile) throw new Error("Profile not found");
    return profile;
  }

  async getProfileByAuthId(authId) {
    const profile = await Profile.findOne({ auth_id: authId });
    if (!profile) throw new Error("Profile not found");
    return profile;
  }

  async getAllProfiles() {
    return await Profile.find({ status: "active" }).sort({ createdAt: -1 });
  }

  async generateReferralCode(id) {
    const profile = await Profile.findById(id);
    if (!profile) throw new Error("Profile not found");
    if (profile.referral_code) return profile;

    let code;
    let exists = true;
    while (exists) {
      const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
      code = `SAVORA-${rand}`;
      exists = await Profile.findOne({ referral_code: code });
    }
    profile.referral_code = code;
    await profile.save();
    return profile;
  }

  async applyReferralCode(code, customerId) {
    const referrer = await Profile.findOne({ referral_code: code.toUpperCase() });
    if (!referrer) throw new Error("Invalid referral code");

    const customer = await Profile.findById(customerId);
    if (!customer) throw new Error("Customer not found");
    if (customer.referred_by) throw new Error("Customer already used a referral code");

    const points = 50;
    referrer.points += points;
    await referrer.save();

    customer.referred_by = referrer._id;
    await customer.save();

    return { referrer, customer, pointsAwarded: points };
  }

  async addPoints(id, points) {
    const profile = await Profile.findById(id);
    if (!profile) throw new Error("Profile not found");
    profile.points += Math.abs(points);
    await profile.save();
    return profile;
  }

  async deductPoints(id, points) {
    const profile = await Profile.findById(id);
    if (!profile) throw new Error("Profile not found");
    const deduction = Math.abs(points);
    if (profile.points < deduction) throw new Error("Insufficient points");
    profile.points -= deduction;
    await profile.save();
    return profile;
  }
}

export default new CustomerProfileServices();
