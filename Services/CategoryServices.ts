import mongoose from "mongoose";
import Category from "../Models/CategorySchema.ts";
import SubCategory from "../Models/SubCategorySchema.ts";

const IMAGES_API = process.env.IMAGES_API_URL || "https://savora-imageservices-production.up.railway.app";

class CategoryServices {
    async createCategory(data: { name: string; image?: string; description?: string }): Promise<any> {
        if (!data.name || !data.name.trim()) throw new Error("Name is required");
        const category = await Category.create({
            name: data.name.trim(),
            image: data.image || "",
            description: data.description || "",
        });
        return category;
    }

    async getCategoryById(id: string): Promise<any> {
        const category = await Category.findById(id);
        if (!category) throw new Error("Category not found");
        return category;
    }

    async getAllCategories(): Promise<any> {
        return await Category.find().sort({ createdAt: -1 });
    }

    async updateCategory(id: string, data: { name?: string; image?: string; description?: string }): Promise<any> {
        const allowed: Record<string, true> = { name: true, image: true, description: true };
        const updates: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (allowed[key]) updates[key] = data[key as keyof typeof data];
        }
        if (Object.keys(updates).length === 0) throw new Error("No valid fields to update");

        const category = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!category) throw new Error("Category not found");
        return category;
    }

    async deleteCategory(id: string): Promise<any> {
        const category = await Category.findById(id);
        if (!category) throw new Error("Category not found");

        if (category.image) {
            await this.deleteImageFromServices(category.image);
        }

        await Category.findByIdAndDelete(id);
        return category;
    }


    async getSubCategoriesByCategory(categoryId: string): Promise<any> {
        const category = await Category.findById(categoryId);
        if (!category) throw new Error("Category not found");
        return await SubCategory.find({ categoryId }).sort({ createdAt: -1 });
    }

    async deleteImageFromServices(imageUrl: string): Promise<void> {
        try {
            const db = mongoose.connection.db;
            if (!db) return;
            const image = await db.collection("images").findOne({ URL: imageUrl });
            if (image && image._id) {
                await fetch(`${IMAGES_API}/api/v2/images/${image._id}`, { method: "DELETE" });
            }
        } catch (err) {
            console.error("Failed to delete category image:", err);
        }
    }
}

export default new CategoryServices();
