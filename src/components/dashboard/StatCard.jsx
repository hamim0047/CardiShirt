export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4 shadow-lg">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
      {subtitle && <p className="mt-2 text-sm text-emerald-400">{subtitle}</p>}
    </div>
  );
}
