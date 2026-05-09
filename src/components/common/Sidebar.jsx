import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  BookOpen,
  TrendingUp,
  Users,
  Settings,
  Heart,
  LogOut,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "ECG Records", path: "/records", icon: Activity },
  { name: "Cardiac Diary", path: "/diary", icon: BookOpen },
  { name: "Risk & Trends", path: "/risk", icon: TrendingUp },
  { name: "Family Circle", path: "/family", icon: Users },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col bg-[#0b1026]">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-500/20 p-2.5 text-rose-400">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CardiShirt</h1>
            <p className="text-xs text-slate-400">Cardiac Monitoring</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "bg-[#151b3b] text-white"
                    : "text-slate-400 hover:bg-[#151b3b] hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-3xl border border-slate-800 bg-[#111735] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500 font-semibold text-white">
              {user?.name?.charAt(0) || "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1026] px-4 py-3 text-sm text-slate-300 transition hover:bg-red-500/15 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
