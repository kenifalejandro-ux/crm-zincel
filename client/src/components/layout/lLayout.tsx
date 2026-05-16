// client/src/components/layout/lLayout.tsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { lSidebar as Sidebar } from "./lSidebar";
import { lHeader as Header }   from "./lHeader";

export function lLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">

      <Sidebar
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarAbierto(p => !p)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
