/** client/src/components/layout/NotificacionBell.tsx */

import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, AlertTriangle, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotificaciones,
  getConteoNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  type Notificacion,
} from "../../services/notificaciones.api";

const ICONO: Record<string, React.ReactNode> = {
  reunion_proxima:   <Calendar size={13} className="text-amber-500 shrink-0 mt-0.5" />,
  lead_sin_actividad: <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />,
};

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function NotificacionBell() {
  const [abierto,   setAbierto]   = useState(false);
  const [items,     setItems]     = useState<Notificacion[]>([]);
  const [noLeidas,  setNoLeidas]  = useState(0);
  const [cargando,  setCargando]  = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Badge: polling cada 30 segundos
  useEffect(() => {
    let activo = true;
    const poll = async () => {
      try {
        const n = await getConteoNoLeidas();
        if (activo) setNoLeidas(n);
      } catch { /* silencioso */ }
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => { activo = false; clearInterval(id); };
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  async function handleAbrir() {
    if (abierto) { setAbierto(false); return; }
    setAbierto(true);
    setCargando(true);
    try {
      const data = await getNotificaciones();
      setItems(data);
      setNoLeidas(0);
      // Marca todas como leídas en segundo plano
      marcarTodasLeidas().catch(() => {});
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  }

  async function handleClick(item: Notificacion) {
    if (!item.leida) {
      marcarLeida(item.id).catch(() => {});
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, leida: true } : n));
    }
    setAbierto(false);
    if (item.url) navigate(item.url);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleAbrir}
        className="relative p-2 text-slate-600 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-all duration-200"
        title="Notificaciones"
      >
        <Bell size={17} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center
                           text-[9px] font-bold text-white bg-red-500 rounded-full px-1 leading-none">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 bg-white border border-gray-200
                        rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-zinc-800">Notificaciones</p>
            {items.some(n => !n.leida) && (
              <button
                onClick={() => {
                  marcarTodasLeidas().catch(() => {});
                  setItems(prev => prev.map(n => ({ ...n, leida: true })));
                  setNoLeidas(0);
                }}
                className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-700 transition"
              >
                <CheckCheck size={12} /> Marcar todo leído
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {cargando && (
              <div className="flex justify-center py-6">
                <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
            )}
            {!cargando && items.length === 0 && (
              <div className="py-8 text-center">
                <Bell size={20} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-zinc-600">Sin notificaciones</p>
              </div>
            )}
            {!cargando && items.map(item => (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className={`w-full text-left px-4 py-3 flex gap-3 transition hover:bg-gray-50
                  ${!item.leida ? "bg-amber-50/50" : ""}`}
              >
                {ICONO[item.tipo] ?? <Bell size={13} className="text-gray-600 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug truncate ${!item.leida ? "font-semibold text-zinc-800" : "text-zinc-700"}`}>
                    {item.titulo}
                  </p>
                  {item.cuerpo && (
                    <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{item.cuerpo}</p>
                  )}
                </div>
                <span className="text-[10px] text-zinc-700 shrink-0 mt-0.5">
                  {tiempoRelativo(item.creado_en)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
