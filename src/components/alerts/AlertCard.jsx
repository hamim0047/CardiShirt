export default function AlertCard({ title, message, time }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-medium text-white">{title}</h4>
        {time && <span className="text-xs text-slate-500">{time}</span>}
      </div>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
    </div>
  );
}
