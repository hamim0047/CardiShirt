const express = require("express");
const authRoutes = require("./authRoutes");
const deviceRoutes = require("./deviceRoutes");
const ecgRoutes = require("./ecgRoutes");
const alertRoutes = require("./alertRoutes");
const emergencyContactRoutes = require("./emergencyContactRoutes");
const aiRoutes = require("./aiRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/devices", deviceRoutes);
router.use("/ecg", ecgRoutes);
router.use("/alerts", alertRoutes);
router.use("/emergency-contacts", emergencyContactRoutes);
router.use("/ai", aiRoutes);

module.exports = router;