import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Heart,
  Share2,
  Shirt,
  Moon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Loader from "../components/common/Loader";
import { getRiskSummary } from "../services/riskService";
import { getAlerts } from "../services/alertService";

const RANGE_LABELS = ["7 days", "30 days", "90 days", "1 year"];
const RANGE_LABEL_TO_CODE = {
  "7 days": "7d",
  "30 days": "30d",
  "90 days": "90d",
  "1 year": "1y",
};

const DRIVER_ICONS = {
  restingHr: Heart,
  hrv: Activity,
  rhythmStability: AlertTriangle,
  wearingConsistency: Shirt,
  activityPattern: TrendingUp,
  sleepHr: Moon,
};

const TONE_RING_COLOR = { green: "#34d399", amber: "#f6b026", rose: "#f43f5e" };
const TONE_TEXT_CLASS = {
  green: "text-emerald-400",
  amber: "text-amber-300",
  rose: "text-rose-400",
};

const WEAR_STATUS_CLASS = {
  full: "bg-emerald-400",
  partial: "bg-[#2a6a66]",
  notWorn: "bg-[#252d52]",
  future: "border border-dashed border-slate-700 bg-transparent",
};

const ALERT_SEVERITY_TONE = {
  CRITICAL: "rose",
  HIGH: "rose",
  MEDIUM: "amber",
  LOW: "amber",
};

function fmtNum(v, digits = 0) {
  if (v == null || Number.isNaN(v)) return "—";
  return digits > 0 ? v.toFixed(digits) : Math.round(v).toString();
}

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
    red: { text: "text-rose-400", bar: "bg-rose-500", value: "text-rose-400" },
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

  const numeric = parseFloat(value);
  const barWidth = Number.isNaN(numeric)
    ? "20%"
    : `${Math.max(10, Math.min(100, Math.abs(numeric) * 10 + 20))}%`;

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
          style={{ width: barWidth }}
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

      {title === "Rhythm Stability" ? (
        <div className="mt-4 h-2 rounded-full bg-[#141a3d]">
          <div
            className="h-2 rounded-full bg-amber-400"
            style={{
              width: `${Math.max(0, Math.min(100, parseFloat(value) || 0))}%`,
            }}
          />
        </div>
      ) : null}
    </Card>
  );
}

