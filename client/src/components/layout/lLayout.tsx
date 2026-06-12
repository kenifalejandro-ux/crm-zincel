// client/src/components/layout/lLayout.tsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { lSidebar as Sidebar } from "./lSidebar";
import { lHeader as Header } from "./lHeader";
import { AnimatedBackground } from "../ui/AnimatedBackground";

export function lLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-amber-400 text-slate-900">

      <AnimatedBackground />

      <Sidebar
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarAbierto((p) => !p)} />

        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-7 sm:px-10 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}