import { useEffect, useMemo, useState, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Minus,
  Phone,
  Plus,
  Shield,
  Sparkles,
  TrendingUp,
  Wifi,
} from "lucide-react";
import ECGChart from "../components/ecg/ECGChart";
import { getLatestEcg, analyzeECG } from "../services/ecgService";
import { getEmergencyContacts } from "../services/emergencyContactService";

const resources = [
  { name: "Dhaka Medical College Hospital", distance: "1.8 km", eta: "~7 min" },
  { name: "National Heart Foundation", distance: "3.2 km", eta: "~12 min" },
  { name: "Square Hospital", distance: "4.1 km", eta: "~15 min" },
];

const meds = [
  { name: "Metoprolol 25mg", taken: true },
  { name: "Aspirin 75mg", taken: true },
  { name: "Atorvastatin 10mg", taken: false },
];

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-slate-800 bg-[#0d1230] ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <Card className={`p-5 ${item.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{item.title}</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-tight text-white 2xl:text-5xl">
              {item.value}
            </span>
            {item.suffix ? (
              <span className="mb-2 text-sm text-slate-400">{item.suffix}</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-[#0a0f26] p-2.5">
          <Icon className={`h-5 w-5 ${item.color}`} />
        </div>
      </div>

      <p className={`mt-4 text-sm font-medium ${item.color}`}>
        • {item.accent}
      </p>
      <p className="mt-2 text-xs text-slate-500">{item.note}</p>
    </Card>
  );
}

function MiniLead({ label, color, data }) {
  const lead = data || [];

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="h-16 rounded-2xl border border-slate-800 bg-[#070b1d] p-2">
        <svg viewBox="0 0 240 48" className="h-full w-full">
          <path
            d={generateMiniPath(lead)}
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function generateMiniPath(data) {
  if (!data || data.length === 0) {
    return "M0 24 L240 24";
  }

  const sliced = data.slice(0, 40);

  return sliced
    .map((value, index) => {
      const x = (index / Math.max(sliced.length - 1, 1)) * 240;
      const normalized = typeof value === "number" ? value : 512;
      const y = 24 - (normalized - 512) * 0.08;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function getAlertStyles(severity) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "HIGH":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "MEDIUM":
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
    default:
      return "border-slate-700 bg-slate-800/40 text-slate-300";
  }
}

export default function DashboardPage() {
  const latestEcgRef = useRef(null);
  const aiRunningRef = useRef(false);
  const [ecgData, setEcgData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [aiSummary, setAiSummary] = useState("Loading AI analysis...");
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [riskResult, setRiskResult] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchECG = async () => {
      try {
        console.log("Fetching ECG...");

        const ecgRes = await getLatestEcg();

        console.log("ECG RESPONSE:", ecgRes.data);

        const latest = ecgRes.data?.record || null;

        setEcgData(latest);

        console.log(
          "SETTING ECG DATA:",
          latest.signal.length,
          latest.signal.slice(0, 10),
        );

        // IMPORTANT
        latestEcgRef.current = latest;
      } catch (error) {
        console.error("ECG streaming error:", error);
      }
    };

    fetchECG();

    // ECG waveform refresh
    const interval = setInterval(fetchECG, 2000);

    return () => {
      isMounted = false;

      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runAIAnalysis = async () => {
      if (aiRunningRef.current) {
        console.log("AI already running, skipping...");

        return;
      }

      aiRunningRef.current = true;

      console.log("========== AI TIMER FIRED ==========");

      try {
        const record = latestEcgRef.current;

        console.log("ECG AVAILABLE FOR AI:", record);

        if (!record?.signal || record.signal.length === 0) {
          console.log("NO ECG SIGNAL");

          return;
        }

        console.log("SENDING AI REQUEST TO BACKEND");

        const aiRes = await analyzeECG({
          ecg: record.signal,

          sampling_rate: record.samplingRate || 250,
        });

        console.log("AI RESPONSE:", aiRes.data);

        const result = aiRes.data.data;

        setAiResult(result);

        setRiskResult(result.layer2?.decision);

        setAiSummary(result.layer3?.explanation || "No explanation available");
      } catch (error) {
        console.error("AI ERROR:", error);
      } finally {
        // IMPORTANT

        aiRunningRef.current = false;
      }
    };

    // optional: wait a little before first AI call
    const firstTimeout = setTimeout(runAIAnalysis, 3000);

    // AI every 10 seconds
    const interval = setInterval(() => {
      if (latestEcgRef.current) {
        runAIAnalysis();
      } else {
        console.log("Waiting for ECG data...");
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, []);

  const statCards = useMemo(() => {
    const layer1 = aiResult?.layer1 || {};
    const layer2 = aiResult?.layer2 || {};

    const risk = layer2?.decision?.risk || "LOW";

    // =========================
    // Layer 1 values
    // =========================

    const heartRate = Math.round(layer1?.heartRate ?? 72);

    const hrv = Math.round(layer1?.hrv?.sdnn ?? layer1?.hrv ?? 42);

    const rPeakInterval = heartRate > 0 ? Math.round(60000 / heartRate) : 834;

    // =========================
    // AI Health Score
    // =========================

    const aiHealthScore =
      risk === "CRITICAL"
        ? 20
        : risk === "HIGH"
          ? 50
          : risk === "MEDIUM"
            ? 70
            : 90;

    const breathingRate = Math.round(heartRate / 4.5);

    // =========================
    // ST Segment
    // =========================

    let stSegment = "+0.2";

    if (risk === "HIGH") stSegment = "+0.4";

    if (risk === "CRITICAL") stSegment = "+0.8";

    return [
      {
        title: "Heart Rate",

        value: heartRate,

        suffix: "BPM",

        accent: risk === "HIGH" || risk === "CRITICAL" ? "Warning" : "Stable",

        note: "from latest ECG",

        icon: Heart,

        color: "text-rose-400",

        border: "border-rose-500/20",
      },

      {
        title: "AI Health Score",

        value: aiHealthScore,

        suffix: "/100",

        accent: risk === "HIGH" ? "Needs review" : "+3 from yesterday",

        note: "AI risk engine",

        icon: Shield,

        color: risk === "HIGH" ? "text-amber-400" : "text-emerald-400",

        border:
          risk === "HIGH" ? "border-amber-500/20" : "border-emerald-500/20",
      },

      {
        title: "HRV",

        value: hrv,

        suffix: "ms",

        accent: hrv < 20 ? "Low variability" : "Good variability",

        note: "Layer 1 HRV analysis",

        icon: Activity,

        color: "text-emerald-400",

        border: "border-emerald-500/20",
      },

      {
        title: "Breathing Rate",

        value: breathingRate,

        suffix: "BPM",

        accent: "Normal",

        note: "Estimated from ECG",

        icon: Wifi,

        color: "text-blue-400",

        border: "border-blue-500/20",
      },

      {
        title: "T Wave Status",

        value: layer1?.morphology?.tWave || "Normal",

        suffix: "",

        accent: "AI morphology",

        note: "ECG waveform analysis",

        icon: TrendingUp,

        color: "text-emerald-400",

        border: "border-emerald-500/20",
      },

      {
        title: "Strain Level",

        value: risk === "HIGH" || risk === "CRITICAL" ? "High" : "Low",

        suffix: "",

        accent: risk === "HIGH" ? "Elevated load" : "Minimal exertion",

        note: "AI cardiovascular stress",

        icon: Sparkles,

        color: risk === "HIGH" ? "text-amber-400" : "text-emerald-400",

        border:
          risk === "HIGH" ? "border-amber-500/20" : "border-emerald-500/20",
      },

      {
        title: "Stress Index",

        value: risk === "CRITICAL" ? 81 : risk === "HIGH" ? 56 : 24,

        suffix: "/100",

        accent: risk === "HIGH" ? "High stress" : "Low stress",

        note: "AI risk estimation",

        icon: AlertTriangle,

        color: risk === "HIGH" ? "text-rose-400" : "text-emerald-400",

        border:
          risk === "HIGH" ? "border-rose-500/20" : "border-emerald-500/20",
      },

      {
        title: "ST Segment",

        value: stSegment,

        suffix: "mV",

        accent: risk === "HIGH" ? "Borderline" : "Normal range",

        note: "No deviation",

        icon: TrendingUp,

        color: risk === "HIGH" ? "text-amber-400" : "text-emerald-400",

        border:
          risk === "HIGH" ? "border-amber-500/20" : "border-emerald-500/20",
      },

      {
        title: "R-Peak Interval",

        value: rPeakInterval,

        suffix: "ms",

        accent: risk === "HIGH" ? "Irregular" : "Regular",

        note: "Calculated from HR",

        icon: Clock3,

        color: "text-blue-400",

        border: "border-blue-500/20",
      },
    ];
  }, [aiResult]);

  return (
    <div className="w-full min-w-0 space-y-6 pb-10">
      {activeAlert && (
        <div
          className={`rounded-3xl border p-4 ${getAlertStyles(activeAlert.severity)}`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                Active Alert: {activeAlert.severity}
              </p>
              <p className="mt-1 text-sm">{activeAlert.message}</p>
            </div>
          </div>
        </div>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <span className="flex items-center gap-2 text-emerald-400">
            <Wifi className="h-4 w-4" />
            {ecgData ? "Connected" : "Waiting for device data"}
          </span>
          <span className="text-slate-300">3 leads active</span>
          <span className="text-slate-300">
            {contacts.length} family contact{contacts.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock3 className="h-4 w-4" />
          {loading
            ? "Loading..."
            : lastSynced
              ? `Synced ${lastSynced.toLocaleTimeString()}`
              : "Not synced yet"}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-amber-300">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">Good morning, Atika</span>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <p className="mb-3 text-sm text-slate-200">
              How are you feeling today?
            </p>
            <div className="flex flex-wrap gap-2">
              {["Good", "Okay", "Not great"].map((item) => (
                <button
                  key={item}
                  className="rounded-2xl bg-[#060a1d] px-4 py-2 text-sm text-white transition hover:bg-[#111735]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm text-slate-200">Did you sleep well?</p>
            <div className="flex flex-wrap gap-2">
              {["Yes", "Somewhat", "No"].map((item) => (
                <button
                  key={item}
                  className="rounded-2xl bg-[#060a1d] px-4 py-2 text-sm text-white transition hover:bg-[#111735]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm text-slate-200">
              Have you taken your medication?
            </p>
            <div className="flex flex-wrap gap-2">
              {["Yes", "Not yet"].map((item) => (
                <button
                  key={item}
                  className="rounded-2xl bg-[#060a1d] px-4 py-2 text-sm text-white transition hover:bg-[#111735]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-lg font-medium text-white">
              Lead II
            </button>
            <span className="text-sm text-slate-500">25mm/s</span>
          </div>

          <div className="rounded-full bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
            ● {ecgData ? "Live ECG active" : "Waiting for live ECG"}
          </div>
        </div>

        <div className="p-4">
          <ECGChart data={ecgData?.signal || []} />

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MiniLead label="Lead I" color="#f43f5e" data={ecgData?.signal} />

            <MiniLead label="Lead II" color="#f59e0b" data={ecgData?.signal} />

            <MiniLead label="Lead III" color="#10b981" data={ecgData?.signal} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {statCards.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-amber-300">
              <Sparkles className="h-4 w-4" />
              Today's AI Summary
            </p>

            <p className="mt-4 max-w-5xl text-lg font-semibold leading-9 text-white md:text-2xl md:leading-10">
              {aiSummary}
            </p>
          </div>

          <span className="hidden text-sm text-slate-500 md:block">Live</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              CardiShirt AI v2.1
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              Auto-updating
            </span>
          </div>

          <button className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            See full diary entry <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-lg font-semibold text-white md:text-xl">
              <MapPin className="h-5 w-5 text-rose-400" />
              Emergency resources near you
            </p>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
              Dhanmondi, Dhaka
            </span>
          </div>

          <span className="text-slate-400">⌃</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {["All", "Hospitals", "Ambulance"].map((tab, index) => (
            <button
              key={tab}
              className={`rounded-full px-4 py-2 text-sm ${
                index === 0
                  ? "bg-rose-500/15 text-rose-400"
                  : "bg-slate-900 text-slate-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-5 h-[300px] rounded-3xl border border-slate-800 bg-[#070b1d] p-4">
          <div className="relative h-full overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-slate-800" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-slate-800" />

            <div className="absolute left-[48%] top-[45%] h-6 w-6 rounded-full border-4 border-rose-300 bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.45)]" />
            <div className="absolute left-[28%] top-[47%] flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white">
              ⚡
            </div>
            <div className="absolute left-[35%] top-[32%] flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
              ✚
            </div>
            <div className="absolute left-[62%] top-[27%] flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-white">
              ✚
            </div>
            <div className="absolute left-[67%] top-[68%] flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-white">
              ✚
            </div>
            <div className="absolute left-[40%] top-[62%] flex h-10 w-10 items-center justify-center rounded-full bg-slate-500 text-white">
              ☎
            </div>

            <div className="absolute bottom-3 left-3 flex gap-3 rounded-full bg-[#0d1230]/80 px-3 py-2 text-xs text-slate-400">
              <span className="text-blue-400">● Govt</span>
              <span className="text-teal-400">● Private</span>
              <span className="text-rose-400">● Integrated</span>
            </div>

            <div className="absolute bottom-3 right-3 flex flex-col gap-2">
              <button className="rounded-xl bg-[#161d45] p-3 text-slate-300">
                <Plus className="h-4 w-4" />
              </button>
              <button className="rounded-xl bg-[#161d45] p-3 text-slate-300">
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {resources.map((item) => (
            <div key={item.name} className="rounded-2xl bg-[#070b1d] p-4">
              <p className="font-medium text-white">{item.name}</p>
              <p className="mt-3 text-sm text-slate-400">
                <span className="text-rose-400">{item.distance}</span>{" "}
                {item.eta}
              </p>
              <button className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                <Phone className="h-4 w-4" />
                Call
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <p className="text-lg font-semibold text-white">Family Contacts</p>

          <div className="mt-5 flex flex-wrap gap-6">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <div key={contact.id} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white">
                    {(contact.name?.slice(0, 2) || "FC").toUpperCase()}
                  </div>
                  <p className="mt-3 text-sm text-white">{contact.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{contact.phone}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No family contacts added yet.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-lg font-semibold text-white">Medication Log</p>

          <div className="mt-5 space-y-4">
            {meds.map((med) => (
              <div
                key={med.name}
                className="flex flex-col gap-3 rounded-2xl bg-[#0a0f26] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-slate-200">{med.name}</p>

                <div className="flex gap-2">
                  <button
                    className={`rounded-xl px-3 py-2 text-sm ${
                      med.taken
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    ✓
                  </button>
                  <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-slate-500">
                    N
                  </button>
                  <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-slate-500">
                    E
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
