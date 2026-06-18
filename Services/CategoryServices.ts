import Category from "../Models/CategorySchema.ts";

class CategoryServices {
    async createCategory(data: { name: string }): Promise<any> {
        const category = await Category.create({ name: data.name });
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
        const category = await Category.findByIdAndDelete(id);
        if (!category) throw new Error("Category not found");
        return category;
    }
}

export default new CategoryServices();
