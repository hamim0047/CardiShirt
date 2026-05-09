const axios = require("axios");

async function predictECG(ecgData) {
  const res = await axios.post("http://localhost:8000/predict", {
    lead1: ecgData.lead1,
    lead2: ecgData.lead2,
    lead3: ecgData.lead3,
  });

  return res.data;
}

module.exports = { predictECG };