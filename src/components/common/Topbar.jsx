import { Bell, Search, Wifi, Clock3 } from "lucide-react";

export default function Topbar() {
  return (
    <header className="border-b border-slate-800 bg-[#0b1026]/95 px-4 py-4 backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <span className="flex items-center gap-2 text-emerald-400">
            <Wifi className="h-4 w-4" />
            Connected
          </span>
          <span className="text-slate-300">3 leads active</span>
          <span className="text-slate-300">72%</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-xl bg-[#111735] px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
            <Clock3 className="h-4 w-4" />
            Synced just now
          </div>

          <button className="rounded-xl bg-[#111735] p-2 text-slate-300">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
