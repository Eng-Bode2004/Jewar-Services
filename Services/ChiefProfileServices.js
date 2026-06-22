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

    // 3️⃣ Get all profiles with optional filters (enriched with address + preferred dishes)
    async getAllProfiles(filter = {}) {
        try {
            const profiles = await ChiefProfileSchema.find(filter)
            const enriched = await Promise.all(profiles.map(async (p) => {
                const doc = p.toObject ? p.toObject() : { ...p };
                const id = doc._id?.toString();
                if (!id) return doc;
                // fetch address
                try {
                    const addrRes = await fetch(`https://savoraaddress-services-production.up.railway.app/api/v1/address/?Profile_id=${id}`);
                    if (addrRes.ok) {
                        const addrData = await addrRes.json();
                        const addrs = addrData?.addresses ?? [];
                        if (addrs.length > 0) doc.address = addrs[0];
                    }
                } catch { /* address unavailable */ }
                // fetch preferred dishes
                try {
                    const prefRes = await fetch(`https://savoradishprefered-services-production.up.railway.app/api/v1/preferred-dishes-chief/preferred/${id}`);
                    if (prefRes.ok) {
                        const prefData = await prefRes.json();
                        doc.preferredDishes = prefData?.preferred ?? [];
                    } else {
                        doc.preferredDishes = [];
                    }
                } catch { doc.preferredDishes = []; }
                return doc;
            }));
            return { status: "success", profiles: enriched };
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

    // 🔟 Upload payment method
    async uploadPaymentMethod(profileId, { provider, details }) {
        try {
            const updated = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    Payment_Method: { provider, details },
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload payment method");
        }
    }

    // 1️⃣1️⃣ Upload national ID images
    async uploadNationalId(profileId, frontImageURL, backImageURL) {
        try {
            const updated = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    National_ID_Front: frontImageURL,
                    National_ID_Back: backImageURL,
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload national ID");
        }
    }

    // 1️⃣2️⃣ Submit for admin review (chef calls this after all steps verified)
    async submitForReview(profileId) {
        try {
            const profile = await ChiefProfileSchema.findById(profileId);
            if (!profile) throw new Error("Profile not found");

            const steps = [
                "Health_Certificate_Status",
                "Address_Status",
                "National_ID_Status",
                "Payment_Method_Status",
                "Items_Can_Make_Status",
            ];
            const pending = steps.filter(s => profile[s] !== "verified");
            if (pending.length > 0) {
                throw new Error(`Cannot submit: incomplete steps: ${pending.join(", ")}`);
            }

            const updated = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                { Verification_Status: "pending_review" },
                { new: true }
            );
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to submit for review");
        }
    }

    // 1️⃣3️⃣ Get all chiefs pending admin review (includes address + preferred dishes)
    async getPendingVerifications() {
        try {
            const profiles = await ChiefProfileSchema.find({
                Verification_Status: "pending_review",
            });
            // enrich each profile with address and preferred dishes
            const enriched = await Promise.all(profiles.map(async (p) => {
                const doc = p.toObject();
                // fetch address from Address-Services
                try {
                    const addrRes = await fetch(`https://savoraaddress-services-production.up.railway.app/api/v1/address/?Profile_id=${doc._id}`);
                    if (addrRes.ok) {
                        const addrData = await addrRes.json();
                        const addrs = addrData?.addresses ?? [];
                        if (addrs.length > 0) {
                            doc.address = addrs[0];
                        }
                    }
                } catch {
                    // address unavailable
                }
                // fetch preferred dishes from PreferredDishChief-Services
                try {
                    const prefRes = await fetch(`https://savoradishprefered-services-production.up.railway.app/api/v1/preferred-dishes-chief/preferred/${doc._id}`);
                    if (prefRes.ok) {
                        const prefData = await prefRes.json();
                        doc.preferredDishes = prefData?.preferred ?? [];
                    } else {
                        doc.preferredDishes = [];
                    }
                } catch {
                    doc.preferredDishes = [];
                }
                return doc;
            }));
            return { status: "success", profiles: enriched };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch pending verifications");
        }
    }

    // 1️⃣4️⃣ Approve verification (admin action)
    async approveVerification(profileId) {
        try {
            const updated = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    Verification_Status: "approved",
                    Is_Verified: true,
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to approve verification");
        }
    }

    // 1️⃣5️⃣ Reject verification (admin action)
    async rejectVerification(profileId, rejectionReason) {
        try {
            const updateFields = { Verification_Status: "rejected" };
            if (rejectionReason) {
                updateFields.Rejection_Reason = rejectionReason;
            }
            const updated = await ChiefProfileSchema.findByIdAndUpdate(
                profileId,
                updateFields,
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to reject verification");
        }
    }

}

export default new ChiefProfileService();
