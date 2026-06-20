import type { Request, Response } from "express";
import DishServices from "../Services/DishServices";

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

    async getById(req: Request, res: Response) {
        try {
            const result = await DishServices.getById(req.params.id);
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
            const result = await DishServices.getBySubcategory(req.params.subcategoryId);
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
            const result = await DishServices.update(req.params.id, req.body);
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
            const result = await DishServices.remove(req.params.id);
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
