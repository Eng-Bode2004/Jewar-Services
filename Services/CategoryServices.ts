import mongoose from "mongoose";
import Category from "../Models/CategorySchema.ts";
import SubCategory from "../Models/SubCategorySchema.ts";

const IMAGES_API = process.env.IMAGES_API_URL || "https://savora-imageservices-production.up.railway.app";

class CategoryServices {
    async createCategory(data: Record<string, unknown>): Promise<any> {
        const name = (data.name as string) || (data.english_name as string) || "";
        if (!name.trim()) throw new Error("Name is required");
        const category = await Category.create({ ...data, name: name.trim() });
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

    async getByLanguage(lang: string): Promise<any> {
        const categories = await Category.find().sort({ createdAt: -1 });
        return categories.map((c) => {
            const doc = c.toObject();
            return {
                _id: doc._id,
                name: (doc as any)[`${lang}_name`] || doc.name,
                description: (doc as any)[`${lang}_description`] || doc.description,
                image: doc.image,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            };
        });
    }

    async updateCategory(id: string, data: Record<string, unknown>): Promise<any> {
        const allowed: Record<string, true> = {
            name: true, image: true, description: true,
            arabic_name: true, english_name: true, spanish_name: true, french_name: true, chinese_name: true,
            arabic_description: true, english_description: true, spanish_description: true, french_description: true, chinese_description: true,
        };
        const updates: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (allowed[key]) updates[key] = data[key];
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
