import type { Request, Response } from "express";
import OTPServices from "../Services/OTPServices.ts";

class OTPControllers {

    async sendEmailOTP(req: Request, res: Response) {
        try {
            const { email, userID } = req.body;
            const result = await OTPServices.sendEmailOTP(email, userID);

            res.status(200).json({
                message: result.message,
                statusCode: 200,
                expiresInMinutes: result.expiresInMinutes,
            });
        } catch (error: unknown) {
            res.status(400).json({
                error: error instanceof Error ? error.message : "Failed to send email OTP",
                statusCode: 400,
            });
        }
    }

    async sendPhoneOTP(req: Request, res: Response) {
        try {
            const { phone, userID } = req.body;
            const result = await OTPServices.sendPhoneOTP(phone, userID);

            res.status(200).json({
                message: result.message,
                statusCode: 200,
                expiresInMinutes: result.expiresInMinutes,
            });
        } catch (error: unknown) {
            res.status(400).json({
                error: error instanceof Error ? error.message : "Failed to send phone OTP",
                statusCode: 400,
            });
        }
    }

    async sendWhatsAppOTP(req: Request, res: Response) {
        try {
            const { phone, userID } = req.body;
            const result = await OTPServices.sendWhatsAppOTP(phone, userID);

            res.status(200).json({
                message: result.message,
                statusCode: 200,
                expiresInMinutes: result.expiresInMinutes,
            });
        } catch (error: unknown) {
            res.status(400).json({
                error: error instanceof Error ? error.message : "Failed to send WhatsApp OTP",
                statusCode: 400,
            });
        }
    }

    async verifyOTP(req: Request, res: Response) {
        try {
            const { userID, otp_code } = req.body;
            const result = await OTPServices.verifyOTP(userID, otp_code);

            res.status(200).json({
                message: result.message,
                statusCode: 200,
            });
        } catch (error: unknown) {
            let status = 400;
            if (error instanceof Error) {
                if (error.message.includes("expired")) status = 410;
                if (error.message.includes("No active OTP")) status = 404;
                if (error.message.includes("Too many")) status = 429;
            }
            res.status(status).json({
                error: error instanceof Error ? error.message : "Verification failed",
                statusCode: status,
            });
        }
    }

    async getOTPHistory(req: Request, res: Response) {
        try {
            const userID = req.params.userID as string;
            const history = await OTPServices.getOTPHistory(userID);

            res.status(200).json({
                message: "OTP history fetched successfully",
                statusCode: 200,
                data: history,
            });
        } catch (error: unknown) {
            res.status(500).json({
                error: error instanceof Error ? error.message : "Failed to fetch OTP history",
                statusCode: 500,
            });
        }
    }
}

export default new OTPControllers();
