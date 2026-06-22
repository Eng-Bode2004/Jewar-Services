import mongoose from "mongoose"

const PaymentProviderModel = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },

    Provider: {
        type: String,
        required: true,
        unique: true
    },

    type: {
        type: String // 'card','wallet','bank','offline'
    },

    key: {
        type: String, // wallet/account number customers send money to
        default: ''
    },

    is_active: {
        type: Boolean,
        default: true
    },



},{timestamps:true})

export default mongoose.model('Payment Provider', PaymentProviderModel)