import DriverProfileService from "../Services/DriverProfileServices.js";

class DriverProfileController {

    async createProfile(req: any, res: any) {
        try {
            const result = await DriverProfileService.createProfile(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async getProfileById(req: any, res: any) {
        try {
            const result = await DriverProfileService.getProfileById(req.params.id);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(404).json({ status: "error", message: error.message });
        }
    }

    async getByAuthId(req: any, res: any) {
         try {
             const result = await DriverProfileService.getByAuthId(req.params.authId);
             res.status(200).json(result);
         } catch (error: any) {
             res.status(404).json({ status: "error", message: error.message });
         }
    }

    async getAllProfiles(req: any, res: any) {
        try {
            const result = await DriverProfileService.getAllProfiles(req.query);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async updateProfile(req: any, res: any) {
        try {
            const result = await DriverProfileService.updateProfile(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async deleteProfile(req: any, res: any) {
        try {
            const result = await DriverProfileService.deleteProfile(req.params.id);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async updateVerificationStep(req: any, res: any) {
        try {
            const { step, status } = req.body;
            const result = await DriverProfileService.updateVerificationStep(req.params.id, step, status);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async verifyProfile(req: any, res: any) {
         try {
             const { status, rejectionReason } = req.body;
             const result = await DriverProfileService.verifyProfile(req.params.id, status, rejectionReason);
             res.status(200).json(result);
         } catch (error: any) {
             res.status(400).json({ status: "error", message: error.message });
         }
    }

    async uploadDocument(req: any, res: any) {
        try {
            const { docType, fileUrl } = req.body;
            const result = await DriverProfileService.uploadDocument(req.params.id, docType, fileUrl);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async uploadLicense(req: any, res: any) {
        try {
            const { frontImage, backImage, number, expiry } = req.body;
            const result = await DriverProfileService.uploadLicense(req.params.id, frontImage, backImage, number, expiry);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async setOnlineStatus(req: any, res: any) {
        try {
            const { online_status } = req.body;
            const result = await DriverProfileService.setOnlineStatus(req.params.id, online_status);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async updateLocation(req: any, res: any) {
        try {
            const { lat, lng } = req.body;
            const result = await DriverProfileService.updateLocation(req.params.id, lat, lng);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async updateRating(req: any, res: any) {
        try {
            const { rating } = req.body;
            const result = await DriverProfileService.updateRating(req.params.id, rating);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async updateEarnings(req: any, res: any) {
        try {
            const { amount } = req.body;
            const result = await DriverProfileService.updateEarnings(req.params.id, amount);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async setPaymentMethod(req: any, res: any) {
        try {
            const { bank_name, account_number, account_holder } = req.body;
            const result = await DriverProfileService.setPaymentMethod(req.params.id, bank_name, account_number, account_holder);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async getAvailableDrivers(req: any, res: any) {
        try {
            const { lat, lng, radius } = req.query;
            const result = await DriverProfileService.getAvailableDrivers(lat, lng, radius);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async getVerificationSteps(req: any, res: any) {
         try {
             const profileRes = await DriverProfileService.getProfileById(req.params.id);
             const profile = profileRes.profile;
             const steps = {
                 Documents_Status: profile.Documents_Status,
                 Vehicle_Status: profile.Vehicle_Status,
                 Background_Check_Status: profile.Background_Check_Status,
                 Verification_Status: profile.Verification_Status,
                 Is_Verified: profile.Is_Verified
             };
             res.status(200).json({ status: "success", steps });
         } catch (error: any) {
             res.status(400).json({ status: "error", message: error.message });
         }
    }
}

export default new DriverProfileController();
