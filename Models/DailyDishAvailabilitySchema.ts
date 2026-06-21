import mongoose from "mongoose";

const DailyDishAvailabilitySchema = new mongoose.Schema({
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
    date: {
        type: String,
        required: true,
    },
    pieces_available: {
        type: Number,
        required: true,
        min: 0,
    },
    pieces_sold: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });

DailyDishAvailabilitySchema.index({ chief_id: 1, dish_id: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyDishAvailability", DailyDishAvailabilitySchema);
