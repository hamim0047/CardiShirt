const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { computeRiskScore } = require("./riskScoreService");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Assumed minutes represented by a single ingested record, used to bump
// today's wornMinutes rollup. Tune once you know the ESP32's real
// transmission cadence (one record per second vs. per minute, etc.).
const ASSUMED_MINUTES_PER_RECORD = Number(
  process.env.DEVICE_SAMPLE_INTERVAL_MIN || 1,
);

/// Called from ecgController.ingestEcg on every valid reading. Never throws
/// - a rollup failure should never break ECG ingestion or alerting.
/// Recomputes today's riskScore and clears the cached AI diary text on every
/// call, so the Risk/Diary pages stay live as real readings come in instead
/// of freezing at whatever the first reading (or the seed data) produced.
async function rollupReadingIntoDailyMetric(userId, { heartRate, hrv }) {
  try {
    const today = startOfDay(new Date());
    const existing = await prisma.dailyMetric.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const restingHr = heartRate ?? existing?.restingHr ?? null;
    const newHrv = hrv ?? existing?.hrv ?? null;
    const wornMinutes =
      (existing?.wornMinutes || 0) + ASSUMED_MINUTES_PER_RECORD;
    const wornPct = Math.min(100, (wornMinutes / 600) * 100);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const alertsLast7d = await prisma.alert.count({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
    });

    const riskScore = computeRiskScore({
      restingHr,
      hrv: newHrv,
      rhythmStability: existing?.rhythmStability ?? null,
      wornPct,
      alertsLast7d,
    });

    await prisma.dailyMetric.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        restingHr,
        hrv: newHrv,
        wornMinutes: ASSUMED_MINUTES_PER_RECORD,
        riskScore,
      },
      update: {
        restingHr,
        hrv: newHrv,
        wornMinutes,
        riskScore,
        aiDiaryText: null,
      },
    });
  } catch (error) {
    console.error("[dailyMetricService] rollup failed:", error.message);
  }
}

module.exports = { rollupReadingIntoDailyMetric };
