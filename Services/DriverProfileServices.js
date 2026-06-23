import DriverProfileModel from "../Models/DriverProfileModel.ts";

class DriverProfileService {
    async createProfile(data) {
        try {
            const profile = await DriverProfileModel.create(data);
            return { status: "success", profile };
        } catch (error) {
            throw new Error(error.message || "Failed to create Driver Profile");
        }
    }

    async getProfileById(profileId) {
        try {
            const profile = await DriverProfileModel.findById(profileId);
            if (!profile) throw new Error("Profile not found");
            return { status: "success", profile };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch Driver Profile");
        }
    }

    async getByAuthId(authId) {
        try {
            const profile = await DriverProfileModel.findOne({ auth_id: authId });
            if (!profile) throw new Error("Profile not found");
            return { status: "success", profile };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch Driver Profile by Auth ID");
        }
    }

    async getAllProfiles(filter = {}) {
        try {
            const profiles = await DriverProfileModel.find(filter);
            return { status: "success", profiles };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch profiles");
        }
    }

    async updateProfile(profileId, updateData) {
        try {
            const updatedProfile = await DriverProfileModel.findByIdAndUpdate(
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

    async deleteProfile(profileId) {
        try {
            const deleted = await DriverProfileModel.findByIdAndDelete(profileId);
            if (!deleted) throw new Error("Profile not found");
            return { status: "success", message: "Profile deleted successfully" };
        } catch (error) {
            throw new Error(error.message || "Failed to delete profile");
        }
    }

    async updateVerificationStep(profileId, step, status) {
        try {
            const validSteps = ["Documents_Status", "Vehicle_Status", "Background_Check_Status"];
            if (!validSteps.includes(step)) {
                throw new Error(`Invalid step: ${step}. Must be one of: ${validSteps.join(", ")}`);
            }
            const updated = await DriverProfileModel.findByIdAndUpdate(
                profileId,
                { [step]: status },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");

            // Auto-check if all steps are verified
            if (status === "verified") {
               const check = await DriverProfileModel.findById(profileId);
               if (check.Documents_Status === "verified" && 
                   check.Vehicle_Status === "verified" && 
                   check.Background_Check_Status === "verified") {
                   await DriverProfileModel.findByIdAndUpdate(profileId, { Verification_Status: "pending_review" });
               }
            }

            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to verify step");
        }
    }

    async verifyProfile(profileId, status, rejectionReason) {
         try {
             const update = { Verification_Status: status };
             if (status === "approved") {
                 update.Is_Verified = true;
             } else if (status === "rejected") {
                 update.Is_Verified = false;
                 update.Rejection_Reason = rejectionReason;
             }
             const updated = await DriverProfileModel.findByIdAndUpdate(profileId, update, { new: true });
             if (!updated) throw new Error("Profile not found");
             return { status: "success", profile: updated };
         } catch (error) {
             throw new Error(error.message || "Failed to update verification status");
         }
    }

    async uploadDocument(profileId, docType, fileUrl) {
        try {
            const update = {};
            if (docType === "id_front") update["documents.id_front"] = fileUrl;
            else if (docType === "id_back") update["documents.id_back"] = fileUrl;
            else if (docType === "background_check") update["documents.background_check"] = fileUrl;
            else throw new Error("Invalid document type");

            update.Documents_Status = "in_progress";

            const updated = await DriverProfileModel.findByIdAndUpdate(profileId, update, { new: true });
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload document");
        }
    }

    async uploadLicense(profileId, frontImage, backImage, number, expiry) {
        try {
            const updated = await DriverProfileModel.findByIdAndUpdate(profileId, {
                license: { front_image: frontImage, back_image: backImage, number, expiry },
                Documents_Status: "in_progress" // Since license is part of documents/vehicle validation usually
            }, { new: true });
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload license");
        }
    }

    async setOnlineStatus(profileId, isOnline) {
        try {
            const updated = await DriverProfileModel.findByIdAndUpdate(profileId, { online_status: isOnline }, { new: true });
            if (!updated) throw new Error("Profile not found");
            return { status: "success", online_status: updated.online_status };
        } catch (error) {
            throw new Error(error.message || "Failed to set online status");
        }
    }

    async updateLocation(profileId, lat, lng) {
        try {
            const updated = await DriverProfileModel.findByIdAndUpdate(profileId, {
                current_location: { lat, lng, updated_at: new Date() }
            }, { new: true });
            if (!updated) throw new Error("Profile not found");
            return { status: "success", current_location: updated.current_location };
        } catch (error) {
            throw new Error(error.message || "Failed to update location");
        }
    }

    async updateRating(profileId, rating) {
        try {
            const profile = await DriverProfileModel.findById(profileId);
            if (!profile) throw new Error("Profile not found");
            const newRating = profile.rating === 0 ? rating : (profile.rating + rating) / 2;
            const updated = await DriverProfileModel.findByIdAndUpdate(profileId, { rating: newRating }, { new: true });
            return { status: "success", rating: updated.rating };
        } catch (error) {
            throw new Error(error.message || "Failed to update rating");
        }
    }

    async updateEarnings(profileId, amount) {
         try {
             const updated = await DriverProfileModel.findByIdAndUpdate(profileId, {
                 $inc: { "earnings.total": amount, "earnings.this_week": amount, "earnings.pending": amount, total_deliveries: 1 }
             }, { new: true });
             if (!updated) throw new Error("Profile not found");
             return { status: "success", earnings: updated.earnings };
         } catch (error) {
             throw new Error(error.message || "Failed to update earnings");
         }
    }

    async setPaymentMethod(profileId, bank_name, account_number, account_holder) {
        try {
            const updated = await DriverProfileModel.findByIdAndUpdate(profileId, {
                payment_method: { bank_name, account_number, account_holder }
            }, { new: true });
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to set payment method");
        }
    }

    async getAvailableDrivers(lat, lng, radiusKm = 10) {
        try {
            const drivers = await DriverProfileModel.find({ online_status: true, Is_Verified: true, Is_Active: true });
            return { status: "success", drivers };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch available drivers");
        }
    }
}

export default new DriverProfileService();
