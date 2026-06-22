import type {Request,Response} from "express";
import ChiefProfileServices from "../Services/ChiefProfileServices";

class ChiefProfileController {

    async create(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.createProfile(req.body);
            res.status(201).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getById(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getProfileById(req.params.id);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getAll(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getAllProfiles();
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async update(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.updateProfile(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async delete(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.deleteProfile(req.params.id);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async verify(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.verifyProfile(req.params.id as string);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async verifyStep(req:Request, res:Response) {
        try {
            const { step, status } = req.body;
            const result = await ChiefProfileServices.verifyStep(req.params.id as string, step, status);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getVerificationSteps(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getVerificationSteps(req.params.id as string);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async uploadHealthCertificate(req:Request, res:Response) {
        try {
            const { certificateUrl } = req.body;
            if (!certificateUrl) {
                res.status(400).json({ status: "error", message: "certificateUrl is required" });
                return;
            }
            const result = await ChiefProfileServices.uploadHealthCertificate(req.params.id as string, certificateUrl);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async uploadPaymentMethod(req:Request, res:Response) {
        try {
            const { provider, details } = req.body;
            if (!provider || !details) {
                res.status(400).json({ status: "error", message: "provider and details are required" });
                return;
            }
            const result = await ChiefProfileServices.uploadPaymentMethod(req.params.id as string, { provider, details });
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async uploadNationalId(req:Request, res:Response) {
        try {
            const { frontImageURL, backImageURL } = req.body;
            if (!frontImageURL || !backImageURL) {
                res.status(400).json({ status: "error", message: "frontImageURL and backImageURL are required" });
                return;
            }
            const result = await ChiefProfileServices.uploadNationalId(req.params.id as string, frontImageURL, backImageURL);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async submitForReview(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.submitForReview(req.params.id as string);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(400).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getPendingVerifications(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getPendingVerifications();
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async approveVerification(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.approveVerification(req.params.id as string);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async rejectVerification(req:Request, res:Response) {
        try {
            const { reason } = req.body;
            const result = await ChiefProfileServices.rejectVerification(req.params.id as string, reason);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

}

export default new ChiefProfileController();
