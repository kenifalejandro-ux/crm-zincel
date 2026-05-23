/** client/src/components/prospectos/KpisProspectos.tsx */

import { Phone, Users } from "lucide-react";
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
  { key: "volver_a_llamar",label: "Volver a llamar", color: "text-yellow-700",bg: "bg-yellow-50 border-yellow-200",dot: "bg-yellow-500" },
  { key: "no_interesado",  label: "No interesado",   color: "text-red-700",   bg: "bg-red-50 border-red-200",      dot: "bg-red-400"    },
  { key: "no_contesta",    label: "No contesta",     color: "text-gray-600",  bg: "bg-gray-50 border-gray-200",    dot: "bg-gray-400"   },
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

export function KpisProspectos({ resumen, filtroActivo, onFiltro }: Props) {
  return (
    <div className={`${CARD_CLASS} space-y-2`}>

      {/* ── Estados de leads ── */}
      <p className={HEADER_CLASS}><Users size={12} className="mr-1.5 text-blue-500" />Estado de leads</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {CARDS_ESTADOS.map(card => (
          <Card
            key={card.key}
            card={card}
            valor={getEstadoValue(resumen, card.key)}
            activo={filtroActivo === card.key}
            onClick={() => onFiltro(card.key)}
          />
        ))}
      </div>

      {/* ── Actividad de llamadas (igual al dashboard) ── */}
      <p className={HEADER_CLASS}><Phone size={12} className="mr-1.5 text-green-500" />Actividad de llamadas</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total llamadas",    valor: resumen.total_llamadas,          dot: "bg-zinc-400",   color: "text-zinc-800",  bg: "bg-zinc-50 border-zinc-200"    },
          { label: "Contestadas",       valor: resumen.llamadas_contestadas,     dot: "bg-teal-500",   color: "text-teal-700",  bg: "bg-teal-50 border-teal-200"    },
          { label: "No contestadas",    valor: resumen.llamadas_no_contestadas,  dot: "bg-gray-400",   color: "text-gray-600",  bg: "bg-gray-50 border-gray-200"    },
        ].map(({ label, valor, dot, color, bg }) => (
          <div key={label} className={`${CARD_CLASS} !px-3 !py-2.5 flex flex-col items-start gap-1.5`}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className={`text-[11px] font-medium ${color}`}>{label}</span>
            </div>
            <span className={`text-xl font-bold leading-none ${color}`}>
              {valor.toLocaleString("es-PE")}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
