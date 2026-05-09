import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Search,
  Share2,
  Sparkles,
  Wifi,
} from "lucide-react";
import ECGChart from "../components/ecg/ECGChart";
import { getEcgHistory } from "../services/ecgService";
import { getAlerts } from "../services/alertService";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-slate-800 bg-[#0d1230] ${className}`}
    >
      {children}
    </div>
  );
}

function getSessionLabel(record, index) {
  if (!record?.timestamp) return `Session ${index + 1}`;

  const date = new Date(record.timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function formatTime(ts) {
  if (!ts) return "--:--";
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFullDate(ts) {
  if (!ts) return "No date";
  return new Date(ts).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getHrRange(record) {
  const hr = record?.heartRate;
  if (!hr) return "--";
  return `${Math.max(40, hr - 8)}–${hr + 6} BPM`;
}

function getDuration(record, index) {
  const leadLen = Array.isArray(record?.lead1) ? record.lead1.length : 0;
  const samplingRate = record?.samplingRate || 250;
  const sec =
    leadLen > 0 ? Math.max(1, Math.round(leadLen / samplingRate)) : 30;

  if (index === 0)
    return `Continuous — ${Math.max(1, Math.floor(sec / 60)) || 1}m ${sec % 60}s`;
  if (index % 2 === 0) return `Manual — ${sec}s`;
  return `Doctor requested — ${sec}s`;
}

function getRecordStatus(record, linkedAlerts) {
  if (
    linkedAlerts.some((a) => a.severity === "CRITICAL" || a.severity === "HIGH")
  ) {
    return { label: "Alert", tone: "alert" };
  }
  if (linkedAlerts.length > 0) {
    return { label: "Flagged", tone: "flagged" };
  }
  return { label: "Normal", tone: "normal" };
}

function statusPillClasses(tone) {
  if (tone === "alert") return "bg-rose-500/10 text-rose-400";
  if (tone === "flagged") return "bg-amber-500/10 text-amber-300";
  return "bg-emerald-500/10 text-emerald-400";
}

function sessionBarColor(tone) {
  if (tone === "alert") return "bg-rose-500";
  if (tone === "flagged") return "bg-amber-400";
  return "bg-cyan-400";
}

function MiniWave({ data, color = "#f43f5e" }) {
  const values =
    Array.isArray(data) && data.length
      ? data.slice(0, 32)
      : [512, 515, 510, 520];

  const path = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 120;
      const y = 22 - (Number(value || 512) - 512) * 0.08;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 120 44" className="h-8 w-20">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatBox({ title, value, suffix, note, color = "text-white" }) {
  return (
    <div className="rounded-2xl bg-[#12183b] p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <div className="mt-3 flex items-end gap-2">
        <span className={`text-4xl font-semibold ${color}`}>{value}</span>
        {suffix ? (
          <span className="mb-1 text-sm text-slate-500">{suffix}</span>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </div>
  );
}

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [note, setNote] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [historyRes, alertsRes] = await Promise.all([
          getEcgHistory(),
          getAlerts(),
        ]);

        if (!mounted) return;

        const history = historyRes.data?.records || [];
        const alertList = alertsRes.data?.alerts || [];

        setRecords(history);
        setAlerts(alertList);

        if (history.length > 0) {
          setSelectedId((prev) => prev || history[0].id);
        }
      } catch (error) {
        console.error("Failed to load ECG records page:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const recordsWithMeta = useMemo(() => {
    return records.map((record, index) => {
      const linkedAlerts = alerts.filter((a) => a.ecgRecordId === record.id);
      const status = getRecordStatus(record, linkedAlerts);

      return {
        ...record,
        _index: index,
        _linkedAlerts: linkedAlerts,
        _status: status,
        _groupLabel: getSessionLabel(record, index),
        _duration: getDuration(record, index),
        _hrRange: getHrRange(record),
      };
    });
  }, [records, alerts]);

  const filteredRecords = useMemo(() => {
    return recordsWithMeta.filter((record) => {
      const matchesSearch =
        !search ||
        formatTime(record.timestamp)
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        record._groupLabel.toLowerCase().includes(search.toLowerCase()) ||
        record._duration.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Flagged" && record._status.tone === "flagged") ||
        (activeFilter === "Normal" && record._status.tone === "normal") ||
        (activeFilter === "Doctor Share" && record._index % 2 === 1);

      return matchesSearch && matchesFilter;
    });
  }, [recordsWithMeta, search, activeFilter]);

  const selectedRecord =
    filteredRecords.find((r) => r.id === selectedId) ||
    recordsWithMeta.find((r) => r.id === selectedId) ||
    filteredRecords[0] ||
    null;

  const selectedAlerts = selectedRecord?._linkedAlerts || [];
  const primarySelectedAlert = selectedAlerts[0] || null;

  const averageHr = selectedRecord?.heartRate || "--";
  const hrRange = selectedRecord?._hrRange || "--";
  const hrv = selectedRecord?.hrv || "--";
  const rhythm = selectedAlerts.length > 0 ? "Review" : "NSR";

  const aiAnalysis = useMemo(() => {
    if (!selectedRecord) {
      return "No ECG record is selected yet.";
    }

    if (selectedAlerts.length > 0) {
      const highest = [...selectedAlerts].sort((a, b) => {
        const order = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        return (order[b.severity] || 0) - (order[a.severity] || 0);
      })[0];

      return `This recording was made on ${formatFullDate(
        selectedRecord.timestamp,
      )}. The system detected ${
        highest.message || "a cardiac anomaly"
      } during this session. Average heart rate was ${
        selectedRecord.heartRate ?? "not available"
      } BPM and HRV was ${
        selectedRecord.hrv ?? "not available"
      } ms. Review is recommended because this record contains an alert-level event.`;
    }

    return `This recording was made on ${formatFullDate(
      selectedRecord.timestamp,
    )}. Your heart showed a stable pattern throughout this session, with heart rate around ${
      selectedRecord.heartRate ?? "not available"
    } BPM and HRV around ${
      selectedRecord.hrv ?? "not available"
    } ms. Overall, this ECG record appears within the expected range for this user.`;
  }, [selectedRecord, selectedAlerts]);

  const detectedEvents = useMemo(() => {
    if (!selectedRecord) return [];

    if (selectedAlerts.length > 0) {
      return selectedAlerts.map((alert) => ({
        id: alert.id,
        time: formatTime(alert.createdAt),
        title: alert.message || alert.type,
        duration: "~30 seconds",
        description:
          alert.severity === "CRITICAL"
            ? "A critical-level pattern was detected and immediate attention was recommended."
            : alert.severity === "HIGH"
              ? "A high-risk rhythm or heart-rate event was detected in this session."
              : "A moderate anomaly was detected during the recording.",
        tone:
          alert.severity === "CRITICAL"
            ? "rose"
            : alert.severity === "HIGH"
              ? "amber"
              : "yellow",
        badge: alert.severity,
      }));
    }

    return [
      {
        id: "baseline",
        time: formatTime(selectedRecord.timestamp),
        title: "Stable ECG session",
        duration: "~full session",
        description: "No alert-level abnormality was linked to this record.",
        tone: "emerald",
        badge: "Normal",
      },
    ];
  }, [selectedRecord, selectedAlerts]);

  const leftGroups = useMemo(() => {
    const groups = [];
    const map = new Map();

    filteredRecords.forEach((record) => {
      if (!map.has(record._groupLabel)) {
        map.set(record._groupLabel, []);
        groups.push(record._groupLabel);
      }
      map.get(record._groupLabel).push(record);
    });

    return groups.map((label) => ({
      label,
      items: map.get(label),
    }));
  }, [filteredRecords]);

  const baselineHr = selectedRecord?.heartRate
    ? Math.max(40, selectedRecord.heartRate - 4)
    : 72;
  const baselineHrv = selectedRecord?.hrv
    ? Math.max(20, selectedRecord.hrv - 2)
    : 42;

  return (
    <div className="h-full w-full min-w-0">
      <div className="grid h-full min-h-[calc(100vh-130px)] grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-slate-800 p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#12183b] px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search records..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["All", "Flagged", "Normal", "Doctor Share"].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveFilter(item)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeFilter === item
                      ? "bg-rose-500 text-white"
                      : "bg-[#0a0f26] text-slate-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">
                Loading ECG records...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                No ECG records found.
              </div>
            ) : (
              <div className="space-y-5 p-4">
                {leftGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-3 text-sm text-slate-400">{group.label}</p>

                    <div className="space-y-3">
                      {group.items.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => setSelectedId(record.id)}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                            selectedRecord?.id === record.id
                              ? "border-slate-700 bg-[#070b1d]"
                              : "border-transparent bg-transparent hover:bg-[#101633]"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-1 h-[84px] w-1 rounded-full ${sessionBarColor(
                                record._status.tone,
                              )}`}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-2xl font-semibold text-white">
                                    {formatTime(record.timestamp)}
                                  </p>
                                  <p className="mt-1 text-lg text-slate-300">
                                    {record._duration}
                                  </p>
                                  <p className="mt-2 text-sm text-slate-500">
                                    {record._hrRange}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusPillClasses(
                                    record._status.tone,
                                  )}`}
                                >
                                  {record._status.label}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <MiniWave
                                  data={record.lead1}
                                  color={
                                    record._status.tone === "alert"
                                      ? "#f43f5e"
                                      : record._status.tone === "flagged"
                                        ? "#f59e0b"
                                        : "#22d3ee"
                                  }
                                />
                                {record._linkedAlerts.length > 0 ? (
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span>
                                      {record._linkedAlerts.length} event
                                      {record._linkedAlerts.length > 1
                                        ? "s"
                                        : ""}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-800 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-white">
                  <span className="text-2xl font-semibold">
                    {selectedRecord
                      ? formatFullDate(selectedRecord.timestamp)
                      : "No record"}
                  </span>
                  <span className="text-xl text-slate-400">
                    {selectedRecord
                      ? formatTime(selectedRecord.timestamp)
                      : "--:--"}
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
                    {selectedRecord?._duration || "No session"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <Download className="h-5 w-5 cursor-pointer hover:text-white" />
                  <Share2 className="h-5 w-5 cursor-pointer hover:text-white" />
                  <FileText className="h-5 w-5 cursor-pointer hover:text-white" />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <button className="rounded-full border border-slate-700 bg-[#0a0f26] px-4 py-2 text-slate-300">
                  ▶
                </button>
                <span className="text-slate-500">Speed</span>
                <button className="rounded-lg bg-white px-3 py-1.5 text-slate-900">
                  25mm/s
                </button>
                <span className="text-slate-500">Gain</span>
                <button className="rounded-lg bg-[#12183b] px-3 py-1.5 text-slate-300">
                  0.5x
                </button>
                <button className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-rose-400">
                  1x
                </button>
                <button className="rounded-lg bg-[#12183b] px-3 py-1.5 text-slate-300">
                  2x
                </button>
                <button className="ml-2 rounded-full bg-rose-500/15 px-4 py-2 text-rose-400">
                  ⦿ AI
                </button>
              </div>
            </div>

            <div className="p-4">
              <ECGChart data={selectedRecord} />

              <div className="mt-4 rounded-2xl bg-[#0a0f26] p-3">
                <div className="relative h-4 rounded-full bg-[#101633]">
                  <div className="absolute inset-y-0 left-0 w-[58%] rounded-full bg-emerald-500/30" />
                  <div className="absolute left-[12%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-rose-500" />
                  <div className="absolute left-[36%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-400" />
                  <div className="absolute left-[78%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-300" />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Start</span>
                  <span>{selectedRecord?._duration || "Session"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-rose-400">
              <Sparkles className="h-4 w-4" />
              AI Analysis
            </p>

            <p className="mt-4 text-2xl font-semibold leading-10 text-white">
              {aiAnalysis}
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-4">
              <StatBox
                title="Avg HR"
                value={averageHr}
                suffix="BPM"
                note="+4 above afternoon avg"
              />
              <StatBox
                title="HR Range"
                value={hrRange.replace(" BPM", "")}
                suffix="BPM"
                note="Within your range"
              />
              <StatBox
                title="HRV"
                value={hrv}
                suffix="ms"
                note="+2 from baseline"
              />
              <StatBox
                title="Rhythm"
                value={rhythm}
                suffix=""
                note={
                  primarySelectedAlert
                    ? primarySelectedAlert.message
                    : "Normal sinus"
                }
              />
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-2xl font-semibold text-slate-300">
              Detected Events
            </p>

            <div className="mt-5 space-y-4">
              {detectedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-2xl border-l-4 bg-[#12183b] p-5 ${
                    event.tone === "rose"
                      ? "border-rose-500"
                      : event.tone === "amber"
                        ? "border-amber-400"
                        : event.tone === "yellow"
                          ? "border-yellow-400"
                          : "border-emerald-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`text-xl font-semibold ${
                          event.tone === "rose"
                            ? "text-rose-400"
                            : event.tone === "amber"
                              ? "text-amber-300"
                              : event.tone === "yellow"
                                ? "text-yellow-300"
                                : "text-emerald-400"
                        }`}
                      >
                        {event.time}
                      </p>
                      <p className="mt-2 text-2xl font-medium text-white">
                        {event.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {event.duration}
                      </p>
                      <p className="mt-3 text-lg text-slate-400">
                        {event.description}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusPillClasses(
                        event.tone === "rose"
                          ? "alert"
                          : event.tone === "emerald"
                            ? "normal"
                            : "flagged",
                      )}`}
                    >
                      {event.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-2xl font-semibold text-slate-300">
              Baseline Comparison
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-[#12183b] p-5">
                <p className="text-sm text-slate-500">Heart Rate</p>

                <div className="mt-5 flex items-end justify-between gap-6">
                  <div className="w-full">
                    <div className="h-3 rounded-full bg-[#0a0f26]">
                      <div className="h-3 w-[58%] rounded-full bg-emerald-500/50" />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Baseline {baselineHr}BPM
                    </p>
                  </div>

                  <div className="w-full">
                    <div className="h-3 rounded-full bg-[#0a0f26]">
                      <div className="h-3 w-[64%] rounded-full bg-rose-500/50" />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Session {averageHr}BPM
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#12183b] p-5">
                <p className="text-sm text-slate-500">HRV</p>

                <div className="mt-5 flex items-end justify-between gap-6">
                  <div className="w-full">
                    <div className="h-3 rounded-full bg-[#0a0f26]">
                      <div className="h-3 w-[38%] rounded-full bg-emerald-500/50" />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Baseline {baselineHrv}ms
                    </p>
                  </div>

                  <div className="w-full">
                    <div className="h-3 rounded-full bg-[#0a0f26]">
                      <div className="h-3 w-[42%] rounded-full bg-rose-500/50" />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Session {hrv}ms
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-lg text-slate-400">
              {selectedRecord?.heartRate
                ? `Your heart rate during this session was slightly different from your recent baseline. ${
                    selectedAlerts.length > 0
                      ? "Because this session contains flagged events, it should be reviewed more carefully."
                      : "This appears within acceptable variation for this user."
                  }`
                : "Baseline comparison will appear when ECG data is available."}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-2xl font-semibold text-slate-300">Notes</p>

            <div className="mt-5 rounded-2xl bg-[#12183b] p-4">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-300">
                  Patient note
                </span>
                <span>
                  {selectedRecord
                    ? formatTime(selectedRecord.timestamp)
                    : "--:--"}
                </span>
              </div>

              <p className="mt-4 text-lg text-white">
                {selectedAlerts.length > 0
                  ? "Patient should review this session because the system linked one or more alert events to this recording."
                  : "No patient note has been added for this session yet."}
              </p>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="mt-4 h-28 w-full rounded-2xl border border-slate-800 bg-[#12183b] p-4 text-white outline-none placeholder:text-slate-500"
            />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-12 border-t border-slate-800 pt-6 text-slate-400">
              <button className="flex items-center gap-2 hover:text-white">
                <FileText className="h-4 w-4" />
                PDF
              </button>
              <button className="flex items-center gap-2 hover:text-white">
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button className="flex items-center gap-2 hover:text-white">
                <Share2 className="h-4 w-4" />
                Link
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
