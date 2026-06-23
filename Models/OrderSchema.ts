import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  dish_id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  add_ons: [{ name: String, price: Number }],
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  customer_id: { type: String, required: true, index: true },
  customer_name: { type: String },
  chef_id: { type: String, index: true },
  items: { type: [OrderItemSchema], required: true },
  total: { type: Number, required: true },
  payment_method: { type: String },
  payment_image: { type: String },
  transaction_status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  order_status: {
    type: String,
    enum: ["pending", "accepted", "preparing", "ready", "completed", "cancelled"],
    default: "pending",
  },
  delivery_address: {
    street: String,
    city: String,
    country: String,
    label: String,
  },
  rejection_reason: { type: String },
}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);
