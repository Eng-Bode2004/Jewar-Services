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

        isPhoneVerified: {
            type:    Boolean,
            default: false,
        },

        // ── Email ───────────────────────────────────────────────────────────────
        email: {
            type:   String,
            unique: true,
            sparse: true,   // [BUG-3] sparse prevents unique-index crash on null
            trim:   true,
            lowercase: true,
        },

        isEmailVerified: {
            type:    Boolean,
            default: false,
        },

        // ── Password ─────────────────────────────────────────────────────────────
        // [BUG-4] renamed Password → password (camelCase convention)
        password: {
            type:     String,
            required: true,
            select:   false,  // never returned in queries by default
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
            default: "arabic",          // [BUG-1] was: default: arabic (no quotes)
            enum:    SUPPORTED_LANGUAGES, // [BUG-2] was: enum:"arabic","french",...
            lowercase: true,
        },
    },

    // ── Schema Options ─────────────────────────────────────────────────────────
    {
        timestamps: true, // [BUG-5] adds createdAt + updatedAt automatically
        versionKey: false,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Compound index for faster auth lookups
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ phone_number: 1, isActive: 1 });



export default mongoose.model("User", UserSchema);