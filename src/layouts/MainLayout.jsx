import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";
import AIChatPanel from "../components/ai/AIChatPanel";

export default function MainLayout() {
  return (
    <div className="h-screen overflow-hidden bg-[#070b1d] text-white">
      <div className="flex h-full w-full">
        <div className="hidden w-[260px] shrink-0 xl:block">
          <div className="fixed left-0 top-0 h-screen w-[260px] border-r border-slate-800 bg-[#0b1026]">
            <Sidebar />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="fixed left-0 right-0 top-0 z-30 xl:left-[260px] xl:right-[320px]">
            <Topbar />
          </div>

          <div className="mt-[70px] h-[calc(100vh-70px)] w-full overflow-y-auto">
            <div className="w-full min-w-0 px-4 py-6 md:px-6 xl:px-8">
              <Outlet />
            </div>
          </div>
        </div>

        <div className="hidden w-[320px] shrink-0 xl:block">
          <div className="fixed right-0 top-0 h-screen w-[320px] border-l border-slate-800 bg-[#0b1026]">
            <AIChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
