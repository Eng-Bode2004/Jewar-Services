import mongoose from "mongoose";

const DishSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    ingredients: [{
        type: String,
        trim: true,
    }],
    Recipe_steps: [{
        type: String,
        trim: true,
    }],
    description: {
        type: String,
        default: "",
    },
    optional: {
        type: String,
        default: "",
    },
    Subcategory_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    image: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export default mongoose.model("Dish", DishSchema);
