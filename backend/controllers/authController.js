const { registerUser, loginUser } = require("../services/authService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const result = await registerUser({ name, email, password });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await loginUser({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  me,
};