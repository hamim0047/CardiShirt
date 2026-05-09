export default function SectionCard({ title, children, rightContent }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {rightContent}
      </div>
      {children}
    </div>
  );
}
