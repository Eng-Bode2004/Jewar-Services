import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },

        // ── Multilingual name ──
        arabic_name: { type: String, default: "" },
        english_name: { type: String, default: "" },
        spanish_name: { type: String, default: "" },
        french_name: { type: String, default: "" },
        chinese_name: { type: String, default: "" },

        // ── Multilingual description ──
        arabic_description: { type: String, default: "" },
        english_description: { type: String, default: "" },
        spanish_description: { type: String, default: "" },
        french_description: { type: String, default: "" },
        chinese_description: { type: String, default: "" },

        description: { type: String, default: "" },
        image: { type: String, default: "" },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model("Category", CategorySchema);
