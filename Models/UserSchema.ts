import mongoose from "mongoose";

// ── Constants ────────────────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = [
    "arabic",
    "english",
    "french",
    "spanish",
    "chinese",
];

// ─────────────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
    {
        username: {
            type:     String,
            required: true,
            unique:   true,
            trim:     true,
            minlength: 3,
            maxlength: 30,
        },

        // ── Phone ───────────────────────────────────────────────────────────────
        phone_number: {
            type:   String,
            unique: true,
            sparse: true,   // allows multiple null values safely
            trim:   true,
        },


        // ── Email ───────────────────────────────────────────────────────────────
        email: {
            type:   String,
            unique: true,
            sparse: true,
            trim:   true,
            lowercase: true,
        },


        // ── Password ─────────────────────────────────────────────────────────────
        password: {
            type:     String,
            required: true,
            select:   false,
        },

        // ── Status ───────────────────────────────────────────────────────────────
        isActive: {
            type:    Boolean,
            default: false,
        },

        // ── References ───────────────────────────────────────────────────────────
        profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Profile",
        },

        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Role",
        },

        // ── Auth Tokens ──────────────────────────────────────────────────────────
        refreshToken: {
            type:    String,
            default: null,
            select:  false,  // sensitive — exclude from queries
        },

        // ── Preferences ──────────────────────────────────────────────────────────
        language: {
            type:    String,
            default: "arabic",
            enum:    SUPPORTED_LANGUAGES,
            lowercase: true,
        },

        // ── Verification ──────────────────────────────────────────────────────────

        isUserVerified: {
            type:    Boolean,
            default: false,
        },

    },

    // ── Schema Options ─────────────────────────────────────────────────────────
    {
        timestamps: true,
        versionKey: false,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Compound index for faster auth lookups
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ phone_number: 1, isActive: 1 });



export default mongoose.model("User", UserSchema);