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
            const subcategoryId = String(req.params.subcategoryId);
            const result = await DishServices.getBySubcategory(subcategoryId);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getByOwner(req: Request, res: Response) {
        try {
            const ownerId = String(req.params.ownerId);
            const includeGlobal = req.query.all === "true";
            const result = await DishServices.getByOwner(ownerId, includeGlobal);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async updateStock(req: Request, res: Response) {
        try {
            const id = String(req.params.id);
            const { stock_quantity, available } = req.body;
            if (stock_quantity === undefined && available === undefined) {
                res.status(400).json({ status: "error", message: "stock_quantity or available is required" });
                return;
            }
            const result = await DishServices.updateStock(id, { stock_quantity, available });
            res.status(200).json(result);
        } catch (error: unknown) {
            const status = error instanceof Error && error.message === "Dish not found" ? 404 : 400;
            res.status(status).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async setDailyStock(req: Request, res: Response) {
        try {
            const { Owner_id, Dish_id, quantity, date } = req.body;
            if (!Owner_id || !Dish_id || quantity === undefined) {
                res.status(400).json({ status: "error", message: "Owner_id, Dish_id and quantity are required" });
                return;
            }
            const result = await DishServices.setDailyStock(Owner_id, Dish_id, Number(quantity), date);
            res.status(200).json(result);
        } catch (error: unknown) {
            const status = error instanceof Error && error.message === "Dish not found" ? 404 : 400;
            res.status(status).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getDailyStock(req: Request, res: Response) {
        try {
            const ownerId = String(req.params.ownerId);
            const date = typeof req.query.date === "string" ? req.query.date : undefined;
            const result = await DishServices.getDailyStock(ownerId, date);
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
