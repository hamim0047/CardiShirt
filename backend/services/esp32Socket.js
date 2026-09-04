const WebSocket = require("ws");

let latestECG = [];
let latestVitals = {};

let ESP32_IP = "10.15.2.218";
// replace with ESP32 IP shown in Serial Monitor

const ws = new WebSocket(`ws://${ESP32_IP}/ws`);

ws.on("open", () => {
  console.log("Connected to ESP32 ECG");
});

ws.on("message", (message) => {
  try {
    const data = JSON.parse(message);

    if (data.type === "ecg") {
      latestECG.push(data.ecg);

      // keep 10 seconds
      // 250Hz × 10 sec

      if (latestECG.length > 2500) {
        latestECG.shift();
      }
    }

    if (data.type === "vitals") {
      latestVitals = data;
    }
  } catch (err) {
    console.log("ESP32 data error", err);
  }
});

ws.on("error", (err) => {
  console.log("ESP32 connection error", err.message);
});

function getLatestECG() {
  return latestECG;
}

function getVitals() {
  return latestVitals;
}

module.exports = {
  getLatestECG,
  getVitals,
};
