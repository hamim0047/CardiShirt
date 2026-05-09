const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { generateExplanation } = require("../services/aiService");
const { decideAction } = require("../services/decisionEngine");

async function getLatestSummary(req, res, next) {
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
    });

    if (!record) {
      return res.status(200).json({
        summary: "No live ECG record is available yet.",
      });
    }

    const latestAlert = await prisma.alert.findFirst({
      where: {
        userId: req.user.id,
        ecgRecordId: record.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const decision = latestAlert
      ? {
          action:
            latestAlert.severity === "CRITICAL"
              ? "EMERGENCY"
              : latestAlert.severity === "HIGH"
                ? "HIGH_ALERT"
                : latestAlert.severity === "MEDIUM"
                  ? "WARNING"
                  : "MONITOR",
          severity: latestAlert.severity,
          reason: latestAlert.message,
        }
      : {
          action: "MONITOR",
          severity: "LOW",
          reason: "No high-risk signal detected",
        };

    const prediction = {
      className: "normal",
      confidence: 0.88,
    };

    const summary = await generateExplanation(prediction, decision, {
      heartRate: record.heartRate,
      hrv: record.hrv,
    });

    return res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLatestSummary,
};