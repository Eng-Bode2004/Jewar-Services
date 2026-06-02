import type { Request, Response, NextFunction } from "express";

export function validateRegistration(req: Request, res: Response, next: NextFunction) {
    const { username, password, email, phone_number } = req.body;
    const errors: string[] = [];

    if (!username || typeof username !== "string") {
        errors.push("Username is required");
    } else if (username.length < 3 || username.length > 30) {
        errors.push("Username must be between 3 and 30 characters");
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push("Username can only contain letters, numbers, and underscores");
    }

    if (!password || typeof password !== "string") {
        errors.push("Password is required");
    } else if (password.length < 6) {
        errors.push("Password must be at least 6 characters");
    }

    if (!email && !phone_number) {
        errors.push("Either email or phone number is required");
    }

    if (email && typeof email === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push("Invalid email format");
        }
    }

    if (phone_number && typeof phone_number === "string") {
        const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
        if (!phoneRegex.test(phone_number)) {
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
