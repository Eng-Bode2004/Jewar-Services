import mongoose from "mongoose";

const stepStatus = {
    type: String,
    enum: ["pending", "in_progress", "verified", "rejected"],
    default: "pending",
};

const DriverProfileSchema = new mongoose.Schema({

    auth_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        trim: true,
    },

    phone: {
        type: String,
        trim: true,
    },

    profile_image: {
        type: String,
    },

    vehicle: {
        type: {
            type: String,
            enum: ["bike", "scooter", "car", "van"],
        },
        plate: {
            type: String,
            trim: true,
        },
        model: {
            type: String,
            trim: true,
        },
        color: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
    },

    license: {
        number: {
            type: String,
            trim: true,
        },
        expiry: {
            type: String,
        },
        front_image: {
            type: String,
        },
        back_image: {
            type: String,
        },
        vehicle_license_image: {
            type: String,
        },
    },

    documents: {
        id_front: { type: String },
        id_back: { type: String },
        background_check: { type: String },
    },

    Documents_Status: stepStatus,
    Vehicle_Status: stepStatus,
    Background_Check_Status: stepStatus,

    Verification_Status: {
        type: String,
        enum: ["not_submitted", "pending_review", "approved", "rejected"],
        default: "not_submitted",
    },

    Rejection_Reason: {
        type: String,
    },

    Is_Verified: {
        type: Boolean,
        default: false,
    },

    Is_Active: {
        type: Boolean,
        default: true,
    },

    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },

    total_deliveries: {
        type: Number,
        default: 0,
        min: 0,
    },

    earnings: {
        total: { type: Number, default: 0 },
        this_week: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
    },

    online_status: {
        type: Boolean,
        default: false,
    },

    current_location: {
        lat: { type: Number },
        lng: { type: Number },
        updated_at: { type: Date },
    },

    payment_method: {
        bank_name: { type: String },
        account_number: { type: String },
        account_holder: { type: String },
    },

    referral_code: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true,
    },

    referred_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DriverProfile",
    },

}, { timestamps: true });

export default mongoose.model("Driver Profile", DriverProfileSchema);