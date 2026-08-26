const Chat = require("../Models/ChatSchema").default;

class ChatServices {
  async getOrCreateChat(orderId, participants) {
    try {
      let chat = await Chat.findOne({ order_id: orderId });
      if (!chat) {
        chat = await Chat.create({ order_id: orderId, participants });
      }
      return { status: "success", chat };
    } catch (error) {
      throw new Error(error.message || "Failed to get or create chat");
    }
  }

  async getChatByOrderId(orderId) {
    try {
      const chat = await Chat.findOne({ order_id: orderId });
      return { status: "success", chat: chat || null };
    } catch (error) {
      throw new Error(error.message || "Failed to get chat");
    }
  }

  async sendMessage(orderId, senderId, senderRole, text) {
    try {
      const chat = await Chat.findOne({ order_id: orderId });
      if (!chat) throw new Error("Chat not found for this order");

      const msg = { sender_id: senderId, sender_role: senderRole, text };
      chat.messages.push(msg);
      await chat.save();

      const saved = chat.messages[chat.messages.length - 1];
      return { status: "success", message: saved };
    } catch (error) {
      throw new Error(error.message || "Failed to send message");
    }
  }

  async getMessages(orderId, before, limit = 50) {
    try {
      const chat = await Chat.findOne({ order_id: orderId });
      if (!chat) return { status: "success", messages: [] };

      let msgs = chat.messages;
      if (before) {
        const idx = msgs.findIndex((m) => m._id.toString() === before);
        if (idx > 0) msgs = msgs.slice(0, idx);
      }

      const sliced = msgs.slice(-limit);
      return { status: "success", messages: sliced };
    } catch (error) {
      throw new Error(error.message || "Failed to get messages");
    }
  }
}

module.exports = new ChatServices();
