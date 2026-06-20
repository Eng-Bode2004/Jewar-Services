import mongoose from "mongoose";
import SubCategory from "../Models/SubCategorySchema.ts";
import "../Models/CategorySchema.ts";

const IMAGES_API = process.env.IMAGES_API_URL || "https://savora-imageservices-production.up.railway.app";

class SubCategoryServices {
    async createSubCategory(data: Record<string, unknown>): Promise<any> {
        const name = (data.name as string) || (data.english_name as string) || "";
        if (!name.trim()) throw new Error("Name is required");
        if (!data.categoryId) throw new Error("categoryId is required");
        const sub = await SubCategory.create({ ...data, name: name.trim(), categoryId: data.categoryId });
        return sub;
    }

    async getSubCategoryById(id: string): Promise<any> {
        const sub = await SubCategory.findById(id).populate("categoryId", "arabic_name english_name spanish_name french_name chinese_name name");
        if (!sub) throw new Error("SubCategory not found");
        return sub;
    }

    async getAllSubCategories(): Promise<any> {
        return await SubCategory.find()
            .populate("categoryId", "arabic_name english_name spanish_name french_name chinese_name name")
            .sort({ createdAt: -1 });
    }

    async getByLanguage(lang: string): Promise<any> {
        const subs = await SubCategory.find()
            .populate("categoryId", "arabic_name english_name spanish_name french_name chinese_name name")
            .sort({ createdAt: -1 });
        return subs.map((s) => {
            const doc = s.toObject();
            const cat = doc.categoryId as any;
            return {
                _id: doc._id,
                name: (doc as any)[`${lang}_name`] || doc.name,
                description: (doc as any)[`${lang}_description`] || doc.description,
                categoryId: cat ? {
                    _id: cat._id,
                    name: (cat as any)[`${lang}_name`] || cat.name,
                } : doc.categoryId,
                image: doc.image,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            };
        });
    }

    async getSubCategoriesByCategory(categoryId: string, lang?: string): Promise<any> {
        const subs = await SubCategory.find({ categoryId })
            .populate("categoryId", "arabic_name english_name spanish_name french_name chinese_name name")
            .sort({ createdAt: -1 });
        if (lang) {
            return subs.map((s) => {
                const doc = s.toObject();
                const cat = doc.categoryId as any;
                return {
                    _id: doc._id,
                    name: (doc as any)[`${lang}_name`] || doc.name,
                    description: (doc as any)[`${lang}_description`] || doc.description,
                    categoryId: cat ? {
                        _id: cat._id,
                        name: (cat as any)[`${lang}_name`] || cat.name,
                    } : doc.categoryId,
                    image: doc.image,
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                };
            });
        }
        return subs;
    }

    async updateSubCategory(id: string, data: Record<string, unknown>): Promise<any> {
        const allowed: Record<string, true> = {
            name: true, categoryId: true, image: true, description: true,
            arabic_name: true, english_name: true, spanish_name: true, french_name: true, chinese_name: true,
            arabic_description: true, english_description: true, spanish_description: true, french_description: true, chinese_description: true,
        };
        const updates: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (allowed[key]) updates[key] = data[key];
        }
        if (Object.keys(updates).length === 0) throw new Error("No valid fields to update");

        const sub = await SubCategory.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!sub) throw new Error("SubCategory not found");
        return sub;
    }

    async deleteSubCategory(id: string): Promise<any> {
        const sub = await SubCategory.findById(id);
        if (!sub) throw new Error("SubCategory not found");

        if (sub.image) {
            await this.deleteImageFromServices(sub.image);
        }

        await SubCategory.findByIdAndDelete(id);
        return sub;
    }


    async getSubCategoriesByCategory(categoryId: string): Promise<any> {
        return await SubCategory.find({ categoryId })
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });
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
            console.error("Failed to delete subcategory image:", err);
        }
    }
}

export default new SubCategoryServices();
