const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { generateDiaryNarrative } = require("../services/aiService");
const {
  dayStatusFromWornMinutes,
  computeStreak,
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

const ICON_BY_TYPE = {
  CHECK_IN: "User",
  MEDICATION: "Pill",
  SYMPTOM: "User",
  NOTE: "User",
  AI_SUMMARY: "Sparkles",
};
const ACTION_BY_TYPE = {
  CHECK_IN: "Edit note",
  MEDICATION: "Edit note",
  SYMPTOM: "Edit note",
  NOTE: "Edit note",
  AI_SUMMARY: "View",
};

async function getCalendar(req, res, next) {
  try {
    const monthStr = req.query.month; // "YYYY-MM"
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      return res
        .status(400)
        .json({ message: 'Query param "month" must look like YYYY-MM.' });
    }
    const [year, month] = monthStr.split("-").map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const today = startOfDay(new Date());

    const metrics = await prisma.dailyMetric.findMany({
      where: { userId: req.user.id, date: { gte: monthStart, lt: monthEnd } },
    });
    const byDate = new Map(
      metrics.map((m) => [startOfDay(m.date).getTime(), m]),
    );

    const days = [];
    for (let d = new Date(monthStart); d < monthEnd; d = addDays(d, 1)) {
      const m = byDate.get(d.getTime());
      days.push({
        date: new Date(d),
        status: dayStatusFromWornMinutes(m?.wornMinutes, d > today),
      });
    }

    return res.status(200).json({ month: monthStr, days });
  } catch (error) {
    next(error);
  }
}

