import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({

    Profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        required: true,
    },

    longitude: {
        type: Number,
        required: true,
    },

    latitude: {
        type: Number,
        required: true,
    },

    country: {
        type: String,
    },

    governorate: {
        type: String,
    },

    city: {
        type: String,
    },

    street: {
        type: String,
    },

    building_Number: {
        type: String,
    },

    apartment: {
        type: String,
    },

    floor: {
        type: String,
    },

    label: {
        type: String,
    },

    address_type: {
        type: String,
        enum: ["home", "work", "other"],
        default: "home",
    },

    is_primary: {
        type: Boolean,
        default: false,
    },

    zone_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Availability Zone",
    },

}, { timestamps: true });

export default mongoose.model("Address", AddressSchema);
