const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createContact,
  getContacts,
  deleteContact,
} = require("../controllers/emergencyContactController");

const router = express.Router();

router.post("/", authMiddleware, createContact);
router.get("/", authMiddleware, getContacts);
router.delete("/:id", authMiddleware, deleteContact);

module.exports = router;