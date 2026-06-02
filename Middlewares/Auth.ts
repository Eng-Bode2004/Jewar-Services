import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            error: "Authentication required",
            statusCode: 401,
        });
        return;
    }

    const token = authHeader.split(" ")[1] as string;

    try {
        const JWT_SECRET: string = process.env.JWT_SECRET ?? "savora_jwt_secret_dev";
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload || typeof payload === "string") {
            res.status(401).json({ error: "Invalid token", statusCode: 401 });
            return;
        }
        const decoded = payload as { id: string; role?: string; iat?: number; exp?: number };

        req.userId = decoded.id;
        req.userRole = decoded.role;

        next();
    } catch {
        res.status(401).json({
            error: "Invalid or expired token",
            statusCode: 401,
        });
    }
}
