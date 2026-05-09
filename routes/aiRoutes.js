const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getLatestSummary } = require("../controllers/aiController");

const router = express.Router();

router.get("/summary", authMiddleware, getLatestSummary);

module.exports = router;