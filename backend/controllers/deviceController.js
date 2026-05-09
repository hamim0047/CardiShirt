const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function linkDevice(req, res, next) {
  try {
    const { deviceId, name } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "deviceId is required" });
    }

    const existing = await prisma.device.findUnique({
      where: { deviceId },
    });

    if (existing) {
      return res.status(400).json({ message: "Device already linked" });
    }

    const device = await prisma.device.create({
      data: {
        deviceId,
        name: name || "ESP32 ECG Device",
        userId: req.user.id,
      },
    });

    return res.status(201).json({ device });
  } catch (error) {
    next(error);
  }
}

async function getMyDevices(req, res, next) {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ devices });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  linkDevice,
  getMyDevices,
};