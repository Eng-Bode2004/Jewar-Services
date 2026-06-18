import mongoose from "mongoose";

const AvailabilityZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    governorate: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },

    polygon: [
        {
            lat: Number,
            lng: Number
        }
    ],

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },

    delivery_fee_base: Number,

    delivery_fee_per_km: Number,


},{timestamps: true});

export default mongoose.model("Availability Zone", AvailabilityZoneSchema);
