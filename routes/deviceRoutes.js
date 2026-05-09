const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { linkDevice, getMyDevices } = require("../controllers/deviceController");

const router = express.Router();

router.post("/link", authMiddleware, linkDevice);
router.get("/my-devices", authMiddleware, getMyDevices);

module.exports = router;