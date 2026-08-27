import mongoose from "mongoose";

const stepStatus = {
    type: String,
    enum: ["pending", "in_progress", "verified", "rejected"],
    default: "pending",
};

const ShopOwnerProfileSchema = new mongoose.Schema({

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

    Commercial_Register: {
        type: String,
    },

    // ── Shop onboarding (Jewar shops) ──
    shop_cover: {
        type: String,
        default: "",
    },

    Tax_Record: {
        type: String,
        default: "",
    },

    Tax_Card: {
        type: String,
        default: "",
    },

    // Shop type: main category (e.g. Food & Restaurants) and its subcategory
    Category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },

    Subcategory_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },

    // ── Verification step statuses (legacy steps kept for backward compat) ──
    Products_Status: stepStatus,

    Address_Status: stepStatus,

    Payment_Method_Status: stepStatus,

    Commercial_Register_Status: stepStatus,

    National_ID_Status: stepStatus,

    // ── Jewar shop verification steps ──
    Shop_Info_Status: stepStatus,

    Tax_Record_Status: stepStatus,

    Tax_Card_Status: stepStatus,

    Verification_Status: {
        type: String,
        enum: ["not_submitted", "pending_review", "approved", "rejected"],
        default: "not_submitted",
    },

    Rejection_Reason: {
        type: String,
    },

    shop_open: {
        type: Boolean,
        default: true,
    },

    // Whether the shop account is active/suspended. Auto-suspended when the
    // platform balance falls below the configured balance_threshold.
    Is_Active: {
        type: Boolean,
        default: true,
    },

    // Tracked platform balance (EGP) used for the auto-suspend threshold check.
    platform_balance: {
        type: Number,
        default: 0,
    },

    shop_address: {
        type: String,
    },

    Payment_Method:{
        provider: { type: String },
        details: { type: String },
    },

    earnings: {
        total: { type: Number, default: 0 },
        this_week: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
    }


}, { timestamps: true });

export default mongoose.model("ShopOwner Profile", ShopOwnerProfileSchema);
