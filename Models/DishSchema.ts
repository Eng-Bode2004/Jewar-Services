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

    // ── Relations ──
    Subcategory_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },

    // ── Image ──
    image: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export default mongoose.model("Dish", DishSchema);
