import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Flame, Trophy, User, Pill, Heart, Sparkles, ChevronDown,
} from "lucide-react";
import Loader from "../components/common/Loader";
import { getDiaryCalendar, getDiaryDay, updateJournalEntry, addJournalEntry } from "../services/diaryService";

const TIMELINE_ICONS = { User, Pill, Heart, Sparkles };

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-slate-800 bg-[#0d1230] ${className}`}>
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
          outlined ? "border border-dashed border-slate-600 bg-transparent" : color
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
      {today ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" /> : null}
    </button>
  );
}

function HeartRateChart({ series }) {
  const points = series && series.length > 0 ? series.map((p) => p.bpm) : [];
  if (points.length === 0) {
    return <div className="flex h-[220px] w-full items-center justify-center text-sm text-slate-500">No heart-rate data for this day yet.</div>;
  }

  const path = points
    .map((value, index) => {
      const x = 46 + (index / (points.length - 1 || 1)) * 860;
      const y = 170 - ((value - 40) / 50) * 110;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 960 230" className="h-[220px] w-full">
      {[0, 1, 2, 3].map((i) => (
        <line key={`h-${i}`} x1="46" y1={38 + i * 42} x2="915" y2={38 + i * 42} stroke="#1f274f" strokeDasharray="4 6" />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <text key={`y-${i}`} x="8" y={43 + i * 42} fill="#536092" fontSize="12">
          {[110, 80, 60, 40, ""][i]}
        </text>
      ))}
      {[0, 6, 12, 18].map((t, i) => (
        <text key={`x-${t}`} x={210 + i * 220} y="195" fill="#536092" fontSize="12">
          {`${String(t).padStart(2, "0")}:00`}
        </text>
      ))}
      <path d={path} fill="none" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PoincarePlot({ points }) {
  if (!points || points.length === 0) {
    return <div className="flex h-[110px] w-full items-center justify-center text-sm text-slate-500">No RR-interval data for this day yet.</div>;
  }
  const flat = points.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const scale = (v) => 70 + ((v - min) / (max - min || 1)) * 215;

  return (
    <svg viewBox="0 0 320 170" className="h-[110px] w-full">
      <line x1="70" y1="140" x2="285" y2="25" stroke="#182149" />
      <line x1="70" y1="140" x2="285" y2="140" stroke="#182149" />
      <line x1="70" y1="140" x2="70" y2="30" stroke="#182149" />
      {points.map((p, i) => (
        <circle key={i} cx={scale(p[0])} cy={160 - (scale(p[1]) - 70) * 0.6} r="3" fill="#f43f5e" opacity="0.9" />
      ))}
    </svg>
  );
}

function TimelineRow({ item, isEditing, editText, onEditTextChange, onSave, onCancel, onAction, saving }) {
  const Icon = TIMELINE_ICONS[item.icon] || User;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Icon className={`h-4 w-4 shrink-0 ${item.iconColor}`} />
        <span className="w-16 shrink-0 text-sm text-slate-400">{formatClockTime(item.time)}</span>
        {isEditing ? (
          <input
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave()}
            autoFocus
            className="min-w-0 flex-1 rounded-lg bg-[#0a0f26] px-2 py-1 text-base text-white outline-none"
          />
        ) : (
          <p className="truncate text-base text-white">{item.text}</p>
        )}
      </div>
      {isEditing ? (
        <div className="flex shrink-0 gap-3">
          <button onClick={onSave} disabled={saving} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onCancel} className="text-sm font-medium text-slate-400 hover:text-white">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={onAction} className="shrink-0 text-sm font-medium text-rose-400 hover:text-rose-300">
          {item.action}
        </button>
      )}
    </div>
  );
}

function formatMonthYear(date) {
  return date.toLocaleDateString([], { month: "long", year: "numeric" });
}
function formatLongDate(date) {
  return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}
