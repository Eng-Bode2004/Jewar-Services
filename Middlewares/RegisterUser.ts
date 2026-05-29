import type { Request, Response, NextFunction } from "express";

interface RegisterBody {
    username: string;
    email?: string;
    password: string;
    confirmPassword: string;
}

export default function validateUserRegistration(
    req: Request<{}, {}, RegisterBody>,
    res: Response,
    next: NextFunction
) {
    const { username, email, password, confirmPassword } = req.body;

    // ─── Required Fields ──────────────────────────────────────────────────────

    if (!username) {
        return res.status(400).json({
            status: "error",
            message: "Please enter username.",
        });
    }

    if (!password) {
        return res.status(400).json({
            status: "error",
            message: "Please enter password.",
        });
    }

    if (!confirmPassword) {
        return res.status(400).json({
            status: "error",
            message: "Please enter confirm password.",
        });
    }

    // ─── Password Match ───────────────────────────────────────────────────────

    if (password !== confirmPassword) {
        return res.status(400).json({
            status: "error",
            message: "Passwords do not match.",
        });
    }

    // ─── Password Strength ────────────────────────────────────────────────────

    const passwordPolicy = {
        minLength: 8,
        hasUpperCase: /[A-Z]/,
        hasLowerCase: /[a-z]/,
        hasNumber: /[0-9]/,
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    };

    if (password.length < passwordPolicy.minLength) {
        return res.status(400).json({
            status: "error",
            message: `Password must be at least ${passwordPolicy.minLength} characters long.`,
        });
    }

    if (!passwordPolicy.hasUpperCase.test(password)) {
        return res.status(400).json({
            status: "error",
            message: "Password must contain at least one uppercase letter.",
        });
    }

    if (!passwordPolicy.hasLowerCase.test(password)) {
        return res.status(400).json({
            status: "error",
            message: "Password must contain at least one lowercase letter.",
        });
    }

    if (!passwordPolicy.hasNumber.test(password)) {
        return res.status(400).json({
            status: "error",
            message: "Password must contain at least one number.",
        });
    }

    if (!passwordPolicy.hasSpecialChar.test(password)) {
        return res.status(400).json({
            status: "error",
            message: "Password must contain at least one special character (e.g. !@#$%).",
        });
    }

    // ─── Username ─────────────────────────────────────────────────────────────

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;

    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
            status: "error",
            message: "Username must be between 3 and 20 characters.",
        });
    }

    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            status: "error",
            message: "Username can only contain letters, numbers, underscores, and dots.",
        });
    }

    if (/^[_.]/.test(username) || /[_.]$/.test(username)) {
        return res.status(400).json({
            status: "error",
            message: "Username cannot start or end with an underscore or dot.",
        });
    }

    if (/[_.]{2,}/.test(username)) {
        return res.status(400).json({
            status: "error",
            message: "Username cannot contain consecutive underscores or dots.",
        });
    }

    // ─── Email ────────────────────────────────────────────────────────────────

    if (email !== undefined && email !== "") {

        // Basic format: local@domain.tld
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: "error",
                message: "Please enter a valid email address.",
            });
        }

        // No consecutive dots anywhere
        if (/\.{2,}/.test(email)) {
            return res.status(400).json({
                status: "error",
                message: "Email address cannot contain consecutive dots.",
            });
        }

        const parts = email.split("@");
        const localPart = parts[0]!;
        const domain = parts[1]!;

        // Local part length (RFC 5321: max 64 chars)
        if (localPart.length > 64) {
            return res.status(400).json({
                status: "error",
                message: "Email local part (before @) cannot exceed 64 characters.",
            });
        }

        // Local part cannot start or end with a dot
        if (localPart.startsWith(".") || localPart.endsWith(".")) {
            return res.status(400).json({
                status: "error",
                message: "Email address cannot start or end with a dot before @.",
            });
        }

        // Domain must have at least one dot
        if (!domain.includes(".")) {
            return res.status(400).json({
                status: "error",
                message: "Email domain is invalid.",
            });
        }

        // TLD must be at least 2 characters (e.g. .io, .com, .dev)
        const tld = domain.split(".").at(-1) ?? "";
        if (tld.length < 2) {
            return res.status(400).json({
                status: "error",
                message: "Email top-level domain (e.g. .com, .io) is too short.",
            });
        }

        // Total email length (RFC 5321: max 254 chars)
        if (email.length > 254) {
            return res.status(400).json({
                status: "error",
                message: "Email address is too long (max 254 characters).",
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    next();
}