function TrendChart({ history }) {
  const points =
    history && history.length > 0 ? history : [{ date: new Date(), score: 70 }];
  const max = 100;
  const min = 30;
  const n = points.length;

  const path = points
    .map((p, index) => {
      const x = n > 1 ? 80 + (index / (n - 1)) * 860 : 80;
      const clamped = Math.max(min, Math.min(max, p.score));
      const y = 280 - ((clamped - min) / (max - min)) * 200;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const tickCount = Math.min(8, n);
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const idx = tickCount > 1 ? Math.round((i / (tickCount - 1)) * (n - 1)) : 0;
    const p = points[idx];
    return {
      x: n > 1 ? 80 + (idx / (n - 1)) * 860 : 80,
      label: new Date(p.date).toLocaleDateString(
        [],
        n > 60 ? { month: "short" } : { month: "short", day: "numeric" },
      ),
    };
  });

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
          {ticks.map((t, i) => (
            <line
              key={`v-${i}`}
              x1={t.x}
              y1="40"
              x2={t.x}
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
          {ticks.map((t, i) => (
            <text
              key={`tick-${i}`}
              x={t.x}
              y="304"
              fill="#536092"
              fontSize="13"
            >
              {t.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function ScoreRing({ score, tone }) {
  const r = 68;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = TONE_RING_COLOR[tone] || TONE_RING_COLOR.amber;
  const textClass = TONE_TEXT_CLASS[tone] || TONE_TEXT_CLASS.amber;

  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={r}
          stroke="#1a2146"
          strokeWidth="18"
          fill="none"
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          stroke={color}
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center text-4xl font-semibold ${textClass}`}
      >
        {fmtNum(score)}
      </div>
    </div>
  );
}

function ScoreDriverDonut({ drivers, score }) {
  const colorFor = {
    green: "#34d399",
    amber: "#f6b026",
    red: "#f43f5e",
    neutral: "#9ca3af",
  };
  const magnitudes = drivers.map((d) => {
    const n = parseFloat(d.value);
    return Number.isNaN(n) ? 3 : Math.max(3, Math.abs(n) * 6);
  });
  const total = magnitudes.reduce((a, b) => a + b, 0) || 1;

  let cursor = 0;
  const segments = drivers.map((d, i) => {
    const pct = (magnitudes[i] / total) * 100;
    const seg = {
      color: colorFor[d.tone] || colorFor.neutral,
      dash: pct,
      offset: -cursor,
    };
    cursor += pct;
    return seg;
  });

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
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="110"
            cy="110"
            r="62"
            stroke={seg.color}
            strokeWidth="22"
            fill="none"
            strokeLinecap="butt"
            pathLength="100"
            strokeDasharray={`${seg.dash} ${100 - seg.dash}`}
            strokeDashoffset={seg.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-4xl font-semibold text-white">
        {fmtNum(score)}
      </div>
    </div>
  );
}

function HistoryRow({ date, title, subtitle, tone = "rose", onViewEcg }) {
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
        <button
          onClick={onViewEcg}
          className="mt-2 text-sm font-medium text-rose-400 hover:text-rose-300"
        >
          View ECG
        </button>
      </div>
    </div>
  );
}

export default function RiskPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState("30 days");
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getRiskSummary(RANGE_LABEL_TO_CODE[range])
      .then((res) => {
        if (!cancelled) setSummary(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message || "Failed to load risk data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    getAlerts()
      .then((res) => setAlerts(res.data?.alerts || []))
      .catch((err) => console.error("Failed to load alerts:", err.message));
  }, []);

  const comparisonRows = useMemo(() => {
    if (!summary) return [];
    const c = summary.comparison;
    return [
      {
        label: "Resting HR",
        ...c.restingHr,
        display: `${fmtNum(c.restingHr.current)} BPM`,
      },
      { label: "HRV", ...c.hrv, display: `${fmtNum(c.hrv.current)} ms` },
      {
        label: "Rhythm",
        ...c.rhythmStability,
        display: `${fmtNum(c.rhythmStability.current)}%`,
      },
      {
        label: "Alerts/wk",
        ...c.alertsPerWeek,
        display: `${fmtNum(c.alertsPerWeek.current, 1)}`,
      },
    ];
  }, [summary]);
  const [shareStatus, setShareStatus] = useState(null);

  const handleShareComparison = async () => {
    const lines = [
      `CardiShirt comparison report (${range}):`,
      `Score: ${summary.score}/100 (${summary.scoreDelta >= 0 ? "+" : ""}${summary.scoreDelta} vs last week)`,
      ...comparisonRows.map(
        (r) =>
          `${r.label}: ${r.display} (vs ${fmtNum(r.baseline, r.label === "Alerts/wk" ? 1 : 0)} ${r.unit}) — ${r.verdict}`,
      ),
    ];
    const text = lines.join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "CardiShirt comparison report", text });
        setShareStatus("shared");
      } catch {
        // cancelled — not an error
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus("copied");
        setTimeout(() => setShareStatus(null), 2500);
      } catch (err) {
        console.error("Clipboard copy failed:", err.message);
      }
    }
  };

  const handleShareWithDoctor = async () => {
    const lines = [
      `CardiShirt heart health summary (${range}):`,
      summary.narrative,
      "",
      `Score: ${summary.score}/100 (${summary.scoreDelta >= 0 ? "+" : ""}${summary.scoreDelta} vs last week)`,
      `Resting HR: ${fmtNum(summary.metrics.restingHr)} BPM`,
      `HRV: ${fmtNum(summary.metrics.hrv)} ms`,
      `Rhythm stability: ${fmtNum(summary.metrics.rhythmStability)}%`,
    ];
    const text = lines.join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "CardiShirt heart health summary",
          text,
        });
        setShareStatus("shared");
      } catch {
        // user cancelled the share sheet — not an error, do nothing
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus("copied");
        setTimeout(() => setShareStatus(null), 2500);
      } catch (err) {
        console.error("Clipboard copy failed:", err.message);
      }
    }
  };

  if (loading && !summary) {
    return <Loader />;
  }

  if (error && !summary) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-slate-400">
        <p>Couldn't load your risk data: {error}</p>
      </div>
    );
  }

  const shownAlerts = alertsExpanded ? alerts : alerts.slice(0, 5);

  return (
    <div className="w-full min-w-0 space-y-8 pb-10 text-[0.92rem]">
      <section className="relative overflow-hidden border-b border-slate-900/80 pb-8">
        <div className="flex flex-col items-center justify-center px-6 pt-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <ScoreRing score={summary.score} tone={summary.scoreTone} />

            <div className="text-left">
              <p className="text-lg text-slate-400">CardiShirt Risk Score</p>
              <p
                className={`mt-1 text-[56px] font-semibold leading-none ${TONE_TEXT_CLASS[summary.scoreTone]}`}
              >
                {fmtNum(summary.score)}
              </p>
              <p className="mt-2 text-lg text-slate-400">Today</p>
            </div>

            <div className="text-left">
              <div
                className={`flex items-center gap-2 ${TONE_TEXT_CLASS[summary.scoreTone]}`}
              >
                {summary.scoreDelta >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-2xl font-semibold">
                  {summary.scoreDelta >= 0 ? "+" : ""}
                  {summary.scoreDelta} points
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">vs. last week</p>
            </div>
          </div>

          <p className="mt-6 max-w-4xl text-center text-3xl font-semibold leading-[1.45] text-white">
            {summary.narrative}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {RANGE_LABELS.map((item) => (
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

      {!summary.hasData && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-300">
          No wear data yet for this period — numbers below are placeholders
          until your CardiShirt has synced.
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <Card className="p-6">
            <p className="text-lg font-semibold leading-9 text-white">
              {summary.narrative}
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
              <button
                onClick={handleShareWithDoctor}
                className="flex items-center gap-2 text-sm font-medium text-rose-400 hover:text-rose-300"
              >
                <Share2 className="h-4 w-4" />
                Share with doctor
              </button>
            </div>
          </Card>

          <TrendChart history={summary.history} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <MetricMiniCard
              title="Resting Heart Rate"
              value={fmtNum(summary.metrics.restingHr)}
              suffix="BPM"
              trend={(() => {
                const d = summary.comparison.restingHr;
                const delta = Math.round((d.current ?? 0) - (d.baseline ?? 0));
                return `${delta <= 0 ? "" : "+"}${delta} BPM ${d.verdict === "Better" ? "Improving" : d.verdict === "Watch" ? "Rising" : "Steady"}`;
              })()}
              tone={
                summary.comparison.restingHr.verdict === "Watch"
                  ? "amber"
                  : "green"
              }
              chart={
                summary.comparison.restingHr.verdict === "Watch"
                  ? "watch"
                  : "up"
              }
            />
            <MetricMiniCard
              title="HRV (RMSSD)"
              value={fmtNum(summary.metrics.hrv)}
              suffix="ms"
              trend={(() => {
                const d = summary.comparison.hrv;
                const delta = Math.round((d.current ?? 0) - (d.baseline ?? 0));
                return `${delta >= 0 ? "+" : ""}${delta} ms ${d.verdict === "Watch" ? "Low — rest recommended" : d.verdict === "Better" ? "Improving" : "Steady"}`;
              })()}
              tone={
                summary.comparison.hrv.verdict === "Watch" ? "amber" : "green"
              }
              chart={
                summary.comparison.hrv.verdict === "Watch" ? "watch" : "up"
              }
            />
            <MetricMiniCard
              title="Rhythm Stability"
              value={fmtNum(summary.metrics.rhythmStability)}
              suffix="%"
              trend={(() => {
                const d = summary.comparison.rhythmStability;
                const delta = Math.round((d.current ?? 0) - (d.baseline ?? 0));
                return `${delta >= 0 ? "+" : ""}${delta}% ${d.verdict === "Watch" ? "Occasional irregularity" : d.verdict === "Better" ? "Improving" : "Steady"}`;
              })()}
              tone={
                summary.comparison.rhythmStability.verdict === "Watch"
                  ? "amber"
                  : "green"
              }
              chart={
                summary.comparison.rhythmStability.verdict === "Watch"
                  ? "watch"
                  : "up"
              }
            />
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xl font-semibold text-white">
                Wearing Consistency
              </p>
              <p className="text-2xl font-semibold text-white">
                {summary.coveragePct}%
              </p>
            </div>

            <div className="mt-4 flex gap-1.5 overflow-hidden">
              {summary.wearingConsistency.map((day, index) => (
                <div
                  key={index}
                  className={`h-5 flex-1 rounded-full ${WEAR_STATUS_CLASS[day.status]}`}
                />
              ))}
            </div>

            <p className="mt-5 text-base leading-8 text-slate-400">
              Your data coverage this month is {summary.coveragePct}%
              {summary.coveragePct >= 85 ? (
                " — this is enough for a reliable risk assessment."
              ) : (
                <>
                  {" "}
                  — more data would improve reliability.{" "}
                  <span className="text-rose-400">Improve your coverage</span>
                </>
              )}
            </p>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <p className="text-xl font-semibold text-white">
                Alert & anomaly history
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#161d45] text-sm text-slate-300">
                {alerts.length}
              </div>
            </div>

            <div className="px-6 pb-2">
              {shownAlerts.length > 0 ? (
                shownAlerts.map((a) => (
                  <HistoryRow
                    onViewEcg={() => navigate("/records")}
                    key={a.id}
                    date={new Date(a.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    title={a.message}
                    subtitle={a.type.replace(/_/g, " ").toLowerCase()}
                    tone={ALERT_SEVERITY_TONE[a.severity] || "amber"}
                  />
                ))
              ) : (
                <p className="py-6 text-sm text-slate-500">
                  No alerts recorded yet.
                </p>
              )}
            </div>

            {alerts.length > 5 && (
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={() => setAlertsExpanded((v) => !v)}
                  className="text-sm font-medium text-rose-400 hover:text-rose-300"
                >
                  {alertsExpanded
                    ? "Show fewer"
                    : `Show all ${alerts.length} events`}
                </button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xl font-semibold text-white">Comparison</p>
              <div className="flex gap-3">
                <button className="rounded-full border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
                  vs. Last Period
                </button>
                <button
                  className="rounded-full border border-slate-700 bg-[#0a0f26] px-4 py-2 text-sm text-slate-400"
                  title="Long-term baseline comparison isn't wired up yet — this currently shows the same previous-period comparison."
                >
                  vs. Baseline
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {comparisonRows.map((row) => (
                <div key={row.label} className="rounded-2xl bg-[#12183b] p-4">
                  <p className="text-sm text-slate-400">{row.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {row.display}
                    <span className="ml-3 text-base text-slate-500">
                      vs{" "}
                      {fmtNum(row.baseline, row.label === "Alerts/wk" ? 1 : 0)}{" "}
                      {row.unit}
                    </span>
                  </p>
                  <p
                    className={`mt-3 text-sm font-semibold ${
                      row.verdict === "Better"
                        ? "text-emerald-400"
                        : row.verdict === "Watch"
                          ? "text-amber-300"
                          : "text-slate-400"
                    }`}
                  >
                    {row.verdict}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {shareStatus === "copied" && (
                <span className="text-sm text-emerald-400">
                  Copied to clipboard!
                </span>
              )}
              <button
                onClick={handleShareComparison}
                className="rounded-2xl bg-rose-500 px-6 py-3 text-sm font-medium text-white hover:bg-rose-400"
              >
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
            <p className="mt-1 text-base text-slate-400">Based on {range}</p>
            <div className="mt-5">
              <ScoreDriverDonut
                drivers={summary.drivers}
                score={summary.score}
              />
            </div>
          </div>

          {summary.drivers.map((d) => (
            <DriverCard
              key={d.key}
              title={d.title}
              value={d.value}
              description={d.description}
              tone={d.tone}
              icon={DRIVER_ICONS[d.key]}
            />
          ))}

          <div className="pt-1">
            <p className="text-xl font-semibold text-white">Suggestions</p>
            <div className="mt-4 space-y-4">
              {summary.drivers.find(
                (d) => d.key === "hrv" && d.tone !== "green",
              ) && (
                <Card className="p-4">
                  <div className="flex items-start gap-4">
                    <Moon className="mt-1 h-4 w-4 text-rose-400" />
                    <div>
                      <p className="text-lg font-semibold text-white">
                        Rest this afternoon
                      </p>
                      <p className="mt-1 text-sm leading-7 text-slate-400">
                        Your HRV has been lower than usual — a lighter afternoon
                        may help it recover.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {summary.coveragePct < 90 && (
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
              )}
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <Share2 className="mt-1 h-4 w-4 text-rose-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Share this week's data
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-400">
                      Keep your care team in the loop with your latest trend.
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
