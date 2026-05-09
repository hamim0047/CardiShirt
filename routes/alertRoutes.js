const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMyAlerts,
  acknowledgeAlert,
} = require("../controllers/alertController");

const router = express.Router();

router.get("/", authMiddleware, getMyAlerts);
router.patch("/:alertId/acknowledge", authMiddleware, acknowledgeAlert);

module.exports = router;