function getFollowupQuestion(state) {
  if (!state.answers.feeling) return "How do you feel right now?";
  if (!state.answers.chestPain) return "Are you having any chest pain right now?";
  if (!state.answers.shortBreath) return "Are you feeling short of breath?";
  if (!state.answers.activity) {
    return "What are you doing right now: resting, walking, or exercising?";
  }
  if (!state.answers.ateRecently) {
    return "Have you eaten anything within the last 30 minutes?";
  }
  if (state.answers.ateRecently === "yes" && !state.answers.recentFood) {
    return "What did you eat or drink recently?";
  }
  if (!state.answers.medicationTaken) {
    return "Have you taken your medication today?";
  }
  if (!state.answers.dizzy) {
    return "Are you feeling dizzy, weak, or sweaty?";
  }
  return null;
}

function getInitialAssistantMessage({ ecgData, alert, aiSummary }) {
  const heartRate = ecgData?.heartRate ?? "N/A";
  const hrv = ecgData?.hrv ?? "N/A";

  if (!alert) {
    return `Your latest ECG looks stable. Heart rate is ${heartRate} BPM and HRV is ${hrv} ms. ${aiSummary || ""}`.trim();
  }

  if (alert.severity === "CRITICAL") {
    return `I detected a critical abnormality in your latest ECG. Your heart rate is ${heartRate} BPM and HRV is ${hrv} ms. I need to ask a few quick questions right now.`;
  }

  if (alert.severity === "HIGH") {
    return `Your latest ECG shows a high-risk abnormality. Your heart rate is ${heartRate} BPM and HRV is ${hrv} ms. I want to ask a few questions about your symptoms and activity.`;
  }

  return `I noticed some moderate ECG changes. Your heart rate is ${heartRate} BPM and HRV is ${hrv} ms. Let me ask a few questions to better understand your condition.`;
}

function buildEducationReply(state, alert) {
  const answers = state.answers || {};

  if (alert?.severity === "CRITICAL") {
    if (answers.chestPain === "yes" || answers.shortBreath === "yes") {
      return "Your ECG abnormality together with your symptoms may indicate an emergency. Stop activity now and seek immediate medical care.";
    }

    return "Your ECG shows a critical abnormality. Please sit or lie down safely, avoid activity, and seek urgent medical attention immediately.";
  }

  if (answers.activity === "exercising") {
    return "Physical activity can temporarily raise heart rate and affect rhythm. Please rest for several minutes and continue monitoring. If symptoms continue, seek medical advice.";
  }

  if (answers.ateRecently === "yes") {
    return "Recent food or drink can sometimes affect how you feel, especially with movement or stress. Rest for a few minutes and keep monitoring your symptoms.";
  }

  if (answers.medicationTaken === "no") {
    return "Missing cardiac medication can increase rhythm instability in some patients. Please follow your prescribed schedule and contact your doctor if symptoms continue.";
  }

  if (answers.chestPain === "yes" || answers.shortBreath === "yes" || answers.dizzy === "yes") {
    return "Because you reported concerning symptoms together with ECG changes, you should seek medical evaluation as soon as possible.";
  }

  return "Based on your ECG and your answers, continue resting, avoid exertion, and monitor your condition closely. If chest pain, breathing difficulty, or dizziness appears, seek medical help.";
}

module.exports = {
  getFollowupQuestion,
  getInitialAssistantMessage,
  buildEducationReply,
};