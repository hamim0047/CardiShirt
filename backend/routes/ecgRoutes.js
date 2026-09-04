const express = require("express");

const router = express.Router();

const { analyzeECG, getLatestEcg } = require("../controllers/ecgController");

router.get("/latest", getLatestEcg);

router.post("/analyze", analyzeECG);

module.exports = router;
