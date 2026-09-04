const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const {
  getFollowupQuestion,
  getInitialAssistantMessage,
  buildEducationReply,
} = require("../services/heartAssistantService");
const { answerHeartQuestion } = require("../services/aiService");

function isUrgentAlert(alert) {
  return alert && (alert.severity === "HIGH" || alert.severity === "CRITICAL");
}

async function buildDataSummary(userId) {
  const [recentMetrics, recentAlertCount, today] = await Promise.all([
    prisma.dailyMetric.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 7,
    }),
    prisma.alert.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.dailyMetric.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    }),
  ]);

  if (recentMetrics.length === 0) {
    return "No CardiShirt data recorded yet for this user.";
  }

  const avg = (key) => {
    const vals = recentMetrics.map((m) => m[key]).filter((v) => v != null);
    if (!vals.length) return null;
    return (
      Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    );
  };

  return (
    `Today: risk score ${today?.riskScore ?? "N/A"}/100, resting HR ${today?.restingHr ?? "N/A"} BPM, ` +
    `HRV ${today?.hrv ?? "N/A"} ms, worn ${today?.wornMinutes ?? 0} minutes. ` +
    `Last 7 days average: risk score ${avg("riskScore") ?? "N/A"}/100, resting HR ${avg("restingHr") ?? "N/A"} BPM, ` +
    `HRV ${avg("hrv") ?? "N/A"} ms. Alerts in the last 7 days: ${recentAlertCount}.`
  );
}

async function handleHeartAssistantChat(req, res, next) {
  try {
    const { message, state } = req.body;

    const latestRecord = await prisma.ecgRecord.findFirst({
      where: { device: { userId: req.user.id } },
      orderBy: { timestamp: "desc" },
    });

    const latestAlert = latestRecord
      ? await prisma.alert.findFirst({
          where: {
            userId: req.user.id,
            ecgRecordId: latestRecord.id,
            acknowledged: false,
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (!message && !state?.started) {
      const intro = getInitialAssistantMessage({
        ecgData: latestRecord,
        alert: latestAlert,
        aiSummary: "I am monitoring your latest cardiac condition.",
      });

      const nextQuestion = isUrgentAlert(latestAlert)
        ? getFollowupQuestion(state || { answers: {} })
        : null;

      return res.status(200).json({
        reply: intro,
        nextQuestion,
        completed: !nextQuestion,
      });
    }

    if (isUrgentAlert(latestAlert) && !state?.answers?.dizzy) {
      const nextQuestion = getFollowupQuestion(state || { answers: {} });

      if (nextQuestion) {
        return res
          .status(200)
          .json({ reply: nextQuestion, nextQuestion, completed: false });
      }

      return res.status(200).json({
        reply: buildEducationReply(state, latestAlert),
        nextQuestion: null,
        completed: true,
      });
    }

    const dataSummary = await buildDataSummary(req.user.id);
    const reply = await answerHeartQuestion(message, dataSummary);

    return res.status(200).json({ reply, nextQuestion: null, completed: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { handleHeartAssistantChat };
