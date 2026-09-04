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
          setTimeout(() => reject(new Error("Timeout")), 5000),
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
  generateDiaryNarrative,
  generateRiskNarrative,
  answerHeartQuestion,
};

// =========================================================
// Added for the Diary and Risk pages' "CardiShirt AI" text.
// Same model list / timeout / fallback pattern as generateExplanation
// above, just different prompts and inputs.
// =========================================================

function buildFallbackDiaryNarrative(metric, isToday) {
  if (!metric) {
    return isToday
      ? "This is today's diary view. No readings yet today — once your CardiShirt syncs, you'll see a summary here."
      : "No readings were recorded on this day.";
  }
  const hr = metric.restingHr ?? "N/A";
  const hrv = metric.hrv ?? "N/A";
  return isToday
    ? `This is today's diary view. Your rhythm has remained fairly steady so far, with a resting heart rate around ${hr} BPM and HRV at ${hrv} ms, close to your recent baseline.`
    : `This was a relatively calm day for your heart. Your resting rate was around ${hr} BPM and HRV was ${hrv} ms, close to your usual range.`;
}

async function generateDiaryNarrative(metric, isToday) {
  const fallback = buildFallbackDiaryNarrative(metric, isToday);
  if (!metric) return fallback;

  const prompt = `
You are a calm, plain-language cardiac monitoring assistant writing a short daily diary summary
for a patient wearing an ECG-monitoring shirt (CardiShirt). Write ONE paragraph, 2-3 sentences,
second person ("your"), no medical jargon, no diagnosis, no alarming language even if numbers are
mildly off. Base it only on this data for the day:
- Resting heart rate: ${metric.restingHr ?? "not recorded"} BPM
- HRV (RMSSD): ${metric.hrv ?? "not recorded"} ms
- Rhythm stability: ${metric.rhythmStability ?? "not recorded"}%
- Worn for: ${metric.wornMinutes ?? 0} minutes
- Risk score: ${metric.riskScore ?? "not recorded"} / 100
Do not include a heading or label, just the paragraph.
`;

  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000),
        ),
      ]);
      const text = result.response.text();
      if (text) return text;
    } catch (error) {
      console.log(`Gemini failed for ${modelName}:`, error.message);
    }
  }
  return fallback;
}

function buildFallbackRiskNarrative(rangeLabel) {
  return `Over the selected ${rangeLabel} your heart health metrics have stayed within a manageable range, with a few points worth reviewing below.`;
}

async function generateRiskNarrative(rangeLabel, stats) {
  const fallback = buildFallbackRiskNarrative(rangeLabel);

  const prompt = `
You are a calm, plain-language cardiac monitoring assistant. Write ONE short paragraph (2-3
sentences) summarizing a patient's heart health trend over the past ${rangeLabel}, second person
("your"), no diagnosis, no alarming language. Data:
- Average risk score: ${stats.avgScore}/100 (change vs previous period: ${stats.scoreDelta >= 0 ? "+" : ""}${stats.scoreDelta})
- Average resting HR: ${stats.avgRestingHr} BPM
- Average HRV: ${stats.avgHrv} ms
- Rhythm stability: ${stats.avgRhythm}%
- Alerts logged: ${stats.alertCount}
Mention one thing that's improving and, only if the data supports it, one thing worth watching. Do
not include a heading or label, just the paragraph.
`;

  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000),
        ),
      ]);
      const text = result.response.text();
      if (text) return text;
    } catch (error) {
      console.log(`Gemini failed for ${modelName}:`, error.message);
    }
  }
  return fallback;
}

// =========================================================
// Added for the AI chat panel's free-form "ask about your heart"
// messages (used when there's no active HIGH/CRITICAL alert driving the
// scripted symptom checklist in chatController.js). Same fallback pattern
// as everything else in this file.
// =========================================================

async function answerHeartQuestion(question, dataSummary) {
  const fallback =
    "I couldn't reach the assistant just now. Based on your recent data: " +
    dataSummary +
    " For anything concerning, please check with your doctor.";

  const prompt = `
You are CardiShirt AI, a calm, plain-language cardiac monitoring companion embedded in a
patient's dashboard. Answer the user's question in 2-4 sentences, second person ("your"), using
ONLY the data below. Never diagnose. If the data doesn't cover what they asked, say so plainly and
suggest checking the Risk & Trends or Cardiac Diary pages. If the question is unrelated to their
heart health, gently redirect them back to heart-related topics. Always remain supportive, never
alarming unless the data genuinely warrants concern, in which case suggest they consult their
doctor.

User's recent data: ${dataSummary}

User's question: "${question}"
`;

  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000),
        ),
      ]);
      const text = result.response.text();
      if (text) return text;
    } catch (error) {
      console.log(`Gemini failed for ${modelName}:`, error.message);
    }
  }
  return fallback;
}
