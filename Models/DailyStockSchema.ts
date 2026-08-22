import mongoose from "mongoose";

// One record per (owner, dish, day). Food-category shops set the available
// quantity every day; it resets by simply creating a new record for the date.
const DailyStockSchema = new mongoose.Schema({
    Owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShopOwner Profile",
        required: true,
    },
    Dish_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dish",
        required: true,
    },
    // YYYY-MM-DD (shop local time)
    date: { type: String, required: true },
    quantity_available: { type: Number, required: true, min: 0 },
    quantity_sold: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

DailyStockSchema.index({ Owner_id: 1, Dish_id: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyStock", DailyStockSchema);
