const express = require("express");
const router = express.Router();

const { handleHeartAssistantChat } = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/heart-assistant", authMiddleware, handleHeartAssistantChat);

module.exports = router;
