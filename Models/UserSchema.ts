import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

    username: {
        type: String,
        required:true,
        unique:true,
        trim:true, // It removes The spaces from the word
    },

    phone_number: {
        type: String,
        unique:true,
        sparse: true,
    },

    isActive: {
        type: Boolean,
        default: false,
    },

    email: {
        type: String,
        unique:true,
    },


    ///////////////////////////////////// Password ///////////////////////


    Password: {
        type: String,
        required: true,
    },



    /////////////////////////////////////References Keys///////////////////////

    Profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
    },

    Role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
    },

    //////////////////////////////////////Tokens/////////////////////////////

    refreshToken: {
        type: String,
        default: null
    },

    /////////////////////////////////////////////////////////////////////










})


export default mongoose.model("User", UserSchema);