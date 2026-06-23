import PreferredDishChiefSchema from "../Models/PreferredDishChiefSchema";
import DailyDishAvailabilitySchema from "../Models/DailyDishAvailabilitySchema";
import mongoose from "mongoose";

const DISH_SERVICE_URL = process.env.DISH_SERVICE_URL || "http://localhost:5002/api/v1/dishes";

const ChiefProfileSchema = new mongoose.Schema({
    kitchen_open: { type: Boolean, default: true },
}, { strict: false });
const ChiefProfile = mongoose.models["Chief Profile"] || mongoose.model("Chief Profile", ChiefProfileSchema);

class PreferredDishChiefService {
    // ── Preferred Dishes ─────────────────────────────────────────────────

    async setPreferred(chiefId: string, dishId: string, preferred: boolean) {
        try {
            const doc = await PreferredDishChiefSchema.findOneAndUpdate(
                { chief_id: chiefId, dish_id: dishId },
                { chief_id: chiefId, dish_id: dishId, preferred },
                { upsert: true, new: true }
            );
            return { status: "success", preferred: doc };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to set preferred dish"
            );
        }
    }

    async getPreferredByChief(chiefId: string) {
        try {
            const preferred = await PreferredDishChiefSchema.find({
                chief_id: chiefId,
                preferred: true,
            });
            const enriched = await Promise.all(preferred.map(async (p) => {
                const doc: any = p.toObject ? p.toObject() : { ...p };
                try {
                    const res = await fetch(`${DISH_SERVICE_URL}/${p.dish_id}`);
                    if (res.ok) {
                        const dishData: any = await res.json();
                        const dish = dishData.dish || dishData;
                        doc.dish_name = dish.english_name || dish.name || '';
                    }
                } catch { /* ignore */ }
                return doc;
            }));
            return { status: "success", preferred: enriched };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch preferred dishes"
            );
        }
    }

    async removePreferred(chiefId: string, dishId: string) {
        try {
            await PreferredDishChiefSchema.findOneAndDelete({
                chief_id: chiefId,
                dish_id: dishId,
            });
            return { status: "success", message: "Preferred dish removed" };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to remove preferred dish"
            );
        }
    }

    // ── Daily Availability ───────────────────────────────────────────────

    async setDailyAvailability(
        chiefId: string,
        dishId: string,
        date: string,
        piecesAvailable: number
    ) {
        try {
            const availability = await DailyDishAvailabilitySchema.findOneAndUpdate(
                { chief_id: chiefId, dish_id: dishId, date },
                {
                    chief_id: chiefId,
                    dish_id: dishId,
                    date,
                    pieces_available: piecesAvailable,
                },
                { upsert: true, new: true }
            );

            // If this dish is in the chief's preferred list, fetch the recipe
            const isPreferred = await PreferredDishChiefSchema.findOne({
                chief_id: chiefId,
                dish_id: dishId,
                preferred: true,
            });

            let recipe: Record<string, unknown> | null = null;
            if (isPreferred) {
                try {
                    const res = await fetch(`${DISH_SERVICE_URL}/${dishId}`);
                    if (res.ok) {
                        const dishData: any = await res.json();
                        const dish = dishData.dish || dishData;
                        recipe = {
                            name: dish.english_name || dish.name || '',
                            ingredients: dish.ingredients,
                            Recipe_steps: dish.Recipe_steps,
                            description: dish.description,
                            image: dish.image,
                        };
                    }
                } catch {
                    // Recipe fetch failed — return availability without recipe
                }
            }

            return {
                status: "success",
                availability,
                ...(recipe ? { recipe } : {}),
            };
        } catch (error) {
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to set daily availability"
            );
        }
    }

    async getAvailabilityByChiefAndDate(chiefId: string, date: string) {
        try {
            const availabilities = await DailyDishAvailabilitySchema.find({
                chief_id: chiefId,
                date,
            });
            // Enrich with dish names
            const enriched = await Promise.all(availabilities.map(async (a) => {
                const doc: any = a.toObject ? a.toObject() : { ...a };
                try {
                    const res = await fetch(`${DISH_SERVICE_URL}/${a.dish_id}`);
                    if (res.ok) {
                        const dishData: any = await res.json();
                        const dish = dishData.dish || dishData;
                        doc.dish_name = dish.english_name || dish.name || '';
                    }
                } catch { /* ignore */ }
                return doc;
            }));
            return { status: "success", availabilities: enriched };
        } catch (error) {
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch availabilities"
            );
        }
    }

    async getAvailabilityByDishAndDate(dishId: string, date: string) {
        try {
            const availabilities = await DailyDishAvailabilitySchema.find({
                dish_id: dishId,
                date,
            });
            return { status: "success", availabilities };
        } catch (error) {
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch availabilities"
            );
        }
    }

    async getAvailabilityByDate(date: string) {
        try {
            const availabilities = await DailyDishAvailabilitySchema.find({ date });
            return { status: "success", availabilities };
        } catch (error) {
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch availabilities"
            );
        }
    }

    async updatePiecesSold(
        chiefId: string,
        dishId: string,
        date: string,
        piecesSold: number
    ) {
        try {
            const availability = await DailyDishAvailabilitySchema.findOneAndUpdate(
                { chief_id: chiefId, dish_id: dishId, date },
                { $inc: { pieces_sold: piecesSold } },
                { new: true }
            );
            if (!availability) throw new Error("Availability record not found");
            return { status: "success", availability };
        } catch (error) {
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to update pieces sold"
            );
        }
    }

    // ── Best Chef Assignment ────────────────────────────────────────────

    async findBestChef(items: { dish_id: string; qty: number }[], date: string) {
        try {
            const dishIds = [...new Set(items.map(i => i.dish_id))];

            // Find all chefs who have ANY of these dishes available today
            const all = await DailyDishAvailabilitySchema.find({
                dish_id: { $in: dishIds },
                date,
            });

            // Group by chef
            const chefMap = new Map<string, Map<string, { available: number; pieces_sold: number }>>();
            for (const a of all) {
                const cid = a.chief_id.toString();
                if (!chefMap.has(cid)) chefMap.set(cid, new Map());
                chefMap.get(cid)!.set(a.dish_id.toString(), {
                    available: a.pieces_available,
                    pieces_sold: a.pieces_sold,
                });
            }

            // Filter out chefs whose kitchen is closed
            const chefIds = [...chefMap.keys()];
            const openChefs = await ChiefProfile.find({
                _id: { $in: chefIds },
                kitchen_open: { $ne: false },
            }).select("_id");
            const openIds = new Set(openChefs.map((c: any) => c._id.toString()));
            for (const cid of chefIds) {
                if (!openIds.has(cid)) chefMap.delete(cid);
            }

            // Evaluate each chef
            let bestChef: string | null = null;
            let bestScore = -1;

            for (const [chefId, dishMap] of chefMap) {
                let canFulfillAll = true;
                let totalRemaining = 0;

                for (const item of items) {
                    const stock = dishMap.get(item.dish_id);
                    if (!stock) { canFulfillAll = false; break; }
                    const remaining = stock.available - stock.pieces_sold;
                    if (remaining < item.qty) { canFulfillAll = false; break; }
                    totalRemaining += remaining;
                }

                if (canFulfillAll && totalRemaining > bestScore) {
                    bestScore = totalRemaining;
                    bestChef = chefId;
                }
            }

            if (!bestChef) {
                throw new Error("No chef available to fulfill this order");
            }

            return { status: "success", chef_id: bestChef };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to find best chef"
            );
        }
    }

    // ── Dashboard ────────────────────────────────────────────────────────

    async getDashboard(date: string) {
        try {
            const availabilities = await DailyDishAvailabilitySchema.find({ date });
            return { status: "success", date, availabilities };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch dashboard"
            );
        }
    }
}

export default new PreferredDishChiefService();
