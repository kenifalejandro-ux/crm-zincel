/** client/src/components/dashboard/ProspectosPorEstado.tsx */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { Users } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";


interface Props {
  metricas: Metricas;
}

const ESTADOS = [
  { key: "prospectos_interesados",     label: "Interesado",         tono: "accent" },
  { key: "prospectos_volver_llamar",   label: "Volver a llamar",    tono: "p1"     },
  { key: "prospectos_no_contesta",     label: "No contesta",        tono: "axis"   },
  { key: "prospectos_tiene_proveedor", label: "Ya tiene proveedor", tono: "danger" },
  { key: "prospectos_buzon",           label: "Buzón de voz",       tono: "axis"   },
  { key: "prospectos_no_interesados",  label: "No interesado",      tono: "danger" },
] as const;

export function ProspectosPorEstado({ metricas }: Props) {
  const c = useChartColors();
  const tono: Record<string, string> = { accent: c.accent, p1: c.palette[1], axis: c.axis, danger: c.danger };
  const total = metricas.prospectos.total_prospectos;

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Users size={14} className="mr-2.5 text-blue-500" strokeWidth={2} />
        Prospectos por Estado
      </h2>

      <div className="space-y-4">
        {ESTADOS.map((item, i) => {
          const valor = metricas.prospectos[item.key as keyof Metricas["prospectos"]] as number;
          const pct   = total > 0 ? Math.round((valor / total) * 100) : 0;

          return (
            <div key={i}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] font-medium text-zinc-300">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-zinc-100">{valor}</span>
                  <span className="text-[10px] text-zinc-400 font-medium w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: tono[item.tono] }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/8/60 flex justify-between items-center">
        <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">Total prospectos</span>
        <span className="text-[14px] font-bold text-zinc-100">{total}</span>
      </div>
    </div>
  );
}