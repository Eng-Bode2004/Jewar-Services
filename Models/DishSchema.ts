import mongoose from "mongoose";

const DishSchema = new mongoose.Schema({
    // ── Multilingual name ──
    arabic_name: { type: String, default: "" },
    english_name: { type: String, required: true, trim: true },
    spanish_name: { type: String, default: "" },
    french_name: { type: String, default: "" },
    chinese_name: { type: String, default: "" },

    // ── Multilingual ingredients ──
    arabic_ingredients: [{ type: String, trim: true }],
    english_ingredients: [{ type: String, trim: true }],
    spanish_ingredients: [{ type: String, trim: true }],
    french_ingredients: [{ type: String, trim: true }],
    chinese_ingredients: [{ type: String, trim: true }],

    // ── Multilingual recipe steps ──
    arabic_Recipe_steps: [{ type: String, trim: true }],
    english_Recipe_steps: [{ type: String, trim: true }],
    spanish_Recipe_steps: [{ type: String, trim: true }],
    french_Recipe_steps: [{ type: String, trim: true }],
    chinese_Recipe_steps: [{ type: String, trim: true }],

    // ── Multilingual description ──
    arabic_description: { type: String, default: "" },
    english_description: { type: String, default: "" },
    spanish_description: { type: String, default: "" },
    french_description: { type: String, default: "" },
    chinese_description: { type: String, default: "" },

    // ── Multilingual optional notes ──
    arabic_optional: [{ type: String, trim: true }],
    english_optional: [{ type: String, trim: true }],
    spanish_optional: [{ type: String, trim: true }],
    french_optional: [{ type: String, trim: true }],
    chinese_optional: [{ type: String, trim: true }],

    // ── Extras / Add-ons ──
    extras: [{
        name: { type: String, default: "" },
        price: { type: Number, default: 0, min: 0 },
    }],

    // ── Relations ──
    Subcategory_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },

    // Shop owner this item belongs to (null = global catalog item)
    Owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShopOwner Profile",
        default: null,
        index: true,
    },

    // ── Pricing & Unit ──
    price: { type: Number, default: 0, min: 0 },
    unit_type: { type: String, enum: ["kg", "pieces"], default: "pieces" },

    // ── Stock ──
    // stock_type "daily"    → food shops: owner sets the available quantity each day
    // stock_type "regular"  → other shops: standard inventory count
    stock_quantity: { type: Number, default: 0, min: 0 },
    stock_type: { type: String, enum: ["daily", "regular"], default: "regular" },
    available: { type: Boolean, default: true },

    // ── Ratings (running average updated from completed customer orders) ──
    rating: { type: Number, default: 0, min: 0, max: 5 },
    rating_count: { type: Number, default: 0, min: 0 },

    // ── Image ──
    image: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export default mongoose.model("Dish", DishSchema);
