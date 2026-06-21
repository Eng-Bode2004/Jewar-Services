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

    // 6️⃣ Verify profile (set Is_Verified = true)
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

    // 7️⃣ Verify a specific step by field name
    async verifyStep(profileId, step, status) {
        try {
            const validSteps = [
                "Items_Can_Make_Status",
                "Address_Status",
                "Payment_Method_Status",
                "Health_Certificate_Status",
                "National_ID_Status",
            ];
            if (!validSteps.includes(step)) {
                throw new Error(`Invalid step: ${step}. Must be one of: ${validSteps.join(", ")}`);
            }
            const validStatuses = ["pending", "in_progress", "verified", "rejected"];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
            }
            const updated = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                { [step]: status },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to verify step");
        }
    }

    // 8️⃣ Get verification steps status
    async getVerificationSteps(profileId) {
        try {
            const profile = await ChiefProfileSchema.findById(profileId).select(
                "Items_Can_Make_Status Address_Status Payment_Method_Status Health_Certificate_Status National_ID_Status Is_Verified"
            );
            if (!profile) throw new Error("Profile not found");
            return { status: "success", steps: profile };
        } catch (error) {
            throw new Error(error.message || "Failed to get verification steps");
        }
    }

    // 9️⃣ Upload health certificate (store URL)
    async uploadHealthCertificate(profileId, certificateUrl) {
        try {
            const updated = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    Health_Certificate: certificateUrl,
                    Health_Certificate_Status: "in_progress",
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload health certificate");
        }
    }

}

export default new ChiefProfileService();