function formatWeekday(date) {
  return date.toLocaleDateString([], { weekday: "long" });
}
function formatClockTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
function toMonthParam(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function toDateParam(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function DiaryPage() {
  const navigate = useNavigate();
  const diaryTextRef = useRef(null);
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthDays, setMonthDays] = useState([]);
  const [dayDetail, setDayDetail] = useState(null);
  const [loadingDay, setLoadingDay] = useState(true);
  const [error, setError] = useState(null);

    const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [notesExpanded, setNotesExpanded] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
    const [deviceEventsExpanded, setDeviceEventsExpanded] = useState(false);
    const [poincareInfoOpen, setPoincareInfoOpen] = useState(false);

  const handleTimelineAction = (item) => {
    if (item.action === "Edit note") {
      setEditingId(item.id);
      setEditText(item.text);
    } else if (item.action === "View ECG clip") {
      navigate("/records");
    } else if (item.action === "View") {
      diaryTextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      await updateJournalEntry(id, { text: editText.trim() });
      setDayDetail((prev) => ({
        ...prev,
        timeline: prev.timeline.map((t) => (t.id === id ? { ...t, text: editText.trim() } : t)),
      }));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save note:", err.response?.data?.message || err.message);
    } finally {
      setSavingEdit(false);
    }
  };

    const handleAddNote = async () => {
    const text = newNoteText.trim();
    if (!text) return;
    setAddingNote(true);
    try {
      const time = new Date().toTimeString().slice(0, 5);
      const res = await addJournalEntry({ date: toDateParam(selectedDate), time, type: "NOTE", text });
      setDayDetail((prev) => ({
        ...prev,
        notes: [...(prev?.notes || []), { id: res.data.entry.id, time: res.data.entry.occurredAt, text }],
      }));
      setNewNoteText("");
    } catch (err) {
      console.error("Failed to add note:", err.response?.data?.message || err.message);
    } finally {
      setAddingNote(false);
    }
  };

  // Calendar month data
  useEffect(() => {
    getDiaryCalendar(toMonthParam(currentMonth))
      .then((res) => setMonthDays(res.data.days))
      .catch((err) => setError(err.response?.data?.message || "Failed to load calendar"));
  }, [currentMonth]);

  // Selected day detail
  useEffect(() => {
    let cancelled = false;
    setLoadingDay(true);
    getDiaryDay(toDateParam(selectedDate))
      .then((res) => {
        if (!cancelled) setDayDetail(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load this day");
      })
      .finally(() => {
        if (!cancelled) setLoadingDay(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const monthLabel = useMemo(() => formatMonthYear(currentMonth), [currentMonth]);

  const calendarCells = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

    const byDate = new Map(monthDays.map((d) => [new Date(d.date).getDate(), d.status]));

    const cells = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ key: `empty-${i}`, day: "", status: "empty", date: null, today: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      cells.push({
        key: `day-${day}`,
        day,
        status: byDate.get(day) || (cellDate > today ? "future" : "notWorn"),
        date: cellDate,
        today: isSameDay(cellDate, today),
      });
    }
    return cells;
  }, [currentMonth, monthDays, today]);

  const goPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
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

    const deviceEventCount = dayDetail?.timeline?.filter((t) => t.source === "device").length || 0;
  const visibleTimeline = deviceEventsExpanded
    ? dayDetail?.timeline || []
    : (dayDetail?.timeline || []).filter((t) => t.source !== "device");
  const hrvArrow = dayDetail?.hrvTrend === "up" ? "↑" : dayDetail?.hrvTrend === "down" ? "↓" : "→";
  const hrvArrowLabel = dayDetail?.hrvTrend === "up" ? "Improving" : dayDetail?.hrvTrend === "down" ? "Declining" : "Steady";

  return (
    <div className="w-full min-w-0 text-[0.92rem]">
      <div className="grid min-h-[calc(100vh-130px)] grid-cols-1 gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-4">
            <div className="flex items-center justify-between">
              <button onClick={goPrevMonth} className="text-slate-400 hover:text-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-2xl font-semibold text-white">{monthLabel}</p>
              <div className="flex items-center gap-3">
                <button onClick={goToday} className="text-sm font-medium text-rose-400 hover:text-rose-300">
                  Today
                </button>
                <button onClick={goNextMonth} className="text-slate-400 hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-800 px-5 py-4">
            <div className="grid grid-cols-7 gap-y-4 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <p key={`${d}-${i}`} className="text-xs text-slate-500">{d}</p>
              ))}
              {calendarCells.map((item) => (
                <div key={item.key} className="flex justify-center">
                  <DayCell
                    day={item.day}
                    status={item.status}
                    today={item.today}
                    active={item.date ? isSameDay(item.date, selectedDate) : false}
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
              <p className="text-5xl font-semibold text-white">{dayDetail?.streak?.current ?? "—"}</p>
              <span className="text-xl text-white">days</span>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <Trophy className="h-4 w-4" />
              <span>Personal best — {dayDetail?.streak?.best ?? "—"} days</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 px-5 py-5">
            <StatMiniCard title="Days worn" value={dayDetail?.daysWorn?.value ?? "—"} subtitle={`of ${dayDetail?.daysWorn?.of ?? 3}`} />
            <StatMiniCard title="Alerts" value={deviceEventCount} subtitle="events" />
            <StatMiniCard title="Avg Score" value={dayDetail?.avgScore ?? "—"} subtitle="health" />
            <StatMiniCard title="HRV Trend" value={hrvArrow} subtitle={hrvArrowLabel} />
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold text-white">{formatLongDate(selectedDate)}</p>
              <p className="mt-2 text-xl text-slate-400">{formatWeekday(selectedDate)}</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
              {dayDetail?.wornText ?? "—"}
            </span>
          </div>

          {loadingDay && !dayDetail ? (
            <Loader />
          ) : error && !dayDetail ? (
            <p className="py-10 text-slate-400">Couldn't load this day: {error}</p>
          ) : (
            <>
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

              <p ref={diaryTextRef} className="max-w-4xl text-2xl font-semibold leading-[1.7] text-white">{dayDetail?.diaryText}</p>

              <Card className="p-5">
                <p className="text-sm text-slate-400">24-Hour Heart Rate</p>
                <div className="mt-3">
                  <HeartRateChart series={dayDetail?.heartRateSeries} />
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {dayDetail?.timeline?.slice(0, 3).map((item, i) => (
                    <span key={i} className="rounded-full bg-[#151c42] px-3 py-1.5 text-xs text-slate-300">
                      {item.source === "device" ? "⚠️" : "🔗"} {formatClockTime(item.time)} — {item.text}
                    </span>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <Card className="p-5">
                  <p className="text-sm text-slate-400">RMSSD</p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-6xl font-semibold text-white">{dayDetail?.rmssd ?? "—"}</span>
                    <span className="mb-2 text-base text-slate-500">ms</span>
                  </div>
                  <p className="mt-5 text-base font-semibold text-emerald-400">
                    {dayDetail?.rmssd != null ? "Based on this day's readings" : "No HRV data for this day"}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {dayDetail?.rmssd != null && dayDetail.rmssd >= 35 ? "Good variability" : "Below your usual range"}
                  </p>
                </Card>

                <Card className="p-5">
                  <p className="text-sm text-slate-400">Poincaré Plot</p>
                  <div className="mt-4">
                    <PoincarePlot points={dayDetail?.poincare} />
                  </div>
                                    <button
                    onClick={() => setPoincareInfoOpen((v) => !v)}
                    className="mt-2 text-base font-medium text-rose-400 hover:text-rose-300"
                  >
                    {poincareInfoOpen ? "Hide explanation" : "What does this mean?"}
                  </button>
                  {poincareInfoOpen && (
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Each dot plots one heartbeat interval against the one right before it. A wider,
                      more scattered cloud generally reflects healthy beat-to-beat variability, while a
                      tighter cluster means less variation between beats. This is a general wellness
                      indicator, not a diagnosis — talk to your doctor about any pattern that concerns you.
                    </p>
                  )}
                </Card>
              </div>

              <Card className="p-5">
                <p className="text-2xl font-semibold text-slate-300">Events Timeline</p>
                <div className="mt-4">
                  {visibleTimeline.length > 0 ? (
                    visibleTimeline.map((item) => (
                      <TimelineRow
                        key={item.id}
                        item={item}
                        isEditing={editingId === item.id}
                        editText={editText}
                        onEditTextChange={setEditText}
                        onSave={() => handleSaveEdit(item.id)}
                        onCancel={() => setEditingId(null)}
                        onAction={() => handleTimelineAction(item)}
                        saving={savingEdit && editingId === item.id}
                      />
                    ))
                  ) : (
                    <p className="py-4 text-sm text-slate-500">No events logged for this day.</p>
                  )}
                </div>
                                {deviceEventCount > 0 && (
                  <button
                    onClick={() => setDeviceEventsExpanded((v) => !v)}
                    className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-white"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${deviceEventsExpanded ? "rotate-180" : ""}`} />
                    {deviceEventsExpanded
                      ? "Hide device events"
                      : `${deviceEventCount} device event${deviceEventCount === 1 ? "" : "s"}`}
                  </button>
                )}
              </Card>

                            <Card className="px-5 py-4">
                <button onClick={() => setNotesExpanded((v) => !v)} className="flex w-full items-center justify-between">
                  <p className="text-xl font-semibold text-slate-300">
                    Notes {dayDetail?.notes?.length ? `(${dayDetail.notes.length})` : ""}
                  </p>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${notesExpanded ? "rotate-180" : ""}`} />
                </button>

                {notesExpanded && (
                  <div className="mt-3 space-y-3">
                    {dayDetail?.notes?.length > 0 && (
                      <div className="space-y-2">
                        {dayDetail.notes.map((n) => (
                          <p key={n.id} className="text-sm text-slate-400">
                            {formatClockTime(n.time)} — {n.text}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                        placeholder="Add a note for this day..."
                        className="min-w-0 flex-1 rounded-xl bg-[#0a0f26] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={addingNote || !newNoteText.trim()}
                        className="shrink-0 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-400 disabled:opacity-50"
                      >
                        {addingNote ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}

          <div className="flex items-center justify-between gap-4">
            <button onClick={goPrevDay} className="rounded-2xl bg-[#151c42] px-5 py-3 text-sm font-medium text-slate-300 hover:text-white">
              ← Previous day
            </button>
            <button onClick={goNextDay} className="rounded-2xl bg-[#151c42] px-5 py-3 text-sm font-medium text-slate-300 hover:text-white">
              Next day →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
