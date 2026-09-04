const express = require("express");

const authRoutes = require("./authRoutes");
const deviceRoutes = require("./deviceRoutes");
const ecgRoutes = require("./ecgRoutes");
const alertRoutes = require("./alertRoutes");
const emergencyContactRoutes = require("./emergencyContactRoutes");
const aiRoutes = require("./aiRoutes");
const chatRoutes = require("./chatRoutes");
const riskRoutes = require("./riskRoutes");
const diaryRoutes = require("./diaryRoutes");

const router = express.Router();

// Authentication
router.use("/auth", authRoutes);

// Device management
router.use("/devices", deviceRoutes);

// ECG + AI processing
router.use("/ecg", ecgRoutes);

// Alerts
router.use("/alerts", alertRoutes);

// Emergency contacts
router.use("/emergency-contacts", emergencyContactRoutes);

// AI assistant
router.use("/ai", aiRoutes);

// Chat system
router.use("/chat", chatRoutes);

// Risk dashboard
router.use("/risk", riskRoutes);

// Health diary
router.use("/diary", diaryRoutes);

module.exports = router;
