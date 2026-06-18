import SubCategory from "../Models/SubCategorySchema.ts";

class SubCategoryServices {
    async createSubCategory(data: { name: string; categoryId: string }): Promise<any> {
        if (!data.name || !data.name.trim()) throw new Error("Name is required");
        if (!data.categoryId) throw new Error("categoryId is required");
        const sub = await SubCategory.create({
            name: data.name.trim(),
            categoryId: data.categoryId,
        });
        return sub;
    }

    async getSubCategoryById(id: string): Promise<any> {
        const sub = await SubCategory.findById(id).populate("categoryId", "name");
        if (!sub) throw new Error("SubCategory not found");
        return sub;
    }

    async getAllSubCategories(): Promise<any> {
        return await SubCategory.find()
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });
    }

    async updateSubCategory(id: string, data: { name?: string; categoryId?: string; image?: string; description?: string }): Promise<any> {
        const allowed: Record<string, true> = { name: true, categoryId: true, image: true, description: true };
        const updates: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (allowed[key]) updates[key] = data[key as keyof typeof data];
        }
        if (Object.keys(updates).length === 0) throw new Error("No valid fields to update");

        const sub = await SubCategory.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!sub) throw new Error("SubCategory not found");
        return sub;
    }

    async deleteSubCategory(id: string): Promise<any> {
        const sub = await SubCategory.findByIdAndDelete(id);
        if (!sub) throw new Error("SubCategory not found");
        return sub;
    }

    async getSubCategoriesByCategory(categoryId: string): Promise<any> {
        return await SubCategory.find({ categoryId })
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });
    }
}

export default new SubCategoryServices();
