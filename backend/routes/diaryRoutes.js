const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getCalendar,
  getDay,
  addJournalEntry,
  updateJournalEntry,
} = require("../controllers/diaryController");

const router = express.Router();

router.get("/calendar", authMiddleware, getCalendar);
router.get("/day", authMiddleware, getDay);
router.post("/journal", authMiddleware, addJournalEntry);
router.patch("/journal/:id", authMiddleware, updateJournalEntry);

module.exports = router;
