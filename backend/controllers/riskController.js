const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { generateRiskNarrative } = require("../services/aiService");
const {
  computeRiskScore,
  scoreToTone,
  dayStatusFromWornMinutes,
  computeDrivers,
  compareLabel,
  rangeCodeToDays,
} = require("../services/riskScoreService");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function avg(nums) {
  const vals = nums.filter((n) => n != null && !Number.isNaN(n));
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10;
}

async function loadMetrics(userId, from, to) {
  return prisma.dailyMetric.findMany({
    where: { userId, date: { gte: from, lt: to } },
    orderBy: { date: "asc" },
  });
}

function periodAverages(metrics, periodDays) {
  const wornDays = metrics.filter((m) => (m.wornMinutes || 0) > 0).length;
  return {
    restingHr: round1(avg(metrics.map((m) => m.restingHr))),
    hrv: round1(avg(metrics.map((m) => m.hrv))),
    rhythmStability: round1(avg(metrics.map((m) => m.rhythmStability))),
    activityLevel: round1(avg(metrics.map((m) => m.activityLevel))),
    sleepHr: round1(avg(metrics.map((m) => m.sleepHr))),
    wornPct: round1((wornDays / periodDays) * 100),
  };
}

async function getSummary(req, res, next) {
  try {
    const rangeCode = ["7d", "30d", "90d", "1y"].includes(req.query.range)
      ? req.query.range
      : "30d";
    const days = rangeCodeToDays(rangeCode);
    const today = startOfDay(new Date());
    const rangeStart = addDays(today, -days + 1);
    const baselineStart = addDays(rangeStart, -days);

    const [currentMetrics, baselineMetrics, alertsInRange] = await Promise.all([
      loadMetrics(req.user.id, rangeStart, addDays(today, 1)),
      loadMetrics(req.user.id, baselineStart, rangeStart),
      prisma.alert.findMany({
        where: { userId: req.user.id, createdAt: { gte: rangeStart } },
      }),
    ]);

    const currentAvg = periodAverages(currentMetrics, days);
    const baselineAvg = periodAverages(baselineMetrics, days);

    const latest = currentMetrics[currentMetrics.length - 1] || null;
    const weekAgoIndex = currentMetrics.length - 8;
    const weekAgo = weekAgoIndex >= 0 ? currentMetrics[weekAgoIndex] : null;

    const todayScore =
      latest?.riskScore ??
      computeRiskScore({
        restingHr: currentAvg.restingHr,
        hrv: currentAvg.hrv,
        rhythmStability: currentAvg.rhythmStability,
        wornPct: currentAvg.wornPct,
        alertsLast7d: alertsInRange.length,
      });
    const weekAgoScore = weekAgo?.riskScore ?? todayScore;
    const scoreDelta = todayScore - weekAgoScore;

    const history = currentMetrics.map((m) => ({
      date: m.date,
      score:
        m.riskScore ??
        computeRiskScore({
          restingHr: m.restingHr,
          hrv: m.hrv,
          rhythmStability: m.rhythmStability,
          wornPct: (m.wornMinutes || 0) > 0 ? 100 : 0,
          alertsLast7d: 0,
        }),
    }));

    const drivers = computeDrivers(currentAvg, baselineAvg);

    // Wearing-consistency strip is always the trailing 30 days, regardless
    // of the selected range, matching the fixed 30-cell UI element.
    const last30Start = addDays(today, -29);
    const last30 = await loadMetrics(
      req.user.id,
      last30Start,
      addDays(today, 1),
    );
    const byDate = new Map(
      last30.map((m) => [startOfDay(m.date).getTime(), m]),
    );
    const wearingConsistency = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(last30Start, i);
      const m = byDate.get(d.getTime());
      wearingConsistency.push({
        date: d,
        status: dayStatusFromWornMinutes(m?.wornMinutes, d > today),
      });
    }
    const nonFutureDays = wearingConsistency.filter(
      (d) => d.status !== "future",
    ).length;
    const coveragePct = nonFutureDays
      ? Math.round(
          (wearingConsistency.filter(
            (d) => d.status === "full" || d.status === "partial",
          ).length /
            nonFutureDays) *
            100,
        )
      : 0;

    const alertsPerWeekCurrent = round1((alertsInRange.length / days) * 7);
    const baselineAlerts = await prisma.alert.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: baselineStart, lt: rangeStart },
      },
    });
    const alertsPerWeekBaseline = round1((baselineAlerts / days) * 7);

    const comparison = {
      restingHr: {
        current: currentAvg.restingHr,
        baseline: baselineAvg.restingHr,
        unit: "BPM",
        verdict: compareLabel(
          currentAvg.restingHr,
          baselineAvg.restingHr,
          false,
          1,
        ),
      },
      hrv: {
        current: currentAvg.hrv,
        baseline: baselineAvg.hrv,
        unit: "ms",
        verdict: compareLabel(currentAvg.hrv, baselineAvg.hrv, true, 2),
      },
      rhythmStability: {
        current: currentAvg.rhythmStability,
        baseline: baselineAvg.rhythmStability,
        unit: "%",
        verdict: compareLabel(
          currentAvg.rhythmStability,
          baselineAvg.rhythmStability,
          true,
          1,
        ),
      },
      alertsPerWeek: {
        current: alertsPerWeekCurrent,
        baseline: alertsPerWeekBaseline,
        unit: "",
        verdict: compareLabel(
          alertsPerWeekCurrent,
          alertsPerWeekBaseline,
          false,
          0.3,
        ),
      },
    };

    const rangeLabelText = {
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
      "1y": "year",
    }[rangeCode];
    const narrative = await generateRiskNarrative(rangeLabelText, {
      avgScore: Math.round(avg(history.map((h) => h.score)) ?? todayScore),
      scoreDelta,
      avgRestingHr: currentAvg.restingHr,
      avgHrv: currentAvg.hrv,
      avgRhythm: currentAvg.rhythmStability,
      alertCount: alertsInRange.length,
    });

    return res.status(200).json({
      range: rangeCode,
      score: todayScore,
      scoreTone: scoreToTone(todayScore),
      scoreDelta,
      narrative,
      history,
      metrics: {
        restingHr: currentAvg.restingHr,
        hrv: currentAvg.hrv,
        rhythmStability: currentAvg.rhythmStability,
      },
      drivers,
      wearingConsistency,
      coveragePct,
      comparison,
      hasData: currentMetrics.length > 0,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getSummary };
