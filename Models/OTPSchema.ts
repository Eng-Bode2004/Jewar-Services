import mongoose from "mongoose";

// ── Constants ─────────────────────────────────────────────────────────────────
const DELIVERY_METHODS = ["email", "phone", "whatsapp"];

const OTP_EXPIRES_AFTER_MINUTES = 10;

// ─────────────────────────────────────────────────────────────────────────────
const OTPSchema = new mongoose.Schema(
    {
        // ── Owner ─────────────────────────────────────────────────────────────────
        userID: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      "User",
            required: true,
            index:    true,
        },

        // ── OTP Value ─────────────────────────────────────────────────────────────
        otp_code: {
            type:      String,
            required:  true,
            minlength: 4,
            maxlength: 6,
            select:    false,
        },

        // ── Delivery ──────────────────────────────────────────────────────────────
        phone: {
            type:  String,
            trim:  true,
        },

        delivery_method: {
            type:     String,
            required: true,
            enum:     DELIVERY_METHODS,
            lowercase: true,
        },

        // ── Status ────────────────────────────────────────────────────────────────
        is_used: {
            type:    Boolean,
            default: false,
        },

        // ── Timing ────────────────────────────────────────────────────────────────

        expires_at: {
            type:    Date,
            default: () =>
                new Date(Date.now() + OTP_EXPIRES_AFTER_MINUTES * 60 * 1000),
        },

        // tracks how many times user tried wrong code
        attempts: {
            type:    Number,
            default: 0,
            max:     5,
        },
    },

    {
        timestamps: true,  // [BUG-4] createdAt + updatedAt automatic
        versionKey: false,
    }
);

// ── TTL Index ─────────────────────────────────────────────────────────────────
OTPSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Faster lookup when verifying: find by userID + code + not used
OTPSchema.index({ userID: 1, is_used: 1 });

export default mongoose.model("OTP", OTPSchema);