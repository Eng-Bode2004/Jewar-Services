import ChiefProfileSchema from "../Models/ChiefProfileSchema.js";

class ChiefProfileService {

    // 1️⃣ Create a new Chief Profile
    async createProfile(data) {
        try {
            const profile = await ChiefProfileSchema.create(data);
            return { status: "success", profile };
        } catch (error) {
            throw new Error(error.message || "Failed to create Chief Profile");
        }
    }

    // 2️⃣ Get a profile by ID
    async getProfileById(profileId) {
        try {
            const profile = await ChiefProfileSchema.findById(profileId)
            if (!profile) throw new Error("Profile not found");
            return { status: "success", profile };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch Chief Profile");
        }
    }

    // 3️⃣ Get all profiles with optional filters
    async getAllProfiles(filter = {}) {
        try {
            const profiles = await ChiefProfileSchema.find(filter)
            return { status: "success", profiles };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch profiles");
        }
    }

    // 4️⃣ Update profile by ID
    async updateProfile(profileId, updateData) {
        try {
            const updatedProfile = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                updateData,
                { new: true }
            );
            if (!updatedProfile) throw new Error("Profile not found");
            return { status: "success", updatedProfile };
        } catch (error) {
            throw new Error(error.message || "Failed to update profile");
        }
    }

    // 5️⃣ Delete profile by ID
    async deleteProfile(profileId) {
        try {
            const deleted = await ChiefProfileSchema.findByIdAndDelete(profileId);
            if (!deleted) throw new Error("Profile not found");
            return { status: "success", message: "Profile deleted successfully" };
        } catch (error) {
            throw new Error(error.message || "Failed to delete profile");
        }
    }

    // 6️⃣ Optional: Verify profile
    async verifyProfile(profileId) {
        try {
            const verifiedProfile = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                { Is_Verified: true },
                { new: true }
            );
            if (!verifiedProfile) throw new Error("Profile not found");
            return { status: "success", verifiedProfile };
        } catch (error) {
            throw new Error(error.message || "Failed to verify profile");
        }
    }

}

export default new ChiefProfileService();
