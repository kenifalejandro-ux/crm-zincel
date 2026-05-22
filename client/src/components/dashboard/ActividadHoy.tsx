/** client/src/components/dashboard/ActividadHoy.tsx */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { Target } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";


interface Props {
  metricas: Metricas;
}

export function ActividadHoy({ metricas }: Props) {
  const items = [
    { label: "Llamadas realizadas",    valor: metricas.llamadas.llamadas_hoy },
    { label: "Brochures enviados",     valor: metricas.brochures.brochures_hoy },
    { label: "Reuniones programadas",  valor: metricas.reuniones.reuniones_hoy },
    { label: "Nuevos prospectos",      valor: metricas.prospectos.prospectos_hoy },
  ];

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Target size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Actividad de Hoy
      </h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center pb-3 border-b border-zinc-100/50 last:border-0 last:pb-0">
            <span className="text-[12px] font-medium text-zinc-500">{item.label}</span>
            <span className="text-[14px] font-semibold text-zinc-900">{item.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
