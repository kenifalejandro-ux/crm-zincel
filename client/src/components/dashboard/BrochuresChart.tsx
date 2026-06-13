/** client/src/components/dashboard/BrochuresChart.tsx */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { NeonDonut } from "../ui/NeonDonut";
import { Send } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function BrochuresChart({ metricas }: Props) {
  const c = useChartColors();
  const datos = (metricas.brochures_por_canal ?? []).map((item, i) => ({
    name:  item.canal,
    value: item.cantidad,
    color: c.palette[i % c.palette.length],
  }));

  const datosGrafico = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: c.grid }];

  const total = metricas.brochures.total_brochures;

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Send size={14} className="mr-2.5 text-sky-500" strokeWidth={2} />
        Brochures por Canal
      </h2>

      <div className="flex items-center gap-6">
        <NeonDonut
          data={datosGrafico.map((d) => ({ label: d.name, value: d.value, color: d.color }))}
          size={120}
          centerValue={total}
          centerLabel="total"
        />

        <div className="flex-1 space-y-3">
          {datos.length === 0 ? (
            <p className="text-[12px] text-zinc-400">Sin registros</p>
          ) : (
            datos.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[12px] font-medium text-zinc-300 capitalize">{item.name}</span>
                </div>
                <span className="text-[13px] font-semibold text-zinc-100">{item.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}