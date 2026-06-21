import mongoose from "mongoose";

const PreferredDishChiefSchema = new mongoose.Schema({
    chief_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chief Profile",
        required: true,
    },
    dish_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dish",
        required: true,
    },
    preferred: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

PreferredDishChiefSchema.index({ chief_id: 1, dish_id: 1 }, { unique: true });

export default mongoose.model("PreferredDishChief", PreferredDishChiefSchema);
