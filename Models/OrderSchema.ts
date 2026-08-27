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
  driver_id: { type: String, index: true },
  delivery_fee: { type: Number, default: 15 },
  agreed_delivery_fee: { type: Number },
  delivery_payment_method: { type: String, enum: ["online", "cash"], default: "online" },
  delivery_offers: [
    new mongoose.Schema(
      {
        driver_id: { type: String, required: true },
        driver_name: { type: String },
        amount: { type: Number, required: true },
        status: {
          type: String,
          enum: ["proposed", "accepted", "rejected"],
          default: "proposed",
        },
        created_at: { type: Date, default: Date.now },
      },
      { timestamps: false }
    ),
  ],
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
    enum: ["pending", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"],
    default: "pending",
  },
  delivery_step: {
    type: String,
    enum: ["none", "accepted", "picked_up", "in_transit", "delivered"],
    default: "none",
  },
  // How the driver settled the collected delivery fee with the shop.
  // - method: "cash" (handed cash at shop) or "online" (transferred online)
  // - status: "none" | "cash_handed" | "transfer_pending" | "confirmed"
  driver_delivery_payment: {
    method: { type: String, enum: ["cash", "online"], default: "cash" },
    status: {
      type: String,
      enum: ["none", "cash_handed", "transfer_pending", "confirmed"],
      default: "none",
    },
    amount: { type: Number, default: 0 },
    // Receipt image URL when the driver transfers online to the shop.
    image: { type: String },
    confirmed_at: { type: Date },
  },
  delivery_address: {
    street: String,
    city: String,
    country: String,
    label: String,
  },
  rejection_reason: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  driver_rating: { type: Number, min: 1, max: 5 },
  review_comment: { type: String },
}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);
