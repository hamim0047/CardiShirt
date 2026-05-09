const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getMyAlerts(req, res, next) {
  try {
    const alerts = await prisma.alert.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        device: true,
        ecgRecord: true,
      },
    });

    return res.status(200).json({ alerts });
  } catch (error) {
    next(error);
  }
}

async function acknowledgeAlert(req, res, next) {
  try {
    const { alertId } = req.params;

    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: req.user.id,
      },
    });

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { acknowledged: true },
    });

    return res.status(200).json({ alert: updated });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyAlerts,
  acknowledgeAlert,
};