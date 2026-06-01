/** client/src/components/dashboard/DashboardEstadoLeads.tsx */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { getResumenProspectos, type ResumenProspectos } from "../../services/prospectos.api";

// ── Grupos de estados ─────────────────────────────────────────────────────────

const GRUPOS = [
  {
    label:     "Contactados",
    colorHead: "text-green-700",
    bgHead:    "bg-green-50 border-green-200",
    dot:       "bg-green-500",
    items: [
      { key: "solicita_informacion", label: "Solicita información", dot: "bg-blue-400"    },
      { key: "interesado",           label: "Interesados",          dot: "bg-green-500"   },
      { key: "volver_a_llamar",      label: "Volver a llamar",      dot: "bg-yellow-500"  },
      { key: "ocupado_en_reunion",   label: "Ocupado / En reunión", dot: "bg-yellow-400"  },
      { key: "prometio_llamar",      label: "Prometió llamar",      dot: "bg-purple-400"  },
      { key: "no_interesado",        label: "No interesado",        dot: "bg-red-400"     },
      { key: "ya_tiene_proveedor",   label: "Tiene proveedor",      dot: "bg-indigo-500"  },
      { key: "perdida",              label: "Venta perdida",        dot: "bg-red-600"     },
    ],
  },
  {
    label:     "No contactados",
    colorHead: "text-gray-600",
    bgHead:    "bg-gray-50 border-gray-200",
    dot:       "bg-gray-400",
    items: [
      { key: "buzon_de_voz",      label: "Buzón de voz",      dot: "bg-gray-400"   },
      { key: "fuera_de_servicio", label: "Fuera de servicio", dot: "bg-slate-400"  },
      { key: "numero_equivocado", label: "Número equivocado", dot: "bg-yellow-500" },
      { key: "no_contesta",       label: "No contesta",       dot: "bg-gray-500"   },
    ],
  },
  {
    label:     "Por gestionar",
    colorHead: "text-slate-700",
    bgHead:    "bg-slate-50 border-slate-200",
    dot:       "bg-slate-400",
    items: [
      { key: "por_gestionar", label: "Por gestionar", dot: "bg-slate-400" },
    ],
  },
  {
    label:     "Inactivos",
    colorHead: "text-slate-500",
    bgHead:    "bg-slate-50 border-slate-300",
    dot:       "bg-slate-300",
    items: [
      { key: "baja_de_oficio",      label: "Baja de oficio",      dot: "bg-slate-400" },
      { key: "suspension_temporal", label: "Suspensión temporal", dot: "bg-amber-400" },
      { key: "no_habido",           label: "No habido",           dot: "bg-slate-300" },
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  fechaDesde?: string; // YYYY-MM-DD
  fechaHasta?: string; // YYYY-MM-DD — cierra el rango del período
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DashboardEstadoLeads({ fechaDesde, fechaHasta }: Props) {
  const navigate = useNavigate();
  const [resumen, setResumen]   = useState<ResumenProspectos | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getResumenProspectos(fechaDesde, fechaHasta)
      .then(setResumen)
      .finally(() => setCargando(false));
  }, [fechaDesde, fechaHasta]);

  const ir = (estado: string) =>
    navigate("/prospectos", { state: { filtroEstado: estado } });

  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <p className={HEADER_CLASS}>
          <Users size={12} className="mr-1.5 text-blue-500" />
          Estado de leads
        </p>
        {fechaDesde && (
          <span className="text-[10px] text-zinc-400">
            Leads con llamada desde {fechaDesde} — estado actual
          </span>
        )}
      </div>

      {cargando || !resumen ? (
        <div className="h-32 flex items-center justify-center text-zinc-400 text-xs">Cargando...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GRUPOS.map(grupo => {
            const total = grupo.items.reduce((s, i) => s + ((resumen as any)[i.key] ?? 0), 0);
            return (
              <div key={grupo.label} className={`rounded-2xl border p-3 ${grupo.bgHead}`}>
                {/* Cabecera grupo */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${grupo.dot}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${grupo.colorHead}`}>
                      {grupo.label}
                    </span>
                  </div>
                  <span className={`text-xl font-bold leading-none ${grupo.colorHead}`}>{total}</span>
                </div>

                {/* Desglose */}
                <div className="space-y-1">
                  {grupo.items.map(item => {
                    const val = (resumen as any)[item.key] ?? 0;
                    if (val === 0) return null;
                    return (
                      <button
                        key={item.key}
                        onClick={() => ir(item.key)}
                        className="w-full flex items-center justify-between px-1.5 py-0.5 rounded-lg text-left hover:bg-white/60 transition-all"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
                          <span className="text-[10px] text-zinc-600 truncate">{item.label}</span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-800 shrink-0 ml-1">{val}</span>
                      </button>
                    );
                  })}
                  {grupo.items.every(i => ((resumen as any)[i.key] ?? 0) === 0) && (
                    <p className="text-[10px] text-zinc-400 px-1.5">Sin registros</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-zinc-100 space-y-1.5">
        {resumen && (() => {
          const contactados    = GRUPOS[0].items.reduce((s, i) => s + ((resumen as any)[i.key] ?? 0), 0);
          const noContactados  = GRUPOS[1].items.reduce((s, i) => s + ((resumen as any)[i.key] ?? 0), 0);
          const sumaCuadre     = contactados + noContactados;
          return (
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-400">
                Contactados <span className="font-semibold text-green-600">{contactados}</span>
                {" + "}No contactados <span className="font-semibold text-gray-500">{noContactados}</span>
                {" = "}
                <span className="font-bold text-zinc-700">{sumaCuadre}</span>
              </span>
            </div>
          );
        })()}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {fechaDesde ? "Prospectos en el período" : "Total prospectos"}
          </span>
          <span className="text-sm font-bold text-zinc-800">{resumen?.total ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}
