// client/src/components/layout/lLayout.tsx


import { useState } from "react";
import { Outlet } from "react-router-dom";
import { lSidebar as Sidebar } from "./lSidebar";
import { lHeader as Header } from "./lHeader";
import { AnimatedBackground } from "../ui/AnimatedBackground";

export function lLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#fdfcf8] text-slate-900">

      <AnimatedBackground />

      <Sidebar
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarAbierto((p) => !p)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}