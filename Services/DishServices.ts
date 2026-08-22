import DishSchema from "../Models/DishSchema.ts";
import DailyStockSchema from "../Models/DailyStockSchema.ts";

const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || "https://jewarimage-services-production.up.railway.app/api/v2/images";

function todayStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

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
            const dishes = await DishSchema.find().sort({ createdAt: -1 });
            return { status: "success", dishes };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch dishes"
            );
        }
    }

    async getByLanguage(lang: string) {
        try {
            const dishes = await DishSchema.find();

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
                    Owner_id: doc.Owner_id,
                    image: doc.image,
                    price: doc.price,
                    unit_type: doc.unit_type,
                    stock_quantity: doc.stock_quantity,
                    stock_type: doc.stock_type,
                    available: doc.available,
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
            const dish = await DishSchema.findById(id);
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

    // All items that belong to a shop owner
    async getByOwner(ownerId: string, includeGlobal = true) {
        try {
            const filter = includeGlobal
                ? { $or: [{ Owner_id: ownerId }, { Owner_id: null }] }
                : { Owner_id: ownerId };
            const dishes = await DishSchema.find(filter).sort({ createdAt: -1 });
            return { status: "success", dishes };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch owner items"
            );
        }
    }

    // Quick stock update (regular inventory shops)
    async updateStock(id: string, data: { stock_quantity?: number; available?: boolean }) {
        try {
            const update: Record<string, unknown> = {};
            if (data.stock_quantity !== undefined) {
                if (data.stock_quantity < 0) throw new Error("stock_quantity must be >= 0");
                update.stock_quantity = data.stock_quantity;
            }
            if (data.available !== undefined) update.available = data.available;
            const dish = await DishSchema.findByIdAndUpdate(id, update, { new: true });
            if (!dish) throw new Error("Dish not found");
            return { status: "success", dish };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to update stock"
            );
        }
    }

    // Set today's stock for a food-shop item (upsert per owner+dish+date)
    async setDailyStock(ownerId: string, dishId: string, quantity: number, date?: string) {
        try {
            if (quantity === undefined || quantity === null || quantity < 0) {
                throw new Error("quantity is required and must be >= 0");
            }
            const dish = await DishSchema.findById(dishId);
            if (!dish) throw new Error("Dish not found");
            const day = date || todayStr();
            const record = await DailyStockSchema.findOneAndUpdate(
                { Owner_id: ownerId, Dish_id: dishId, date: day },
                { quantity_available: quantity },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            return { status: "success", dailyStock: record };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to set daily stock"
            );
        }
    }

    // List a shop's daily stock for a given day (defaults to today),
    // enriched with the item data.
    async getDailyStock(ownerId: string, date?: string) {
        try {
            const day = date || todayStr();
            const records = await DailyStockSchema.find({ Owner_id: ownerId, date: day });
            const dishIds = records.map(r => r.Dish_id);
            const dishes = await DishSchema.find({ _id: { $in: dishIds } });
            const dishMap = new Map(dishes.map(d => [d._id!.toString(), d]));
            const enriched = records.map(r => {
                const d: Record<string, unknown> | null = dishMap.has(r.Dish_id.toString())
                    ? (dishMap.get(r.Dish_id.toString())!.toObject() as Record<string, unknown>)
                    : null;
                return {
                    _id: r._id,
                    Dish_id: r.Dish_id,
                    Owner_id: r.Owner_id,
                    date: r.date,
                    quantity_available: r.quantity_available,
                    quantity_sold: r.quantity_sold,
                    dish: d,
                };
            });
            return { status: "success", date: day, dailyStock: enriched };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch daily stock"
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
