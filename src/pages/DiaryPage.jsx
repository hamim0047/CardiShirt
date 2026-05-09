import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  User,
  Pill,
  Heart,
  Sparkles,
  ChevronDown,
} from "lucide-react";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-slate-800 bg-[#0d1230] ${className}`}
    >
      {children}
    </div>
  );
}

function StatMiniCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#12183b] p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function LegendDot({ color, label, outlined = false }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span
        className={`h-4 w-4 rounded-md ${
          outlined
            ? "border border-dashed border-slate-600 bg-transparent"
            : color
        }`}
      />
      {label}
    </div>
  );
}

function DayCell({ day, status, active = false, today = false, onClick }) {
  const statusClasses = {
    full: "bg-emerald-400 text-white",
    partial: "bg-amber-400 text-white",
    notWorn: "bg-[#252d52] text-slate-400",
    future: "border border-dashed border-slate-700 text-slate-600",
    empty: "bg-transparent text-transparent pointer-events-none",
  };

  const activeRing = active ? "ring-2 ring-rose-500" : "";

  return (
    <button
      onClick={onClick}
      disabled={status === "empty"}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition ${statusClasses[status]} ${activeRing}`}
    >
      {day}
      {today ? (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
      ) : null}
    </button>
  );
}

function HeartRateChart() {
  const points = [
    58, 60, 59, 54, 62, 56, 71, 68, 63, 78, 80, 71, 79, 72, 84, 70, 83, 69, 71,
    72, 77, 64, 64, 64,
  ];

  const path = points
    .map((value, index) => {
      const x = 46 + (index / (points.length - 1)) * 860;
      const y = 170 - ((value - 40) / 50) * 110;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 960 230" className="h-[220px] w-full">
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`h-${i}`}
          x1="46"
          y1={38 + i * 42}
          x2="915"
          y2={38 + i * 42}
          stroke="#1f274f"
          strokeDasharray="4 6"
        />
      ))}

      {[0, 1, 2, 3, 4].map((i) => (
        <text key={`y-${i}`} x="8" y={43 + i * 42} fill="#536092" fontSize="12">
          {[110, 80, 60, 40, ""][i]}
        </text>
      ))}

      {[0, 6, 12, 18].map((t, i) => (
        <text
          key={`x-${t}`}
          x={210 + i * 220}
          y="195"
          fill="#536092"
          fontSize="12"
        >
          {`${String(t).padStart(2, "0")}:00`}
        </text>
      ))}

      <path
        d={path}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PoincarePlot() {
  const points = [
    [52, 54],
    [58, 49],
    [60, 57],
    [62, 61],
    [57, 58],
    [64, 63],
    [59, 66],
    [68, 59],
    [70, 67],
    [66, 72],
    [73, 64],
    [76, 70],
    [79, 67],
    [71, 61],
    [63, 69],
    [67, 74],
    [61, 62],
    [75, 77],
    [69, 71],
    [72, 66],
    [64, 68],
  ];

  return (
    <svg viewBox="0 0 320 170" className="h-[110px] w-full">
      <line x1="70" y1="140" x2="285" y2="25" stroke="#182149" />
      <line x1="70" y1="140" x2="285" y2="140" stroke="#182149" />
      <line x1="70" y1="140" x2="70" y2="30" stroke="#182149" />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p[0] * 2.2}
          cy={160 - p[1] * 1.4}
          r="3"
          fill="#f43f5e"
          opacity="0.9"
        />
      ))}
    </svg>
  );
}

function TimelineRow({
  icon,
  time,
  text,
  action,
  iconColor = "text-slate-400",
}) {
  const Icon = icon;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-4">
        <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <span className="w-16 shrink-0 text-sm text-slate-400">{time}</span>
        <p className="truncate text-base text-white">{text}</p>
      </div>

      <button className="shrink-0 text-sm font-medium text-rose-400 hover:text-rose-300">
        {action}
      </button>
    </div>
  );
}

function formatMonthYear(date) {
  return date.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

function formatLongDate(date) {
  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekday(date) {
  return date.toLocaleDateString([], {
    weekday: "long",
  });
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatTimelineTime(baseDate, hour, minute) {
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DiaryPage() {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const monthLabel = useMemo(
    () => formatMonthYear(currentMonth),
    [currentMonth],
  );

  const calendarCells = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);

    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

    const cells = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({
        key: `empty-${i}`,
        day: "",
        status: "empty",
        date: null,
        today: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );

      let status = "future";
      if (
        cellDate <
        new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ) {
        const mod = day % 5;
        if (mod === 1 || mod === 0) status = "full";
        else if (mod === 2 || mod === 4) status = "partial";
        else status = "notWorn";
      } else if (isSameDay(cellDate, today)) {
        status = "notWorn";
      }

      cells.push({
        key: `day-${day}`,
        day,
        status,
        date: cellDate,
        today: isSameDay(cellDate, today),
      });
    }

    return cells;
  }, [currentMonth, today]);

  const selectedDayNumber = selectedDate.getDate();

  const dailySummary = useMemo(() => {
    const diffDays = Math.abs(
      Math.floor(
        (new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        ) -
          new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const wornHours = 8 + (selectedDayNumber % 5);
    const wornMinutes = 10 + ((selectedDayNumber * 7) % 50);
    const rmssd = 38 + (selectedDayNumber % 9);
    const avgScore = 64 + (selectedDayNumber % 8);

    return {
      wornText: `Worn ${wornHours}h ${wornMinutes}m`,
      rmssd,
      avgScore,
      diaryText:
        diffDays === 0
          ? "This is today's diary view. Your rhythm has remained fairly steady so far, and your heart-rate pattern is close to your recent baseline."
          : `This was a relatively calm day for your heart. Your rhythm stayed mostly steady, and your resting rate moved close to your usual range. Your HRV reading was one of the more stable readings around this date, which is encouraging.`,
    };
  }, [selectedDate, selectedDayNumber, today]);

  const timelineItems = useMemo(() => {
    return [
      {
        icon: User,
        time: formatTimelineTime(selectedDate, 8, 30),
        text: "Check-in: feeling good",
        action: "Edit note",
        iconColor: "text-blue-400",
      },
      {
        icon: Pill,
        time: formatTimelineTime(selectedDate, 9, 0),
        text: "Medication logged: Metoprolol 25mg",
        action: "Edit note",
        iconColor: "text-blue-400",
      },
      {
        icon: Heart,
        time: formatTimelineTime(selectedDate, 14, 15),
        text: "Irregular rhythm — 40 seconds",
        action: "View ECG clip",
        iconColor: "text-rose-400",
      },
      {
        icon: Sparkles,
        time: formatTimelineTime(selectedDate, 15, 42),
        text: "AI summary generated",
        action: "View",
        iconColor: "text-amber-400",
      },
      {
        icon: User,
        time: formatTimelineTime(selectedDate, 18, 0),
        text: "Symptom logged: mild fatigue",
        action: "Edit note",
        iconColor: "text-blue-400",
      },
    ];
  }, [selectedDate]);

  const goPrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const goToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const goPrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
    setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
  };

  const goNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <div className="w-full min-w-0 text-[0.92rem]">
      <div className="grid min-h-[calc(100vh-130px)] grid-cols-1 gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goPrevMonth}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <p className="text-2xl font-semibold text-white">{monthLabel}</p>

              <div className="flex items-center gap-3">
                <button
                  onClick={goToday}
                  className="text-sm font-medium text-rose-400 hover:text-rose-300"
                >
                  Today
                </button>
                <button
                  onClick={goNextMonth}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-800 px-5 py-4">
            <div className="grid grid-cols-7 gap-y-4 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
                <p key={d} className="text-xs text-slate-500">
                  {d}
                </p>
              ))}

              {calendarCells.map((item) => (
                <div key={item.key} className="flex justify-center">
                  <DayCell
                    day={item.day}
                    status={item.status}
                    today={item.today}
                    active={
                      item.date ? isSameDay(item.date, selectedDate) : false
                    }
                    onClick={() => item.date && setSelectedDate(item.date)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-b border-slate-800 px-5 py-4">
            <div className="flex flex-wrap gap-4">
              <LegendDot color="bg-emerald-400" label="Full" />
              <LegendDot color="bg-[#2a6a66]" label="Partial" />
              <LegendDot color="bg-[#252d52]" label="Not worn" />
              <LegendDot color="" label="Future" outlined />
            </div>
          </div>

          <div className="border-b border-slate-800 px-5 py-5">
            <p className="text-sm text-slate-400">Current streak</p>

            <div className="mt-4 flex items-center gap-3">
              <Flame className="h-5 w-5 text-rose-400" />
              <p className="text-5xl font-semibold text-white">14</p>
              <span className="text-xl text-white">days</span>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <Trophy className="h-4 w-4" />
              <span>Personal best — 23 days</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 px-5 py-5">
            <StatMiniCard title="Days worn" value="2" subtitle="of 3" />
            <StatMiniCard title="Alerts" value="1" subtitle="events" />
            <StatMiniCard
              title="Avg Score"
              value={String(dailySummary.avgScore)}
              subtitle="health"
            />
            <StatMiniCard title="HRV Trend" value="↑" subtitle="Improving" />
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold text-white">
                {formatLongDate(selectedDate)}
              </p>
              <p className="mt-2 text-xl text-slate-400">
                {formatWeekday(selectedDate)}
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
              {dailySummary.wornText}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-400">
              <Sparkles className="h-4 w-4 text-rose-400" />
              <span className="text-sm">CardiShirt AI</span>
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="h-2 w-2 rounded-full bg-slate-600" />
              </div>
            </div>

            <button className="rounded-full bg-[#151c42] px-4 py-2 text-sm text-slate-300 hover:text-white">
              Read in Bengali
            </button>
          </div>

          <p className="max-w-4xl text-2xl font-semibold leading-[1.7] text-white">
            {dailySummary.diaryText}
          </p>

          <Card className="p-5">
            <p className="text-sm text-slate-400">24-Hour Heart Rate</p>

            <div className="mt-3">
              <HeartRateChart />
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#151c42] px-3 py-1.5 text-xs text-slate-300">
                🔗 {formatTimelineTime(selectedDate, 9, 0)} — Medication
              </span>
              <span className="rounded-full bg-[#151c42] px-3 py-1.5 text-xs text-slate-300">
                ⚠️ {formatTimelineTime(selectedDate, 14, 15)} — Irregular
              </span>
              <span className="rounded-full bg-[#151c42] px-3 py-1.5 text-xs text-slate-300">
                🧍 {formatTimelineTime(selectedDate, 18, 0)} — Fatigue
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-5">
              <p className="text-sm text-slate-400">RMSSD</p>

              <div className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-semibold text-white">
                  {dailySummary.rmssd}
                </span>
                <span className="mb-2 text-base text-slate-500">ms</span>
              </div>

              <p className="mt-5 text-base font-semibold text-emerald-400">
                6ms above your 30-day average
              </p>
              <p className="mt-2 text-sm text-slate-400">Good variability</p>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-slate-400">Poincaré Plot</p>

              <div className="mt-4">
                <PoincarePlot />
              </div>

              <button className="mt-2 text-base font-medium text-rose-400 hover:text-rose-300">
                What does this mean?
              </button>
            </Card>
          </div>

          <Card className="p-5">
            <p className="text-2xl font-semibold text-slate-300">
              Events Timeline
            </p>

            <div className="mt-4">
              {timelineItems.map((item, index) => (
                <TimelineRow key={index} {...item} />
              ))}
            </div>

            <button className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-white">
              <ChevronDown className="h-4 w-4" />
              Show device events (1)
            </button>
          </Card>

          <Card className="px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-slate-300">Notes</p>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={goPrevDay}
              className="rounded-2xl bg-[#151c42] px-5 py-3 text-sm font-medium text-slate-300 hover:text-white"
            >
              ← Previous day
            </button>

            <button
              onClick={goNextDay}
              className="rounded-2xl bg-[#151c42] px-5 py-3 text-sm font-medium text-slate-300 hover:text-white"
            >
              Next day →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
