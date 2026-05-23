// client/src/components/layout/lLayout.tsx


import { useState } from "react";
import { Outlet } from "react-router-dom";
import { lSidebar as Sidebar } from "./lSidebar";
import { lHeader as Header } from "./lHeader";

export function lLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f1ffff] text-slate-900">

      {/* ───────────────────────── */}
      {/* BLUR TOP LEFT */}
      {/* ───────────────────────── */}
      <div className="pointer-events-none absolute z-20 -top-32 left-350 h-[420px] w-[820px] rounded-full bg-yellow-400/20 blur-3xl   " />

      {/* ───────────────────────── */}
      {/* BLUR BOTTOM LEFT */}
      {/* ───────────────────────── */}
      <div className="pointer-events-none absolute z-20 -bottom-32 -right-90 h-[420px] w-[820px] rounded-full bg-yellow-400/20 blur-3xl  " />

  
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