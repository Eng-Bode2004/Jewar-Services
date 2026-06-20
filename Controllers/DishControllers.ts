import type { Request, Response } from "express";
import DishServices from "../Services/DishServices.ts";

class DishController {
    async create(req: Request, res: Response) {
        try {
            const result = await DishServices.create(req.body);
            res.status(201).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const result = await DishServices.getAll();
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getByLanguage(req: Request, res: Response) {
        try {
            const lang = req.params.lang! as string;
            const result = await DishServices.getByLanguage(lang);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = req.params.id! as string;
            const result = await DishServices.getById(id);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getBySubcategory(req: Request, res: Response) {
        try {
            const subcategoryId = req.params.subcategoryId! as string;
            const result = await DishServices.getBySubcategory(subcategoryId);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const id = req.params.id! as string;
            const result = await DishServices.update(id, req.body);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async remove(req: Request, res: Response) {
        try {
            const id = req.params.id! as string;
            const result = await DishServices.remove(id);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}

export default new DishController();
