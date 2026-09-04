function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/// STARTER HEURISTIC — not a validated clinical score.
/// Produces a 0-100 number so the UI has something real to render instead
/// of a hardcoded value. Swap this out for your team's actual model
/// whenever it's ready; nothing else in the codebase needs to change as
/// long as this still returns a 0-100 integer.
function computeRiskScore({
  restingHr,
  hrv,
  rhythmStability,
  wornPct,
  alertsLast7d,
}) {
  let score = 70; // baseline "typical" score

  if (hrv != null) score += clamp((hrv - 40) * 0.6, -15, 15); // higher HRV -> higher score
  if (rhythmStability != null)
    score += clamp((rhythmStability - 90) * 0.8, -15, 10);
  if (restingHr != null) score += clamp((70 - restingHr) * 0.5, -10, 10); // lower resting HR -> higher score
  if (wornPct != null) score += clamp((wornPct - 80) * 0.1, -5, 5);
  if (alertsLast7d != null) score -= clamp(alertsLast7d * 3, 0, 20);

  return Math.round(clamp(score, 0, 100));
}

/// Higher = better in this scoring convention (see computeRiskScore).
function scoreToTone(score) {
  if (score >= 80) return "green";
  if (score >= 55) return "amber";
  return "rose";
}

function dayStatusFromWornMinutes(wornMinutes, isFuture) {
  if (isFuture) return "future";
  if (wornMinutes == null || wornMinutes <= 0) return "notWorn";
  if (wornMinutes >= 600) return "full"; // 10+ hours counts as a full day's wear
  return "partial";
}

