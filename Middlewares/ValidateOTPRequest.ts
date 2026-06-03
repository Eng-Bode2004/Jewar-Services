import type { Request, Response, NextFunction } from "express";

export function validateOTPSend(req: Request, res: Response, next: NextFunction) {
    const { email, phone, userID } = req.body;
    const errors: string[] = [];

    if (!userID || typeof userID !== "string") {
        errors.push("userID is required");
    }

    const path = req.path;
    if (path.includes("email")) {
        if (!email || typeof email !== "string") {
            errors.push("email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("Invalid email format");
        }
    } else if (path.includes("phone") || path.includes("whatsapp")) {
        if (!phone || typeof phone !== "string") {
            errors.push("phone is required");
        } else if (!/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
            errors.push("Invalid phone number format");
        }
    }

    if (errors.length > 0) {
        res.status(400).json({
            error: "Validation failed",
            statusCode: 400,
            details: errors,
        });
        return;
    }

    next();
}

export function validateOTPVerify(req: Request, res: Response, next: NextFunction) {
    const { userID, otp_code } = req.body;
    const errors: string[] = [];

    if (!userID || typeof userID !== "string") {
        errors.push("userID is required");
    }

    if (!otp_code || typeof otp_code !== "string") {
        errors.push("otp_code is required");
    } else if (otp_code.length < 4 || otp_code.length > 6) {
        errors.push("otp_code must be 4-6 characters");
    } else if (!/^\d+$/.test(otp_code)) {
        errors.push("otp_code must be numeric");
    }

    if (errors.length > 0) {
        res.status(400).json({
            error: "Validation failed",
            statusCode: 400,
            details: errors,
        });
        return;
    }

    next();
}
