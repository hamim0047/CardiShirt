const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const {
  getFollowupQuestion,
  getInitialAssistantMessage,
  buildEducationReply,
} = require("../services/heartAssistantService");

async function handleHeartAssistantChat(req, res, next) {
  try {
    const { message, state } = req.body;

    const latestRecord = await prisma.ecgRecord.findFirst({
      where: {
        device: {
          userId: req.user.id,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    const latestAlert = latestRecord
      ? await prisma.alert.findFirst({
          where: {
            userId: req.user.id,
            ecgRecordId: latestRecord.id,
            acknowledged: false,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : null;

    if (!message && !state?.started) {
      const intro = getInitialAssistantMessage({
        ecgData: latestRecord,
        alert: latestAlert,
        aiSummary: "I am monitoring your latest cardiac condition.",
      });

      const nextQuestion = latestAlert
        ? getFollowupQuestion(
            state || {
              answers: {},
            }
          )
        : null;

      return res.status(200).json({
        reply: intro,
        nextQuestion,
        completed: !nextQuestion,
      });
    }

    const nextQuestion = getFollowupQuestion(state);

    if (nextQuestion) {
      return res.status(200).json({
        reply: nextQuestion,
        nextQuestion,
        completed: false,
      });
    }

    return res.status(200).json({
      reply: buildEducationReply(state, latestAlert),
      nextQuestion: null,
      completed: true,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleHeartAssistantChat,
};