/// Builds the six DriverCard entries on the Risk page from two period
/// averages (current window vs. the window immediately before it).
function computeDrivers(current, baseline) {
  const drivers = [];

  const pt = (delta) =>
    delta == null || Number.isNaN(delta) ? null : Math.round(delta);
  const toneFor = (pts) => {
    if (pts == null || Math.abs(pts) < 1) return "neutral";
    if (pts > 0) return "green";
    if (pts >= -3) return "amber";
    return "red";
  };
  const fmt = (pts) =>
    pts == null || pts === 0 ? "–" : pts > 0 ? `+${pts}` : `${pts}`;

  // Resting HR — lower is better.
  const rhrPts =
    current.restingHr != null && baseline.restingHr != null
      ? clamp((baseline.restingHr - current.restingHr) * 1.5, -10, 10)
      : null;
  drivers.push({
    key: "restingHr",
    title: "Resting Heart Rate",
    value: fmt(pt(rhrPts)),
    tone: toneFor(pt(rhrPts)),
    description:
      rhrPts == null
        ? "Not enough resting heart rate data yet for this period."
        : rhrPts > 0
          ? "Your resting rate has been lower than usual this period."
          : rhrPts < 0
            ? "Your resting rate has been higher than usual this period."
            : "Your resting rate has been steady compared to your baseline.",
  });

  // HRV — higher is better.
  const hrvPts =
    current.hrv != null && baseline.hrv != null
      ? clamp((current.hrv - baseline.hrv) * 1.0, -10, 10)
      : null;
  drivers.push({
    key: "hrv",
    title: "Heart Rate Variability",
    value: fmt(pt(hrvPts)),
    tone: toneFor(pt(hrvPts)),
    description:
      hrvPts == null
        ? "Not enough HRV data yet for this period."
        : hrvPts < 0
          ? "Your HRV dropped this period and hasn't fully recovered."
          : hrvPts > 0
            ? "Your HRV has been climbing this period."
            : "Your HRV has held steady this period.",
  });

  // Rhythm stability — higher is better.
  const rhythmPts =
    current.rhythmStability != null && baseline.rhythmStability != null
      ? clamp(
          (current.rhythmStability - baseline.rhythmStability) * 0.8,
          -10,
          10,
        )
      : null;
  drivers.push({
    key: "rhythmStability",
    title: "Rhythm Stability",
    value: fmt(pt(rhythmPts)),
    tone: toneFor(pt(rhythmPts)),
    description:
      rhythmPts == null
        ? "Not enough rhythm data yet for this period."
        : rhythmPts < 0
          ? "A few brief irregular episodes this period, mostly self-resolving."
          : "Your rhythm has stayed consistent this period.",
  });

  // Wearing consistency — higher coverage is better.
  const wearPts =
    current.wornPct != null && baseline.wornPct != null
      ? clamp((current.wornPct - baseline.wornPct) * 0.15, -10, 10)
      : null;
  drivers.push({
    key: "wearingConsistency",
    title: "Wearing Consistency",
    value: fmt(pt(wearPts)),
    tone: toneFor(pt(wearPts)),
    description:
      current.wornPct != null
        ? `You wore the shirt on ${Math.round(current.wornPct)}% of days this period.`
        : "No wear-time data yet for this period.",
  });

  // Activity pattern — reported for context, not scored as good/bad.
  const activityPts =
    current.activityLevel != null && baseline.activityLevel != null
      ? clamp((current.activityLevel - baseline.activityLevel) * 0.3, -10, 10)
      : null;
  const activityNeutral = activityPts == null || Math.abs(activityPts) < 3;
  drivers.push({
    key: "activityPattern",
    title: "Activity Pattern",
    value: activityNeutral ? "–" : fmt(pt(activityPts)),
    tone: activityNeutral ? "neutral" : toneFor(pt(activityPts)),
    description: activityNeutral
      ? "Your daily activity level has been consistent."
      : "Your daily activity level has shifted noticeably this period.",
  });

  // Sleep HR — lower is better.
  const sleepPts =
    current.sleepHr != null && baseline.sleepHr != null
      ? clamp((baseline.sleepHr - current.sleepHr) * 1.2, -10, 10)
      : null;
  drivers.push({
    key: "sleepHr",
    title: "Sleep Heart Rate",
    value: fmt(pt(sleepPts)),
    tone: toneFor(pt(sleepPts)),
    description:
      sleepPts == null
        ? "Not enough overnight data yet for this period."
        : sleepPts < 0
          ? "Your overnight heart rate has been slightly elevated."
          : "Your overnight heart rate has been in a good range.",
  });

  return drivers;
}

function compareLabel(current, baseline, higherIsBetter, tolerance) {
  if (current == null || baseline == null) return "Same";
  const diff = current - baseline;
  if (Math.abs(diff) <= tolerance) return "Same";
  const better = higherIsBetter ? diff > 0 : diff < 0;
  return better ? "Better" : "Watch";
}

function computeStreak(dailyMetricsByDateDesc) {
  // dailyMetricsByDateDesc: array of { wornMinutes } ordered most-recent-first,
  // one entry per calendar day (missing days should be represented as
  // { wornMinutes: 0 } by the caller so gaps break the streak correctly).
  let current = 0;
  let best = 0;
  let running = 0;

  dailyMetricsByDateDesc.forEach((day, i) => {
    const worn = (day.wornMinutes || 0) > 0;
    if (worn) {
      running += 1;
    } else {
      running = 0;
    }
    best = Math.max(best, running);
    if (i === 0 || (current === i && worn)) {
      // still unbroken from "today" backwards
      if (worn) current = i + 1;
    }
  });

  return { current, best };
}

// API accepts short range codes (7d/30d/90d/1y); the frontend maps its
// button labels ("7 days", "30 days", ...) to these before calling.
const RANGE_CODES = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

function rangeCodeToDays(code) {
  return RANGE_CODES[code] || 30;
}

module.exports = {
  clamp,
  computeRiskScore,
  scoreToTone,
  dayStatusFromWornMinutes,
  computeDrivers,
  compareLabel,
  computeStreak,
  rangeCodeToDays,
  RANGE_CODES,
};
