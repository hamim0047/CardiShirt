const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createContact(req, res, next) {
  try {
    const {
      name,
      relation,
      phone,
      email,
      telegramChatId,
      priority,
    } = req.body;

    const contact = await prisma.emergencyContact.create({
      data: {
        name,
        relation,
        phone,
        email,
        telegramChatId,
        priority,
        userId: req.user.id,
      },
    });

    res.status(201).json({ contact });
  } catch (error) {
    next(error);
  }
}

async function getContacts(req, res, next) {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: req.user.id },
      orderBy: { priority: "asc" },
    });

    res.json({ contacts });
  } catch (error) {
    next(error);
  }
}

async function deleteContact(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.emergencyContact.delete({
      where: { id },
    });

    res.json({ message: "Deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createContact,
  getContacts,
  deleteContact,
};