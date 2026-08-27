import { Router } from "express";
const ChatControllers = require("../Controllers/ChatControllers");

const router = Router();

router.post("/", ChatControllers.getOrCreateChat);
router.get("/user/:userId", ChatControllers.getChatsByUser);
router.get("/order/:orderId", ChatControllers.getChatByOrder);
router.post("/order/:orderId/message", ChatControllers.sendMessage);
router.get("/order/:orderId/messages", ChatControllers.getMessages);

export default router;
