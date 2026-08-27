const Chat = require("../Models/ChatSchema").default;

class ChatServices {
  async getOrCreateChat(orderId, participants) {
    try {
      let chat = await Chat.findOne({ order_id: orderId });
      if (!chat) {
        chat = await Chat.create({ order_id: orderId, participants });
      } else {
        // Merge any participants that aren't already in the chat so that every
        // role (customer / driver / chef) that touches the chat becomes a
        // participant. This is required for the per-user in-app popup poller
        // (getChatsByUser) to find the chat for each participant.
        const existing = new Set(
          ((chat.participants || []).map((p) => p && p.id)).filter(Boolean)
        );
        let changed = false;
        for (const p of participants || []) {
          if (p && p.id && !existing.has(p.id)) {
            chat.participants.push(p);
            existing.add(p.id);
            changed = true;
          }
        }
        if (changed) await chat.save();
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

  // List every chat the given user is a participant in, newest first. Used by
  // the clients to poll for new inbound chat messages to show as in-app popups.
  async getChatsByUser(userId) {
    try {
      const chats = await Chat.find({ "participants.id": userId }).sort({ updatedAt: -1 });
      return { status: "success", chats };
    } catch (error) {
      throw new Error(error.message || "Failed to get chats for user");
    }
  }
}

module.exports = new ChatServices();
