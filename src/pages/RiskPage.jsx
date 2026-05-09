import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Heart,
  Share2,
  Shirt,
  Moon,
  TrendingUp,
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

function RangeButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.18)]"
          : "border border-slate-800 bg-[#0a0f26] text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function DriverCard({ title, value, description, tone = "green", icon }) {
  const toneStyles = {
    green: {
      text: "text-emerald-400",
      bar: "bg-emerald-400",
      value: "text-emerald-400",
    },
    red: {
      text: "text-rose-400",
      bar: "bg-rose-500",
      value: "text-rose-400",
    },
    amber: {
      text: "text-amber-300",
      bar: "bg-amber-400",
      value: "text-amber-300",
    },
    neutral: {
      text: "text-slate-300",
      bar: "bg-slate-300",
      value: "text-slate-300",
    },
  };

  const styles = toneStyles[tone] || toneStyles.green;
  const Icon = icon;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className={`h-4 w-4 ${styles.text}`} /> : null}
            <p className="text-lg font-semibold text-white">{title}</p>
          </div>
        </div>

        <span className={`text-base font-semibold ${styles.value}`}>
          {value}
        </span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-[#141a3d]">
        <div
          className={`h-2 rounded-full ${styles.bar}`}
          style={{ width: "78%" }}
        />
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-400">{description}</p>
    </Card>
  );
}

