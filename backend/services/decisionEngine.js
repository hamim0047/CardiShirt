function decideAction(prediction, features = {}) {
  const { className, confidence } = prediction;
  const heartRate = features.heartRate ?? null;

  if (heartRate != null && heartRate > 150) {
    return {
      action: "EMERGENCY",
      severity: "CRITICAL",
      reason: "Extreme heart rate detected",
    };
  }

  if (heartRate != null && heartRate < 35) {
    return {
      action: "EMERGENCY",
      severity: "CRITICAL",
      reason: "Severe bradycardia detected",
    };
  }

  if (className === "ventricular" && confidence > 0.8) {
    return {
      action: "HIGH_ALERT",
      severity: "HIGH",
      reason: "Ventricular abnormality suspected",
    };
  }

  if (className === "atrial" && confidence > 0.8) {
    return {
      action: "WARNING",
      severity: "MEDIUM",
      reason: "Atrial abnormality suspected",
    };
  }

  if (className === "other_abnormal" && confidence > 0.75) {
    return {
      action: "WARNING",
      severity: "MEDIUM",
      reason: "Abnormal ECG pattern detected",
    };
  }

  return {
    action: "MONITOR",
    severity: "LOW",
    reason: "No high-risk signal detected",
  };
}

module.exports = { decideAction };