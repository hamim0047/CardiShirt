export default function ECGChart({ data }) {
  const lead = data?.lead1 || [];

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#070b1d]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <svg viewBox="0 0 1200 320" className="absolute inset-0 h-full w-full">
        <path
          d={generatePath(lead)}
          fill="none"
          stroke="#ff3b5c"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function generatePath(data) {
  if (!data || data.length === 0) {
    return "M0 160 L1200 160";
  }

  const maxPoints = 240;
  const sliced = data.slice(0, maxPoints);

  return sliced
    .map((value, index) => {
      const x = (index / Math.max(sliced.length - 1, 1)) * 1200;
      const normalized = typeof value === "number" ? value : 0;
      const y = 160 - (normalized - 512) * 0.35;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}
