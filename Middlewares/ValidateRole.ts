import type { Request, Response, NextFunction } from "express";

interface RoleBody {
    arabic_name?: string;
    english_name?: string;
    spanish_name?: string;
    French_name?: string;
    Chinese_name?: string;
    arabic_Description?: string;
    english_Description?: string;
    spanish_Description?: string;
    French_Description?: string;
    Chinese_Description?: string;
    imageUrl?: string;
}

export default function validateRole(
    req: Request<{}, {}, RoleBody>,
    res: Response,
    next: NextFunction
) {
    const {
        arabic_name,
        english_name,
        arabic_Description,
        english_Description,
    } = req.body;

    if (!arabic_name) {
        return res.status(400).json({
            status: "error",
            message: "Please provide arabic_name.",
        });
    }

    if (!english_name) {
        return res.status(400).json({
            status: "error",
            message: "Please provide english_name.",
        });
    }

    if (!arabic_Description) {
        return res.status(400).json({
            status: "error",
            message: "Please provide arabic_Description.",
        });
    }

    if (!english_Description) {
        return res.status(400).json({
            status: "error",
            message: "Please provide english_Description.",
        });
    }

    next();
}
