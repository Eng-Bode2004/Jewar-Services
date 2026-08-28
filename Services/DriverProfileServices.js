import DriverProfileModel from "../Models/DriverProfileModel.ts";
import mongoose from "mongoose";

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

    async getLocation(profileId) {
        try {
            const profile = await DriverProfileModel.findById(profileId).select("current_location name phone");
            if (!profile) throw new Error("Profile not found");
            return { status: "success", location: profile.current_location || null, name: profile.name, phone: profile.phone };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch driver location");
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
            const profile = await DriverProfileModel.findById(profileId);
            if (!profile) throw new Error("Profile not found");

            const IMAGES_SVC = process.env.IMAGES_SERVICE_URL || "https://jewarimage-services-production.up.railway.app/api/v2/images";
            async function deleteUrl(url) {
                if(!url) return;
                try {
                    // Best-effort cleanup: hard timeout so a slow/hung Images
                    // service can never block profile deletion.
                    await Promise.race([
                        fetch(`${IMAGES_SVC}/delete-by-url`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url })
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("delete URL timeout")), 8000)),
                    ]);
                } catch(e) {}
            }

            // 1. Delete profile images (concurrently, hard-timed out so a slow
            //    Images service can never block profile deletion)
            const dUrls = [
                profile.profile_image,
                profile?.documents?.id_front,
                profile?.documents?.id_back,
                profile?.license?.front_image,
                profile?.license?.back_image,
                profile?.license?.vehicle_license_image,
                profile?.vehicle?.image,
            ];
            await Promise.allSettled(dUrls.map((u) => deleteUrl(u)));

            const db = mongoose.connection.db;

            // 2. Clear driver from orders (driver_id may be stored as string or ObjectId)
            const didStr = String(profileId);
            let didOid = null;
            try { didOid = new mongoose.Types.ObjectId(didStr); } catch (_) {}
            await db.collection('orders').updateMany(
                didOid ? { $or: [{ driver_id: didStr }, { driver_id: didOid }] } : { driver_id: didStr },
                { $unset: { driver_id: 1, driver_name: 1 } }
            );

            // 3. Delete Address (if driver has one)
            await db.collection('addresses').deleteMany({ Profile_id: new mongoose.Types.ObjectId(profileId) });

            // 4. Delete User from User Service
            if(profile.auth_id) {
                await db.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(profile.auth_id) });
            }

            // 5. Finally delete the profile
            await DriverProfileModel.findByIdAndDelete(profileId);

            return { status: "success", message: "Profile and all related data deleted successfully" };
        } catch (error) {
            throw new Error(error.message || "Failed to delete profile");
        }
    }

    async updateVerificationStep(profileId, step, status) {
        try {
            const validSteps = ["Documents_Status", "Vehicle_Status", "Background_Check_Status", "Verification_Status"];
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
            if (rating === undefined || rating === null) throw new Error("rating is required");
            const profile = await DriverProfileModel.findById(profileId);
            if (!profile) throw new Error("Profile not found");
            const r = Number(rating);
            if (!Number.isFinite(r) || r < 1 || r > 5) throw new Error("rating must be between 1 and 5");
            const count = profile.rating_count || 0;
            const newRating = count === 0
                ? r
                : Math.round(((profile.rating * count) + r) / (count + 1) * 100) / 100;
            const updated = await DriverProfileModel.findByIdAndUpdate(
                profileId,
                { rating: newRating, rating_count: count + 1 },
                { new: true }
            );
            return { status: "success", rating: updated.rating };
        } catch (error) {
            throw new Error(error.message || "Failed to update rating");
        }
    }

    async updateEarnings(profileId, amount, platformFee = 0, balanceThreshold = null) {
         try {
             const profile = await DriverProfileModel.findById(profileId);
             if (!profile) throw new Error("Profile not found");

             profile.earnings.total += amount;
             profile.earnings.this_week += amount;
             profile.earnings.pending += amount;
             profile.total_deliveries += 1;
             if (platformFee) profile.platform_balance += platformFee;

             // Auto-suspend when the platform balance falls below the threshold.
             if (balanceThreshold !== null && profile.platform_balance < balanceThreshold) {
                 profile.Is_Active = false;
             }
             await profile.save();

             return { status: "success", earnings: profile.earnings, platform_balance: profile.platform_balance };
         } catch (error) {
             throw new Error(error.message || "Failed to update earnings");
         }
    }

    async settleEarnings(profileId) {
        try {
            const driver = await DriverProfileModel.findById(profileId);
            if (!driver) throw new Error("Driver not found");
            if (!driver.earnings) driver.earnings = { total: 0, this_week: 0, pending: 0 };
            
            driver.earnings.total += driver.earnings.pending;
            driver.earnings.pending = 0;
            await driver.save();
            return { status: "success", earnings: driver.earnings };
        } catch (error) {
            throw new Error(error.message || "Failed to settle driver earnings");
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
