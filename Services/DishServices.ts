import DishSchema from "../Models/DishSchema.ts";

const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || "https://savora-imageservices-production.up.railway.app/api/v2/images";

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

    async getByLanguage(lang: string) {
        try {
            const dishes = await DishSchema.find().populate("Subcategory_id");

            const mapped = dishes.map((d) => {
                const doc = d.toObject();
                return {
                    _id: doc._id,
                    name: doc[`${lang}_name` as keyof typeof doc] || doc.english_name,
                    ingredients: doc[`${lang}_ingredients` as keyof typeof doc] || doc.english_ingredients,
                    Recipe_steps: doc[`${lang}_Recipe_steps` as keyof typeof doc] || doc.english_Recipe_steps,
                    description: doc[`${lang}_description` as keyof typeof doc] || doc.english_description,
                    optional: doc[`${lang}_optional` as keyof typeof doc] || doc.english_optional,
                    Subcategory_id: doc.Subcategory_id,
                    image: doc.image,
                    price: doc.price,
                    unit_type: doc.unit_type,
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                };
            });

            return { status: "success", dishes: mapped };
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
            const dish = await DishSchema.findById(id);
            if (!dish) throw new Error("Dish not found");

            // Delete associated image from Images-Services
            if (dish.image) {
                const imageId = dish.image.split("/").pop();
                if (imageId && imageId.length === 24) {
                    try {
                        await fetch(`${IMAGE_SERVICE_URL}/${imageId}`, { method: "DELETE" });
                    } catch {
                        console.warn("⚠️ Failed to delete image from Images-Services");
                    }
                }
            }

            await DishSchema.findByIdAndDelete(id);
            return { status: "success", message: "Dish deleted successfully" };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to delete dish"
            );
        }
    }
}

export default new DishService();
