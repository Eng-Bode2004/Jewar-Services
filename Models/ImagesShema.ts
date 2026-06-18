import mongoose from "mongoose";

const ImagesSchema = new mongoose.Schema({
    URL:{
        type: String,
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
    },

},{timestamps: true});

export default mongoose.model("Images", ImagesSchema);