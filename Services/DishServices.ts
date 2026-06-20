import DishSchema from "../Models/DishSchema";

class DishService {
    async create(data: Record<string, unknown>) {
        try {
            const dish = await DishSchema.create(data);
            return { status: "success", dish };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to create dish"
            );
        }
    }

    async getAll() {
        try {
            const dishes = await DishSchema.find().populate("Subcategory_id");
            return { status: "success", dishes };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch dishes"
            );
        }
    }

    async getById(id: string) {
        try {
            const dish = await DishSchema.findById(id).populate("Subcategory_id");
            if (!dish) throw new Error("Dish not found");
            return { status: "success", dish };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch dish"
            );
        }
    }

    async getBySubcategory(subcategoryId: string) {
        try {
            const dishes = await DishSchema.find({ Subcategory_id: subcategoryId });
            return { status: "success", dishes };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch dishes by subcategory"
            );
        }
    }

    async update(id: string, data: Record<string, unknown>) {
        try {
            const dish = await DishSchema.findByIdAndUpdate(id, data, { new: true });
            if (!dish) throw new Error("Dish not found");
            return { status: "success", dish };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to update dish"
            );
        }
    }

    async remove(id: string) {
        try {
            const deleted = await DishSchema.findByIdAndDelete(id);
            if (!deleted) throw new Error("Dish not found");
            return { status: "success", message: "Dish deleted successfully" };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to delete dish"
            );
        }
    }
}

export default new DishService();
