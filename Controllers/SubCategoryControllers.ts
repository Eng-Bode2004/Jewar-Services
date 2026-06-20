import type { Request, Response } from "express";
import SubCategoryServices from "../Services/SubCategoryServices.ts";

class SubCategoryControllers {
    async createSubCategory(req: Request, res: Response): Promise<Response> {
        try {
            const sub = await SubCategoryServices.createSubCategory(req.body);
            return res.status(201).json({ status: "success", response: sub });
        } catch (error) {
            const status = error instanceof Error && (
                error.message === "Name is required" || error.message === "categoryId is required"
            ) ? 400 : 500;
            return res.status(status).json({
                status: "error",
                message: error instanceof Error ? error.message : "Creation failed",
            });
        }
    }

    async getSubCategoryById(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;
            const sub = await SubCategoryServices.getSubCategoryById(id);
            return res.status(200).json({ status: "success", response: sub });
        } catch (error) {
            return res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "SubCategory not found",
            });
        }
    }

    async getAllSubCategories(_req: Request, res: Response): Promise<Response> {
        try {
            const subs = await SubCategoryServices.getAllSubCategories();
            return res.status(200).json({ status: "success", response: subs });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Fetch failed",
            });
        }
    }

    async getByLanguage(req: Request, res: Response): Promise<Response> {
        try {
            const lang = req.params.lang as string;
            const subs = await SubCategoryServices.getByLanguage(lang);
            return res.status(200).json({ status: "success", response: subs });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Fetch failed",
            });
        }
    }

    async getSubCategoriesByCategory(req: Request, res: Response): Promise<Response> {
        try {
            const categoryId = req.params.categoryId as string;
            const subs = await SubCategoryServices.getSubCategoriesByCategory(categoryId);
            return res.status(200).json({ status: "success", response: subs });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Fetch failed",
            });
        }
    }

    async updateSubCategory(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;
            const sub = await SubCategoryServices.updateSubCategory(id, req.body);
            return res.status(200).json({ status: "success", response: sub });
        } catch (error) {
            const status = error instanceof Error && error.message === "SubCategory not found" ? 404 : 400;
            return res.status(status).json({
                status: "error",
                message: error instanceof Error ? error.message : "Update failed",
            });
        }
    }

    async deleteSubCategory(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;
            const sub = await SubCategoryServices.deleteSubCategory(id);
            return res.status(200).json({ status: "success", response: sub });
        } catch (error) {
            return res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Delete failed",
            });
        }
    }
}

export default new SubCategoryControllers();
