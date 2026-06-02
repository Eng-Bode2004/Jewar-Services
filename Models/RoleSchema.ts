import mongoose from "mongoose"

const RoleSchema = new mongoose.Schema({

    imageUrl:{
        type:String,
    },

    arabic_name:{
        type:String,
    },

    english_name:{
        type:String,
    },

    spanish_name:{
        type:String,
    },

    French_name:{
        type:String,
    },

    Chinese_name:{
        type:String,
    },

    arabic_Description:{
        type:String,
    },

    english_Description:{
        type:String,
    },

    spanish_Description:{
        type:String,
    },

    French_Description:{
        type:String,
    },

    Chinese_Description:{
        type:String,
    },

});

export default mongoose.model("Role", RoleSchema);