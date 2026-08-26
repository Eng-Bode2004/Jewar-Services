const ChatServices = require("../Services/ChatServices");

class ChatControllers {
  async getOrCreateChat(req, res) {
    try {
      const { order_id, participants } = req.body;
      const result = await ChatServices.getOrCreateChat(order_id, participants);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message || "Failed" });
    }
  }

  async getChatByOrder(req, res) {
    try {
      const result = await ChatServices.getChatByOrderId(req.params.orderId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ status: "error", message: error.message || "Failed" });
    }
  }

  async sendMessage(req, res) {
    try {
      const { sender_id, sender_role, text } = req.body;
      const result = await ChatServices.sendMessage(req.params.orderId, sender_id, sender_role, text);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message || "Failed" });
    }
  }

  async getMessages(req, res) {
    try {
      const { before, limit } = req.query;
      const result = await ChatServices.getMessages(req.params.orderId, before, limit ? Number(limit) : 50);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message || "Failed" });
    }
  }
}

module.exports = new ChatControllers();
