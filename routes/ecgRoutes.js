const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  ingestEcg,
  getMyLatestEcg,
  getMyEcgHistory,
} = require("../controllers/ecgController");

const router = express.Router();

router.post("/ingest", ingestEcg);
router.get("/latest", authMiddleware, getMyLatestEcg);
router.get("/history", authMiddleware, getMyEcgHistory);

module.exports = router;