async function getDay(req, res, next) {
  try {
    if (!req.query.date) {
      return res
        .status(400)
        .json({ message: 'Query param "date" is required.' });
    }
    const date = new Date(`${req.query.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid "date".' });
    }

    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    const today = startOfDay(new Date());
    const isToday = dayStart.getTime() === today.getTime();

    const metric = await prisma.dailyMetric.findUnique({
      where: { userId_date: { userId: req.user.id, date: dayStart } },
    });

    // Cache the AI narrative on first request for this day.
    let diaryText = metric?.aiDiaryText || null;
    if (!diaryText) {
      diaryText = await generateDiaryNarrative(metric, isToday);
      if (metric) {
        await prisma.dailyMetric.update({
          where: { id: metric.id },
          data: { aiDiaryText: diaryText },
        });
      }
    }

    const [journalEntries, alerts] = await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          userId: req.user.id,
          occurredAt: { gte: dayStart, lt: dayEnd },
        },
        orderBy: { occurredAt: "asc" },
      }),
      prisma.alert.findMany({
        where: {
          userId: req.user.id,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const journalTimeline = journalEntries
      .filter((e) => e.type !== "NOTE")
      .map((e) => ({
        source: "journal",
        id: e.id,
        time: e.occurredAt,
        icon:
          e.type === "AI_SUMMARY" ? "Sparkles" : ICON_BY_TYPE[e.type] || "User",
        iconColor: e.type === "AI_SUMMARY" ? "text-amber-400" : "text-blue-400",
        text: e.text,
        action: ACTION_BY_TYPE[e.type] || "Edit note",
      }));

    const deviceTimeline = alerts.map((a) => ({
      source: "device",
      id: a.id,
      time: a.createdAt,
      icon: "Heart",
      iconColor: "text-rose-400",
      text: a.message,
      action: "View ECG clip",
    }));

    const timeline = [...journalTimeline, ...deviceTimeline].sort(
      (a, b) => new Date(a.time) - new Date(b.time),
    );

    const notes = journalEntries
      .filter((e) => e.type === "NOTE")
      .map((e) => ({ id: e.id, time: e.occurredAt, text: e.text }));

    // Streak + personal best, computed over the trailing year relative to
    // *today* (not the viewed date) — a user-level stat, not a per-day one.
    const yearStart = addDays(today, -365);
    const yearMetrics = await prisma.dailyMetric.findMany({
      where: { userId: req.user.id, date: { gte: yearStart, lte: today } },
      orderBy: { date: "desc" },
    });
    const byDateForStreak = new Map(
      yearMetrics.map((m) => [
        startOfDay(m.date).getTime(),
        m.wornMinutes || 0,
      ]),
    );
    const descDays = [];
    for (let d = new Date(today); d >= yearStart; d = addDays(d, -1)) {
      descDays.push({ wornMinutes: byDateForStreak.get(d.getTime()) || 0 });
    }
    const streak = computeStreak(descDays);

    // "Days worn" mini-stat: trailing 3 days including the viewed day.
    // NOTE: this label had no documented meaning in the original design —
    // this is a best-guess interpretation. Adjust the window here if you
    // had something else in mind.
    const trailingWindowStart = addDays(dayStart, -2);
    const trailingMetrics = await prisma.dailyMetric.findMany({
      where: {
        userId: req.user.id,
        date: { gte: trailingWindowStart, lte: dayStart },
      },
    });
    const daysWorn = trailingMetrics.filter(
      (m) => (m.wornMinutes || 0) > 0,
    ).length;

    // 30-day average score for the mini stat card.
    const last30Start = addDays(today, -29);
    const last30 = await prisma.dailyMetric.findMany({
      where: { userId: req.user.id, date: { gte: last30Start, lte: today } },
    });
    const scores = last30.map((m) => m.riskScore).filter((s) => s != null);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // Simple HRV trend arrow: this day's HRV vs. the trailing 7 days before it.
    let hrvTrend = "flat";
    if (metric?.hrv != null) {
      const trailingStart = addDays(dayStart, -7);
      const trailing = await prisma.dailyMetric.findMany({
        where: {
          userId: req.user.id,
          date: { gte: trailingStart, lt: dayStart },
        },
      });
      const trailingHrvs = trailing.map((m) => m.hrv).filter((v) => v != null);
      if (trailingHrvs.length) {
        const trailingAvg =
          trailingHrvs.reduce((a, b) => a + b, 0) / trailingHrvs.length;
        if (metric.hrv > trailingAvg + 1) hrvTrend = "up";
        else if (metric.hrv < trailingAvg - 1) hrvTrend = "down";
      }
    }

    const wornMinutes = metric?.wornMinutes || 0;

    return res.status(200).json({
      date: dayStart,
      isToday,
      hasData: Boolean(metric),
      wornText: `Worn ${Math.floor(wornMinutes / 60)}h ${wornMinutes % 60}m`,
      rmssd: metric?.hrv ?? null,
      riskScore: metric?.riskScore ?? null,
      avgScore,
      daysWorn: { value: daysWorn, of: 3 },
      hrvTrend,
      diaryText,
      heartRateSeries: metric?.heartRateSeries || [],
      poincare: metric?.rrIntervals || [],
      timeline,
      notes,
      streak,
    });
  } catch (error) {
    next(error);
  }
}

async function addJournalEntry(req, res, next) {
  try {
    const { date, time, type, text } = req.body;
    if (!date || !type || !text) {
      return res
        .status(400)
        .json({ message: '"date", "type", and "text" are required.' });
    }
    const validTypes = [
      "CHECK_IN",
      "MEDICATION",
      "SYMPTOM",
      "NOTE",
      "AI_SUMMARY",
    ];
    if (!validTypes.includes(type)) {
      return res
        .status(400)
        .json({ message: `"type" must be one of: ${validTypes.join(", ")}` });
    }

    const dayStart = startOfDay(new Date(`${date}T00:00:00`));
    const occurredAt = time ? new Date(`${date}T${time}`) : new Date();

    const dailyMetric = await prisma.dailyMetric.findUnique({
      where: { userId_date: { userId: req.user.id, date: dayStart } },
    });

    const entry = await prisma.journalEntry.create({
      data: {
        userId: req.user.id,
        dailyMetricId: dailyMetric?.id,
        occurredAt,
        type,
        text,
      },
    });

    return res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
}

async function updateJournalEntry(req, res, next) {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: '"text" is required.' });
    }

    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ message: "Journal entry not found." });
    }

    const entry = await prisma.journalEntry.update({
      where: { id },
      data: { text },
    });
    return res.status(200).json({ entry });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCalendar, getDay, addJournalEntry, updateJournalEntry };
