// client/src/components/layout/lHeader.tsx

import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NotificacionBell } from "./NotificacionBell";

interface Props {
  onToggleSidebar: () => void;
}

export function lHeader({ onToggleSidebar }: Props) {
  const { usuario, logout } = useAuth();

  return (
    <header className="bg-white border-b border-zinc-100 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.04)]">

      {/* Izquierda: hamburger (móvil/tablet) + fecha */}
      <div className="flex items-center gap-3 min-w-0">

        {/* Hamburger — solo visible en lg para abajo */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded-lg transition shrink-0"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 font-semibold hidden sm:block">
            Resumen Diario
          </span>
          <p className="text-xs font-medium text-slate-500 capitalize truncate">
            {new Date().toLocaleDateString("es-PE", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Derecha: usuario + logout */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Info usuario */}
        <div className="flex items-center gap-3 pr-3 sm:pr-5 border-r border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-zinc-800 leading-none">
              {usuario?.nombre}
            </p>
            <p className="text-[10px] text-amber-500 font-semibold mt-1 uppercase tracking-widest">
              {usuario?.rol}
            </p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-zinc-900 rounded-full
                          flex items-center justify-center shrink-0">
            <User size={15} className="text-white" />
          </div>
        </div>

        <NotificacionBell />

        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-50 rounded-full transition-all duration-200"
          title="Cerrar Sesión"
        >
          <LogOut size={17} />
        </button>
      </div>

    </header>
  );
}
