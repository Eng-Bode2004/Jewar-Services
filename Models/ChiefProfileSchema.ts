import mongoose from "mongoose";

const stepStatus = {
    type: String,
    enum: ["pending", "in_progress", "verified", "rejected"],
    default: "pending",
};

const ChiefProfileSchema = new mongoose.Schema({

    auth_id: {
        type: String,
        index: true,
    },

    phone: {
        type: String,
    },

    National_ID_Front: {
        type: String,
    },

    National_ID_Back: {
        type: String,
    },

    name: {
        type: String,
        required: true
    },

    Max_orders_per_Day: {
        type: Number,
    },

    Is_Verified: {
        type: Boolean,
        default: false,
    },

    profile_image: {
        type: String,
    },

    Health_Certificate: {
        type: String,
    },

    Items_Can_Make_Status: stepStatus,

    Address_Status: stepStatus,

    Payment_Method_Status: stepStatus,

    Health_Certificate_Status: stepStatus,

    National_ID_Status: stepStatus,


    Payment_Method:{
        bank_name: { type: String },
        account_number: { type: String },
        account_holder_name: { type: String },
    }


}, { timestamps: true });

export default mongoose.model("Chief Profile", ChiefProfileSchema);
