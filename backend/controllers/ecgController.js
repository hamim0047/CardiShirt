const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { predictECG } = require("../services/mlService");
const { decideAction } = require("../services/decisionEngine");
const { generateExplanation } = require("../services/aiService");

const {
  notifyUser,
  notifyFamily,
  notifyEmergency,
} = require("../services/notificationService");

const {
  rollupReadingIntoDailyMetric,
} = require("../services/dailyMetricService");

const { getLatestECG, getLatestVitals } = require("../services/esp32Client");

// =====================================================
// INGEST ECG FROM DEVICE
// POST /api/ecg/ingest
// =====================================================

async function ingestEcg(req, res, next) {
  try {
    const {
      deviceId,
      timestamp,

      samplingRate,

      lead1,
      lead2,
      lead3,

      heartRate,
      hrv,

      ecgValid,
      leadsConnected,

      signalQuality,
    } = req.body;

    if (!deviceId || !timestamp) {
      return res.status(400).json({
        message: "deviceId and timestamp are required",
      });
    }

    const device = await prisma.device.findUnique({
      where: {
        deviceId,
      },

      include: {
        user: true,
      },
    });

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    // Invalid ECG packet

    if (
      ecgValid === false ||
      leadsConnected === false ||
      !Array.isArray(lead1) ||
      !Array.isArray(lead2) ||
      !Array.isArray(lead3)
    ) {
      return res.status(202).json({
        message: "ECG packet received but signal is invalid",

        deviceId,

        ecgValid: ecgValid ?? false,

        leadsConnected: leadsConnected ?? false,

        signalQuality: signalQuality ?? 0,
      });
    }

    // Save ECG

    const ecgRecord = await prisma.ecgRecord.create({
      data: {
        deviceId: device.id,

        timestamp: new Date(timestamp),

        samplingRate: samplingRate || 250,

        lead1,

        lead2,

        lead3,

        heartRate: heartRate ?? null,

        hrv: hrv ?? null,
      },
    });

    // AI prediction

    const prediction = await predictECG({
      lead1,

      lead2,

      lead3,
    });

    console.log("FASTAPI AI RESULT:", JSON.stringify(prediction, null, 2));

    // Decision

    const decision = decideAction(
      prediction,

      {
        heartRate,

        hrv,
      },
    );

    // Daily metric update

    rollupReadingIntoDailyMetric(
      device.userId,

      {
        heartRate,

        hrv,
      },
    );

    let alert = null;

    let explanation = null;

    if (decision.action !== "MONITOR") {
      alert = await prisma.alert.create({
        data: {
          userId: device.userId,

          deviceId: device.id,

          ecgRecordId: ecgRecord.id,

          type: "GENERAL_RISK",

          severity: decision.severity,

          message: decision.reason,
        },
      });

      explanation = await generateExplanation(
        prediction,

        decision,

        {
          heartRate,

          hrv,
        },
      );

      await notifyUser(
        device.user,

        explanation,
      );

      const contacts = await prisma.emergencyContact.findMany({
        where: {
          userId: device.userId,
        },
      });

      const telegramContacts = contacts.filter(
        (contact) =>
          contact.telegramChatId &&
          String(contact.telegramChatId).trim() !== "",
      );

      if (
        (decision.severity === "HIGH" || decision.severity === "CRITICAL") &&
        telegramContacts.length > 0
      ) {
        const message = `

🚨 CARDIAC ALERT


Patient condition:
${decision.severity}


Heart Rate:
${heartRate ?? "N/A"}


HRV:
${hrv ?? "N/A"}


${decision.reason}


Check immediately.

`;

        await notifyFamily(
          telegramContacts,

          message,
        );
      }

      if (decision.severity === "CRITICAL") {
        await notifyEmergency(explanation || decision.reason);
      }
    }

    return res.status(201).json({
      message: "ECG processed",

      ecgRecord,

      prediction,

      decision,

      alert,

      explanation,

      signalQuality: signalQuality ?? null,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// AI ECG ANALYSIS DIRECT
// POST /api/ecg/analyze
// =====================================================

async function analyzeECG(req, res) {
  try {
    const result = await predictECG(req.body);

    console.log("FASTAPI AI RESULT:", JSON.stringify(result, null, 2));

    res.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      message: "AI analysis failed",
    });
  }
}

// =====================================================
// LIVE ECG FROM ESP32
// GET /api/ecg/latest
// =====================================================

async function getLatestEcg(req, res) {
  try {
    const signal = getLatestECG();

    const vitals = getLatestVitals();

    res.json({
      success: true,

      record: {
        signal,

        samplingRate: 250,

        vitals,
      },
    });
  } catch (error) {
    console.error(
      "ESP32 ECG ERROR:",

      error.message,
    );

    res.status(500).json({
      success: false,

      message: "Failed to get ECG",

      error: error.message,
    });
  }
}

// =====================================================
// USER ECG HISTORY
// =====================================================

async function getMyLatestEcg(req, res, next) {
  try {
    const record = await prisma.ecgRecord.findFirst({
      where: {
        device: {
          userId: req.user.id,
        },
      },

      orderBy: {
        timestamp: "desc",
      },

      include: {
        device: true,
      },
    });

    return res.status(200).json({
      record,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyEcgHistory(req, res, next) {
  try {
    const records = await prisma.ecgRecord.findMany({
      where: {
        device: {
          userId: req.user.id,
        },
      },

      orderBy: {
        timestamp: "desc",
      },

      take: 50,

      include: {
        device: true,
      },
    });

    return res.status(200).json({
      records,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ingestEcg,

  analyzeECG,

  getLatestEcg,

  getMyLatestEcg,

  getMyEcgHistory,
};
