import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender_id: { type: String, required: true },
  sender_role: { type: String, enum: ["customer", "driver", "chef"], required: true },
  // The recipient this single message is addressed to. Isolates each
  // conversation (customer<->chef, customer<->driver, driver<->chef) inside
  // the shared per-order chat so other participants never see it.
  to_id: { type: String, index: true },
  text: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
}, { _id: false });

const ChatSchema = new mongoose.Schema({
  order_id: { type: String, required: true, index: true },
  participants: {
    type: [{
      id: String,
      role: { type: String, enum: ["customer", "driver", "chef"] },
      name: String,
    }],
    required: true,
  },
  messages: { type: [MessageSchema], default: [] },
}, { timestamps: true });

ChatSchema.index({ order_id: 1 });

export default mongoose.model("Chat", ChatSchema);
