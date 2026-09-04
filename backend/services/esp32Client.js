const WebSocket = require("ws");

let latestECG = [];
let latestVitals = {};

const ESP32_IP = "10.15.2.218";

const ws = new WebSocket(`ws://${ESP32_IP}/ws`);

ws.on("open", () => {
  console.log("ESP32 WebSocket connected");
});

ws.on("message", (message) => {
  try {
    const data = JSON.parse(message);

    if (data.type === "ecg") {
      latestECG.push(data.ecg);

      // keep last 10 seconds
      // 250Hz × 10 sec

      if (latestECG.length > 2500) {
        latestECG.shift();
      }
    }

    if (data.type === "vitals") {
      latestVitals = data;
    }
  } catch (error) {
    console.log("ESP32 parse error:", error.message);
  }
});

ws.on("error", (error) => {
  console.log("ESP32 connection error:", error.message);
});

function getLatestECG() {
  return latestECG;
}

function getLatestVitals() {
  return latestVitals;
}

module.exports = {
  getLatestECG,

  getLatestVitals,
};
