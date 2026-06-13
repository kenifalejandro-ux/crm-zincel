/** client/src/components/prospectos/KpisProspectos.tsx — REDISEÑO NEON
 * Cambios: cabeceras de grupo a texto claro (antes text-green-700/text-gray-600 — invisibles
 * sobre dark), filas activas/hover válidas (antes hover:bg-white/8/5 y bg-white/8 — clases
 * inválidas que no aplicaban), número del grupo en display. Lógica/props/keys intactos.
 */
import { Users } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS, PANEL_BASE } from "../../lib/tokens";
import type { ResumenProspectos } from "../../services/prospectos.api";

const GRUPOS = [
  {
    label: "Contactados", colorHead: "text-emerald-300", dot: "bg-emerald-400",
    items: [
      { key: "solicita_informacion", label: "Solicita información", dot: "bg-sky-400"    },
      { key: "interesado",           label: "Interesados",          dot: "bg-cyan-400"   },
      { key: "volver_a_llamar",      label: "Volver a llamar",      dot: "bg-amber-400"  },
      { key: "ocupado_en_reunion",   label: "Ocupado / En reunión", dot: "bg-amber-300"  },
      { key: "prometio_llamar",      label: "Prometió llamar",      dot: "bg-violet-400" },
      { key: "no_interesado",        label: "No interesado",        dot: "bg-red-400"    },
      { key: "ya_tiene_proveedor",   label: "Tiene proveedor",      dot: "bg-indigo-400" },
      { key: "perdida",              label: "Venta perdida",        dot: "bg-red-500"    },
      { key: "venta_ganada",         label: "Venta ganada",         dot: "bg-emerald-400" },
    ],
  },
  {
    label: "No contactados", colorHead: "text-zinc-300", dot: "bg-zinc-400",
    items: [
      { key: "buzon_de_voz",      label: "Buzón de voz",      dot: "bg-orange-400" },
      { key: "fuera_de_servicio", label: "Fuera de servicio", dot: "bg-slate-400"  },
      { key: "numero_equivocado", label: "Número equivocado", dot: "bg-pink-400"   },
      { key: "no_contesta",       label: "No contesta",       dot: "bg-zinc-500"   },
    ],
  },
  {
    label: "Por gestionar", colorHead: "text-sky-300", dot: "bg-sky-400",
    items: [
      { key: "por_gestionar", label: "Por gestionar", dot: "bg-sky-400" },
    ],
  },
  {
    label: "Inactivos", colorHead: "text-slate-300", dot: "bg-slate-400",
    items: [
      { key: "baja_de_oficio",      label: "Baja de oficio",      dot: "bg-slate-400" },
      { key: "suspension_temporal", label: "Suspensión temporal", dot: "bg-amber-400" },
      { key: "no_habido",           label: "No habido",           dot: "bg-slate-500" },
    ],
  },
];

interface Props {
  resumen:      ResumenProspectos;
  filtroActivo: string;
  onFiltro:     (key: string) => void;
}

function GrupoCard({ grupo, resumen, onFiltro, filtroActivo }: {
  grupo: typeof GRUPOS[0];
  resumen: ResumenProspectos;
  onFiltro: (key: string) => void;
  filtroActivo: string;
}) {
  const total = grupo.items.reduce((s, i) => s + ((resumen as any)[i.key] ?? 0), 0);
  return (
    <div className={`${PANEL_BASE} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${grupo.dot}`} style={{ boxShadow: "0 0 6px currentColor" }} />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${grupo.colorHead}`}>{grupo.label}</span>
        </div>
        <span className={`font-display text-2xl font-bold leading-none tabular-nums ${grupo.colorHead}`}>{total}</span>
      </div>
      <div className="space-y-1.5">
        {grupo.items.map(item => {
          const val = (resumen as any)[item.key] ?? 0;
          const activo = filtroActivo === item.key;
          if (val === 0) return null;
          return (
            <button
              key={item.key}
              onClick={() => onFiltro(item.key)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-left transition-all ${
                activo ? "bg-accent-10 border border-accent-30" : "border border-transparent hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
                <span className={`text-[11px] truncate ${activo ? "text-accent" : "text-zinc-400"}`}>{item.label}</span>
              </div>
              <span className="text-[11px] font-bold text-zinc-200 shrink-0 ml-2 tabular-nums">{val}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function KpisProspectos({ resumen, filtroActivo, onFiltro }: Props) {
  return (
    <div className={`${CARD_CLASS} space-y-3`}>
      <div className="flex items-center justify-between">
        <p className={HEADER_CLASS}><Users size={12} className="mr-1.5 text-accent" />Estado de leads</p>
        <button
          onClick={() => onFiltro("")}
          className={`text-sm font-bold px-3 py-1 rounded-xl border transition-all ${
            filtroActivo === "" ? "border-accent-30 bg-accent-10 text-accent" : "border-white/10 text-zinc-200 hover:bg-white/[0.05]"
          }`}
        >
          {resumen.total.toLocaleString("es-PE")} leads en total
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {GRUPOS.map(g => (
          <GrupoCard key={g.label} grupo={g} resumen={resumen} onFiltro={onFiltro} filtroActivo={filtroActivo} />
        ))}
      </div>
    </div>
  );
}
