import mongoose from "mongoose";

const ChiefProfileSchema = new mongoose.Schema({

    National_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "National ID"
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

    profile_image:{
        type: String,
    }

});

export default mongoose.model("Chief Profile", ChiefProfileSchema);
