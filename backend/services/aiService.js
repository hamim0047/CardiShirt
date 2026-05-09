const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildFallbackExplanation(prediction, decision, ecgData) {
  const hr = ecgData?.heartRate ?? "N/A";
  const hrv = ecgData?.hrv ?? "N/A";
  const className = prediction?.className || "unknown pattern";

  if (decision?.severity === "CRITICAL") {
    if (decision?.reason?.toLowerCase().includes("myocard")) {
      return `Possible myocardial infarction pattern detected. Heart rate is ${hr} BPM and HRV is ${hrv} ms. This is a critical-risk ECG finding and requires immediate medical evaluation.`;
    }

    return `Critical cardiac risk detected. The ECG shows ${className}, with heart rate at ${hr} BPM and HRV at ${hrv} ms. Immediate medical attention is strongly recommended.`;
  }

  if (decision?.severity === "HIGH") {
    return `High cardiac risk detected. The ECG shows ${className}, with heart rate at ${hr} BPM and HRV at ${hrv} ms. Urgent clinical review is recommended.`;
  }

  if (decision?.severity === "MEDIUM") {
    return `Moderate cardiac irregularity detected. The ECG suggests ${className}. Heart rate is ${hr} BPM and HRV is ${hrv} ms. Continued monitoring is recommended today.`;
  }

  return `Your ECG appears stable overall. The latest pattern is ${className}, with heart rate at ${hr} BPM and HRV at ${hrv} ms. No immediate high-risk signal was detected.`;
}

async function generateExplanation(prediction, decision, ecgData) {
  const prompt = `
You are a cardiac monitoring assistant.

Model output:
- Predicted ECG class: ${prediction.className}
- Confidence: ${prediction.confidence}
- Decision: ${decision.action}
- Severity: ${decision.severity}

Patient data:
- Heart Rate: ${ecgData.heartRate ?? "unknown"} BPM
- HRV: ${ecgData.hrv ?? "unknown"} ms

Explain clearly:
1. what is happening
2. how serious it is
3. what the patient should do next

Keep the answer short, calm, and clear.
`;

  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        ),
      ]);

      const text = result.response.text();
      if (text) return text;
    } catch (error) {
      console.log(`Gemini failed for ${modelName}:`, error.message);
    }
  }

  return buildFallbackExplanation(prediction, decision, ecgData);
}

module.exports = {
  generateExplanation,
  buildFallbackExplanation,
};