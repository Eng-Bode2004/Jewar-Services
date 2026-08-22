import mongoose from "mongoose";

// Advertising banners uploaded by shop owners from their dashboard.
// Shown in the customer app home carousel.
const AdSchema = new mongoose.Schema({
    owner_id: {
        type: String,
        index: true,
        required: true,
    },

    shop_name: {
        type: String,
        default: "",
    },

    image_url: {
        type: String,
        required: true,
    },

    title: {
        type: String,
        default: "",
    },

    subtitle: {
        type: String,
        default: "",
    },

    active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default mongoose.model("Ad", AdSchema);
