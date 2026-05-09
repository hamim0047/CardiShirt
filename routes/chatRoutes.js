const express = require("express");
const router = express.Router();

const { handleHeartAssistantChat } = require("../controllers/chatController");
const { authenticate } = require("../middlewares/authMiddleware");

router.post("/heart-assistant", authenticate, handleHeartAssistantChat);

module.exports = router;