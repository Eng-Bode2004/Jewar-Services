import type { Request, Response } from "express";
import CategoryServices from "../Services/CategoryServices.ts";

class CategoryControllers {
    async createCategory(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.body?.name || !req.body.name.trim()) {
                return res.status(400).json({ status: "error", message: "Name is required" });
            }
            const category = await CategoryServices.createCategory(req.body);
            return res.status(201).json({ status: "success", response: category });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Creation failed",
            });
        }
    }

    async getCategoryById(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;
            const category = await CategoryServices.getCategoryById(id);
            return res.status(200).json({ status: "success", response: category });
        } catch (error) {
            return res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Category not found",
            });
        }
    }

    async getAllCategories(_req: Request, res: Response): Promise<Response> {
        try {
            const categories = await CategoryServices.getAllCategories();
            return res.status(200).json({ status: "success", response: categories });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Fetch failed",
            });
        }
    }

    async updateCategory(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;
            const category = await CategoryServices.updateCategory(id, req.body);
            return res.status(200).json({ status: "success", response: category });
        } catch (error) {
            const status = error instanceof Error && error.message === "Category not found" ? 404 : 400;
            return res.status(status).json({
                status: "error",
                message: error instanceof Error ? error.message : "Update failed",
            });
        }
    }

    async deleteCategory(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;
            const category = await CategoryServices.deleteCategory(id);
            return res.status(200).json({ status: "success", response: category });
        } catch (error) {
            return res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Delete failed",
            });
        }
    }
}

export default new CategoryControllers();
