import mongoose from "mongoose"

const NationalSchema = new mongoose.Schema({


    front_ImageURL:{
        type:String,
    },

    back_ImageURL:{
        type:String,
    },

    ID_Number:{
        type:Number,
        length: 14,
    },

    Gender:{
        type:String,
    },

    Age:{
        type:Number,
    },

    Birth_Date:{
        type:Date,
    },

    Government:{
        type:String,
    }






})


export default mongoose.model('National ID',NationalSchema)