function MetricMiniCard({
  title,
  value,
  suffix,
  trend,
  note,
  tone = "green",
  chart = "up",
}) {
  const toneMap = {
    green: "text-emerald-400",
    amber: "text-amber-300",
    rose: "text-rose-400",
  };

  return (
    <Card className="p-5">
      <p className="text-base text-slate-400">{title}</p>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-4xl font-semibold text-white">{value}</span>
        {suffix ? (
          <span className="mb-1 text-sm text-slate-500">{suffix}</span>
        ) : null}
      </div>

      <div className="mt-3 h-10 w-24">
        <svg viewBox="0 0 120 48" className="h-full w-full">
          {chart === "up" && (
            <path
              d="M4 40 L24 28 L36 12 L54 30 L74 30 L94 20 L114 28"
              fill="none"
              stroke="#34d399"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {chart === "watch" && (
            <path
              d="M4 34 L22 34 L34 12 L58 16 L78 16 L98 6 L114 0"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {chart === "down" && (
            <path
              d="M4 8 L22 16 L38 16 L54 28 L76 22 L96 34 L114 28"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <p className={`mt-3 text-sm font-semibold ${toneMap[tone]}`}>{trend}</p>
      <p className="mt-1 text-sm text-slate-400">{note}</p>

      {title === "Rhythm Stability" ? (
        <div className="mt-4 h-2 rounded-full bg-[#141a3d]">
          <div
            className="h-2 rounded-full bg-amber-400"
            style={{ width: "92%" }}
          />
        </div>
      ) : null}
    </Card>
  );
}

function TrendChart() {
  const points = [
    64, 66, 64, 67, 70, 74, 77, 74, 76, 78, 81, 76, 79, 80, 81, 76, 77, 78, 78,
    72, 71, 71, 72, 71, 64, 63, 62, 62, 54, 55,
  ];
  const max = 100;
  const min = 30;

  const path = points
    .map((value, index) => {
      const x = 80 + (index / (points.length - 1)) * 860;
      const y = 280 - ((value - min) / (max - min)) * 200;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0d1230] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xl font-semibold text-white">Health Score Trend</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Alert
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Anomaly
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Doctor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            Symptom
          </span>
          <BarChart3 className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5">
        <svg viewBox="0 0 980 320" className="h-[250px] w-full">
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`h-${i}`}
              x1="80"
              y1={40 + i * 60}
              x2="940"
              y2={40 + i * 60}
              stroke="#1d244f"
              strokeDasharray="4 6"
            />
          ))}

          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={80 + i * 120}
              y1="40"
              x2={80 + i * 120}
              y2="280"
              stroke="#151c42"
              strokeDasharray="4 6"
            />
          ))}

          <line
            x1="80"
            y1="170"
            x2="940"
            y2="170"
            stroke="#49517f"
            strokeDasharray="6 6"
          />

          <path
            d={path}
            fill="none"
            stroke="#f6b026"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {[100, 70, 50, 30].map((label, i) => (
            <text
              key={label}
              x="48"
              y={48 + i * 80}
              fill="#536092"
              fontSize="14"
            >
              {label}
            </text>
          ))}

          {[0, 4, 8, 12, 16, 20, 24, 28].map((label, i) => (
            <text
              key={label}
              x={80 + i * 120}
              y="304"
              fill="#536092"
              fontSize="14"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function ScoreRing() {
  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r="68"
          stroke="#1a2146"
          strokeWidth="18"
          fill="none"
        />
        <circle
          cx="100"
          cy="100"
          r="68"
          stroke="#f6b026"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="427"
          strokeDashoffset="115"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-4xl font-semibold text-amber-300">
        73
      </div>
    </div>
  );
}

function ScoreDriverDonut() {
  return (
    <div className="relative mx-auto h-52 w-52">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
        <circle
          cx="110"
          cy="110"
          r="62"
          stroke="#1b2148"
          strokeWidth="22"
          fill="none"
        />

        <circle
          cx="110"
          cy="110"
          r="62"
          stroke="#34d399"
          strokeWidth="22"
          fill="none"
          strokeLinecap="butt"
          pathLength="100"
          strokeDashoffset="0"
          strokeDasharray="33 67"
        />
        <circle
          cx="110"
          cy="110"
          r="62"
          stroke="#f6b026"
          strokeWidth="22"
          fill="none"
          strokeLinecap="butt"
          pathLength="100"
          strokeDasharray="22 78"
          strokeDashoffset="-33"
        />
        <circle
          cx="110"
          cy="110"
          r="62"
          stroke="#f43f5e"
          strokeWidth="22"
          fill="none"
          strokeLinecap="butt"
          pathLength="100"
          strokeDasharray="24 76"
          strokeDashoffset="-55"
        />
        <circle
          cx="110"
          cy="110"
          r="62"
          stroke="#9ca3af"
          strokeWidth="22"
          fill="none"
          strokeLinecap="butt"
          pathLength="100"
          strokeDasharray="6 94"
          strokeDashoffset="-79"
        />
        <circle
          cx="110"
          cy="110"
          r="62"
          stroke="#60a5fa"
          strokeWidth="22"
          fill="none"
          strokeLinecap="butt"
          pathLength="100"
          strokeDasharray="5 95"
          strokeDashoffset="-85"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-4xl font-semibold text-white">
        73
      </div>
    </div>
  );
}

function HistoryRow({ date, title, subtitle, tone = "rose" }) {
  const toneClass = tone === "rose" ? "bg-rose-500" : "bg-amber-400";

  return (
    <div className="flex items-start gap-0 border-b border-slate-800/70 last:border-b-0">
      <div className={`mt-0.5 h-24 w-1 rounded-full ${toneClass}`} />
      <div className="flex flex-1 items-start justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-sm text-slate-400">{date}</p>
          <p className="mt-1 text-xl font-medium text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>

        <button className="mt-2 text-sm font-medium text-rose-400 hover:text-rose-300">
          View ECG
        </button>
      </div>
    </div>
  );
}

export default function RiskPage() {
  const [range, setRange] = useState("30 days");

  const rangeText = useMemo(() => {
    if (range === "7 days") {
      return "Over the past 7 days your heart health has remained mostly stable, with one short rhythm irregularity and a mild HRV dip after the 18th.";
    }
    if (range === "90 days") {
      return "Over the past 90 days your heart health has shown a broader pattern of recovery, though afternoon rhythm irregularities and low-HRV periods still appear intermittently.";
    }
    if (range === "1 year") {
      return "Across the last year, your cardiac trend has remained manageable overall, with several clusters of elevated rhythm instability during high-activity weeks.";
    }

    return "Over the past 30 days your heart health has followed a mildly upward trend. Your resting heart rate has come down by an average of 4 BPM compared to the previous month, and your HRV has been climbing steadily since the 15th. The one area worth watching is your afternoon rhythm — you've had five brief irregular episodes between 2 and 4pm this month, all mild and self-resolving.";
  }, [range]);

  return (
    <div className="w-full min-w-0 space-y-8 pb-10 text-[0.92rem]">
      <section className="relative overflow-hidden border-b border-slate-900/80 pb-8">
        <div className="flex flex-col items-center justify-center px-6 pt-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <ScoreRing />

            <div className="text-left">
              <p className="text-lg text-slate-400">CardiShirt Risk Score</p>
              <p className="mt-1 text-[56px] font-semibold leading-none text-amber-300">
                73
              </p>
              <p className="mt-2 text-lg text-slate-400">Today</p>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2 text-amber-300">
                <TrendingUp className="h-4 w-4" />
                <span className="text-2xl font-semibold">+4 points</span>
              </div>

              <svg viewBox="0 0 120 48" className="mt-3 h-12 w-32">
                <path
                  d="M6 30 L24 40 L42 22 L60 34 L78 16 L98 22 L116 4"
                  fill="none"
                  stroke="#f6b026"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="mt-2 text-sm text-slate-500">vs. last week</p>
            </div>
          </div>

          <p className="mt-6 max-w-4xl text-center text-3xl font-semibold leading-[1.45] text-white">
            Your score has been slightly elevated since Thursday. We've flagged
            three factors worth reviewing below.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {["7 days", "30 days", "90 days", "1 year"].map((item) => (
              <RangeButton
                key={item}
                label={item}
                active={range === item}
                onClick={() => setRange(item)}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <Card className="p-6">
            <p className="text-lg font-semibold leading-9 text-white">
              {rangeText}
            </p>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-400">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span className="text-sm">CardiShirt AI</span>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                </div>
              </div>

              <button className="flex items-center gap-2 text-sm font-medium text-rose-400 hover:text-rose-300">
                <Share2 className="h-4 w-4" />
                Share with doctor
              </button>
            </div>
          </Card>

          <TrendChart />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <MetricMiniCard
              title="Resting Heart Rate"
              value="68"
              suffix="BPM"
              trend="-4 BPM Improving"
              note=""
              tone="green"
              chart="up"
            />
            <MetricMiniCard
              title="HRV (RMSSD)"
              value="37"
              suffix="ms"
              trend="-7 ms Low — rest recommended"
              note=""
              tone="amber"
              chart="watch"
            />
            <MetricMiniCard
              title="Rhythm Stability"
              value="93"
              suffix="%"
              trend="-2% Occasional irregularity"
              note=""
              tone="amber"
              chart="down"
            />
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xl font-semibold text-white">
                Wearing Consistency
              </p>
              <p className="text-2xl font-semibold text-white">87%</p>
            </div>

            <div className="mt-4 flex gap-1.5 overflow-hidden">
              {Array.from({ length: 30 }).map((_, index) => (
                <div
                  key={index}
                  className={`h-5 flex-1 rounded-full ${
                    index < 26
                      ? "bg-emerald-400"
                      : index < 28
                        ? "bg-[#22454f]"
                        : "bg-[#151c42]"
                  }`}
                />
              ))}
            </div>

            <p className="mt-5 text-base leading-8 text-slate-400">
              Your data coverage this month is 87% — this is enough for a
              reliable risk assessment.{" "}
              <span className="text-rose-400">Improve your coverage</span>
            </p>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <p className="text-xl font-semibold text-white">
                Alert & anomaly history
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#161d45] text-sm text-slate-300">
                8
              </div>
            </div>

            <div className="px-6 pb-2">
              <HistoryRow
                date="Mar 28, 2:14 PM"
                title="Irregular rhythm episode"
                subtitle="42 seconds, self-resolved"
                tone="rose"
              />
              <HistoryRow
                date="Mar 25, 3:47 PM"
                title="Irregular rhythm episode"
                subtitle="28 seconds, self-resolved"
                tone="rose"
              />
              <HistoryRow
                date="Mar 22, 11:03 AM"
                title="Elevated resting HR"
                subtitle="32 minutes above baseline"
                tone="amber"
              />
              <HistoryRow
                date="Mar 18, 2:31 PM"
                title="Afternoon rhythm variation"
                subtitle="Brief, within normal range"
                tone="amber"
              />
              <HistoryRow
                date="Mar 14, 9:15 AM"
                title="Morning HR spike"
                subtitle="8 minutes, exercise-related"
                tone="amber"
              />
            </div>

            <div className="px-6 pb-6 pt-2">
              <button className="text-sm font-medium text-rose-400 hover:text-rose-300">
                Show all 8 events
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xl font-semibold text-white">Comparison</p>

              <div className="flex gap-3">
                <button className="rounded-full border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
                  vs. Last Period
                </button>
                <button className="rounded-full border border-slate-700 bg-[#0a0f26] px-4 py-2 text-sm text-slate-400">
                  vs. Baseline
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-[#12183b] p-4">
                <p className="text-sm text-slate-400">Resting HR</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  68 <span className="text-base text-slate-500">BPM</span>
                  <span className="ml-3 text-base text-slate-500">
                    vs 72 BPM
                  </span>
                </p>
                <p className="mt-3 text-sm font-semibold text-emerald-400">
                  Better
                </p>
              </div>

              <div className="rounded-2xl bg-[#12183b] p-4">
                <p className="text-sm text-slate-400">HRV</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  37 <span className="text-base text-slate-500">ms</span>
                  <span className="ml-3 text-base text-slate-500">
                    vs 44 ms
                  </span>
                </p>
                <p className="mt-3 text-sm font-semibold text-amber-300">
                  Watch
                </p>
              </div>

              <div className="rounded-2xl bg-[#12183b] p-4">
                <p className="text-sm text-slate-400">Rhythm</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  93<span className="text-base text-slate-500">%</span>
                  <span className="ml-3 text-base text-slate-500">vs 95%</span>
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-400">
                  Same
                </p>
              </div>

              <div className="rounded-2xl bg-[#12183b] p-4">
                <p className="text-sm text-slate-400">Alerts/wk</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  2{" "}
                  <span className="ml-3 text-base text-slate-500">vs 1.2</span>
                </p>
                <p className="mt-3 text-sm font-semibold text-amber-300">
                  Watch
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-white">
              Your resting heart rate is improving, but your HRV and alert
              frequency need attention compared to last month.
            </p>

            <div className="mt-6 flex justify-end">
              <button className="rounded-2xl bg-rose-500 px-6 py-3 text-sm font-medium text-white hover:bg-rose-400">
                <span className="flex items-center gap-3">
                  <Share2 className="h-4 w-4" />
                  Share comparison report
                </span>
              </button>
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <div>
            <p className="text-2xl font-semibold text-white">
              What's driving your score
            </p>
            <p className="mt-1 text-base text-slate-400">
              Based on 30 days of data
            </p>

            <div className="mt-5">
              <ScoreDriverDonut />
            </div>
          </div>

          <DriverCard
            title="Resting Heart Rate"
            value="+6"
            description="Your resting rate has been lower than usual this month."
            tone="green"
            icon={Heart}
          />
          <DriverCard
            title="Heart Rate Variability"
            value="-4"
            description="Your HRV dropped after the 18th and has not fully recovered."
            tone="red"
            icon={Activity}
          />
          <DriverCard
            title="Rhythm Stability"
            value="-3"
            description="Five brief irregular episodes this month, all self-resolving."
            tone="amber"
            icon={AlertTriangle}
          />
          <DriverCard
            title="Wearing Consistency"
            value="+2"
            description="You wore the shirt on 87% of days — good coverage."
            tone="green"
            icon={Shirt}
          />
          <DriverCard
            title="Activity Pattern"
            value="–"
            description="Your daily activity level has been consistent."
            tone="neutral"
            icon={TrendingUp}
          />
          <DriverCard
            title="Sleep Heart Rate"
            value="-2"
            description="Your overnight heart rate has been slightly elevated."
            tone="amber"
            icon={Moon}
          />

          <div className="pt-1">
            <p className="text-xl font-semibold text-white">Suggestions</p>

            <div className="mt-4 space-y-4">
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <Moon className="mt-1 h-4 w-4 text-rose-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Rest this afternoon
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-400">
                      Your rhythm tends to be irregular on high-activity days.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <Shirt className="mt-1 h-4 w-4 text-rose-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Wear CardiShirt tonight
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-400">
                      Sleep HRV data would improve your score accuracy.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <Share2 className="mt-1 h-4 w-4 text-rose-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Share this week's data
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-400">
                      Your score has been elevated for 5 days.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
