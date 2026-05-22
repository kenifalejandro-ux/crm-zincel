/** client/src/components/dashboard/ProspectosPorCiudad.tsx */
import { COLORS } from "../../lib/tokens";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { MapPin } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";


interface Props {
  metricas: Metricas;
}

const COLORES_CIUDAD = [
  "#27272a", "#3f3f46", COLORS.primary, "#d1b377",
  "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"
];

export function ProspectosPorCiudad({ metricas }: Props) {
  const datos = metricas.prospectos_por_ciudad ?? [];
  const total = datos.reduce((acc, d) => acc + d.total, 0);

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <MapPin size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Prospectos por Ciudad
      </h2>

      {datos.length === 0 ? (
        <p className="text-[12px] text-zinc-400 text-center py-6 font-medium">Sin datos</p>
      ) : (
        <div className="space-y-4">
          {datos.slice(0, 8).map((item, i) => {
            const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[12px] font-medium text-zinc-500 capitalize">{item.ciudad}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-zinc-900">{item.total}</span>
                    <span className="text-[10px] text-zinc-400 font-medium w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: COLORES_CIUDAD[i % COLORES_CIUDAD.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-zinc-100/60 flex justify-between items-center">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total</span>
        <span className="text-[14px] font-bold text-zinc-900">{total}</span>
      </div>
    </div>
  );
}