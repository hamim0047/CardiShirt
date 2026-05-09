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
      where: { deviceId },
      include: { user: true },
    });

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Handle invalid / disconnected ECG packets from ESP32
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

    const prediction = await predictECG({ lead1, lead2, lead3 });

    const decision = decideAction(prediction, {
      heartRate,
      hrv,
    });

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

      explanation = await generateExplanation(prediction, decision, {
        heartRate,
        hrv,
      });

      await notifyUser(device.user, explanation);

      const contacts = await prisma.emergencyContact.findMany({
        where: { userId: device.userId },
      });

      const telegramContacts = contacts.filter(
        (contact) =>
          contact.telegramChatId &&
          String(contact.telegramChatId).trim() !== ""
      );

      if (
        (decision.severity === "HIGH" ||
          decision.severity === "CRITICAL") &&
        telegramContacts.length > 0
      ) {
        const message = `
🚨 CARDIAC ALERT

Patient condition: ${decision.severity}

Heart Rate: ${heartRate ?? "N/A"}
HRV: ${hrv ?? "N/A"}

${decision.reason}

Check immediately.
`;

        await notifyFamily(telegramContacts, message);
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

    return res.status(200).json({ record });
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

    return res.status(200).json({ records });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ingestEcg,
  getMyLatestEcg,
  getMyEcgHistory,
};