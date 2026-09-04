const axios = require("axios");

const AI_URL = "http://localhost:8000";

function normalizeECG(signal) {
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;

  const std = Math.sqrt(
    signal.map((x) => (x - mean) ** 2).reduce((a, b) => a + b, 0) /
      signal.length,
  );

  return signal.map((x) => (x - mean) / (std || 1));
}

async function predictECG(ecgData) {
  const normalizedECG = normalizeECG(ecgData.ecg);

  const response = await axios.post(`${AI_URL}/predict`, {
    ecg: normalizedECG,
    sampling_rate: 250,
  });

  return response.data;
}

module.exports = {
  predictECG,
};
