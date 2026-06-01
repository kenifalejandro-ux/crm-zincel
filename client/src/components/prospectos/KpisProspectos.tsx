/** client/src/components/prospectos/KpisProspectos.tsx */

import { Users } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import type { ResumenProspectos } from "../../services/prospectos.api";

interface CardDef {
  key:    string;
  label:  string;
  color:  string;
  bg:     string;
  dot:    string;
}

const CARDS_ESTADOS: CardDef[] = [
  { key: "",               label: "Total leads",     color: "text-zinc-800",  bg: "bg-zinc-50 border-zinc-200",    dot: "bg-zinc-400"   },
  { key: "nuevo",          label: "Nueva carga",     color: "text-blue-700",  bg: "bg-blue-50 border-blue-200",    dot: "bg-blue-500"   },
  { key: "por_gestionar",  label: "Por gestionar",   color: "text-slate-700", bg: "bg-slate-50 border-slate-200",  dot: "bg-slate-400"  },
  { key: "interesado",     label: "Interesados",     color: "text-green-700", bg: "bg-green-50 border-green-200",  dot: "bg-green-500"  },
  { key: "volver_a_llamar",   label: "Volver a llamar",      color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200",  dot: "bg-yellow-500" },
  { key: "ocupado_en_reunion",label: "Ocupado / En reunión", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200",  dot: "bg-yellow-400" },
  { key: "prometio_llamar",   label: "Prometió llamar",      color: "text-purple-700", bg: "bg-purple-50 border-purple-200",  dot: "bg-purple-400" },
  { key: "no_interesado",     label: "No interesado",        color: "text-red-700",    bg: "bg-red-50 border-red-200",        dot: "bg-red-400"    },
  { key: "no_contesta",    label: "No contesta",     color: "text-gray-600",  bg: "bg-gray-50 border-gray-200",    dot: "bg-gray-400"   },
  { key: "ya_tiene_proveedor",   label: "Tiene proveedor",      color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200",  dot: "bg-indigo-500"  },
  { key: "solicita_informacion", label: "Solicita información",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",      dot: "bg-blue-500"    },
  { key: "buzon_de_voz",         label: "Buzón de voz",          color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",      dot: "bg-gray-400"    },
  { key: "fuera_de_servicio",    label: "Fuera de servicio",     color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",      dot: "bg-gray-400"    },
  { key: "numero_equivocado",    label: "Número equivocado",     color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200",  dot: "bg-yellow-500"  },
  { key: "baja_de_oficio",       label: "Baja de oficio",        color: "text-slate-700",  bg: "bg-slate-50 border-slate-200",    dot: "bg-slate-400"   },
  { key: "suspension_temporal",  label: "Suspensión temporal",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",    dot: "bg-amber-400"   },
  { key: "no_habido",            label: "No habido",             color: "text-slate-600",  bg: "bg-slate-50 border-slate-200",    dot: "bg-slate-300"   },
  { key: "perdida",              label: "Venta perdida",         color: "text-red-700",    bg: "bg-red-50 border-red-200",        dot: "bg-red-500"     },
];

function getEstadoValue(resumen: ResumenProspectos, key: string): number {
  if (key === "") return resumen.total;
  return (resumen as any)[key] ?? 0;
}

interface Props {
  resumen:      ResumenProspectos;
  filtroActivo: string;
  onFiltro:     (key: string) => void;
}

function Card({ card, valor, activo, onClick }: { card: CardDef; valor: number; activo: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`${CARD_CLASS} !px-3 !py-2.5 flex flex-col items-start gap-1.5 text-left transition-all ${activo ? 'ring-2 ring-offset-1 ring-zinc-400 shadow-sm' : 'hover:shadow-sm hover:scale-[1.01]'}`}
    >
      <div className="flex items-center gap-1.5 w-full">
        <span className={`w-2 h-2 rounded-full shrink-0 ${card.dot}`} />
        <span className={`text-[11px] font-medium truncate ${card.color}`}>{card.label}</span>
      </div>
      <span className={`text-xl font-bold leading-none ${card.color}`}>
        {valor.toLocaleString("es-PE")}
      </span>
    </button>
  );
}

// ─── Grupos resumen ──────────────────────────────────────────────────────────

const GRUPOS = [
  {
    label:     "Contactados",
    colorHead: "text-green-700",
    bgHead:    "bg-green-50 border-green-200",
    dot:       "bg-green-500",
    items: [
      { key: "solicita_informacion", label: "Solicita información", dot: "bg-blue-400"   },
      { key: "interesado",           label: "Interesados",          dot: "bg-green-500"  },
      { key: "volver_a_llamar",      label: "Volver a llamar",      dot: "bg-yellow-500" },
      { key: "ocupado_en_reunion",   label: "Ocupado / En reunión", dot: "bg-yellow-400" },
      { key: "prometio_llamar",      label: "Prometió llamar",      dot: "bg-purple-400" },
      { key: "no_interesado",        label: "No interesado",        dot: "bg-red-400"    },
      { key: "ya_tiene_proveedor",   label: "Tiene proveedor",      dot: "bg-indigo-500" },
      { key: "perdida",              label: "Venta perdida",        dot: "bg-red-600"    },
    ],
  },
  {
    label:     "No contactados",
    colorHead: "text-gray-600",
    bgHead:    "bg-gray-50 border-gray-200",
    dot:       "bg-gray-400",
    items: [
      { key: "buzon_de_voz",      label: "Buzón de voz",      dot: "bg-gray-400"    },
      { key: "fuera_de_servicio", label: "Fuera de servicio", dot: "bg-slate-400"   },
      { key: "numero_equivocado", label: "Número equivocado", dot: "bg-yellow-500"  },
      { key: "no_contesta",       label: "No contesta",       dot: "bg-gray-500"    },
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

function GrupoCard({ grupo, resumen, onFiltro, filtroActivo }: {
  grupo:       typeof GRUPOS[0];
  resumen:     ResumenProspectos;
  onFiltro:    (key: string) => void;
  filtroActivo: string;
}) {
  const total = grupo.items.reduce((s, i) => s + ((resumen as any)[i.key] ?? 0), 0);
  return (
    <div className={`rounded-2xl border p-4 ${grupo.bgHead}`}>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${grupo.dot}`} />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${grupo.colorHead}`}>{grupo.label}</span>
        </div>
        <span className={`text-2xl font-bold leading-none ${grupo.colorHead}`}>{total}</span>
      </div>
      {/* Desglose */}
      <div className="space-y-1.5">
        {grupo.items.map(item => {
          const val    = (resumen as any)[item.key] ?? 0;
          const activo = filtroActivo === item.key;
          if (val === 0) return null;
          return (
            <button
              key={item.key}
              onClick={() => onFiltro(item.key)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-left transition-all ${
                activo ? "bg-white/80 ring-1 ring-zinc-400" : "hover:bg-white/60"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
                <span className="text-[11px] text-zinc-600 truncate">{item.label}</span>
              </div>
              <span className="text-[11px] font-bold text-zinc-800 shrink-0 ml-2">{val}</span>
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
        <p className={HEADER_CLASS}><Users size={12} className="mr-1.5 text-blue-500" />Estado de leads</p>
        {/* Total leads */}
        <button
          onClick={() => onFiltro("")}
          className={`text-sm font-bold text-zinc-800 px-3 py-1 rounded-xl border transition-all ${
            filtroActivo === "" ? "border-zinc-400 bg-zinc-100" : "border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          {resumen.total.toLocaleString("es-PE")} leads en total
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {GRUPOS.map(g => (
          <GrupoCard
            key={g.label}
            grupo={g}
            resumen={resumen}
            onFiltro={onFiltro}
            filtroActivo={filtroActivo}
          />
        ))}
      </div>
    </div>
  );
}
