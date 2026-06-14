/** client/src/components/dashboard/ReunionesChart.tsx */
import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { Video } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

const REUNIONES_ITEMS = [
  { label: "Reprogramadas", key: "reuniones_reprogramadas", tono: "axis"   },
  { label: "Canceladas",    key: "reuniones_canceladas",    tono: "danger" },
  { label: "Realizadas",    key: "reuniones_realizadas",    tono: "accent" },
  { label: "Programadas",   key: "reuniones_programadas",   tono: "p3"     },
] as const;

const TooltipReuniones = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={`${TOOLTIP_BASE} px-3 py-1.5 text-xs`}>
      <p className="font-semibold text-zinc-200">{d.name}</p>
      <p className="text-zinc-400">{d.value} reunión{d.value !== 1 ? "es" : ""}</p>
    </div>
  );
};

interface Props {
  metricas: Metricas;
}

export function ReunionesChart({ metricas }: Props) {
  const c = useChartColors();
  const tono: Record<string, string> = { axis: c.axis, danger: c.danger, accent: c.accent, p3: c.palette[3] };
  const total = metricas.reuniones.total_reuniones;

  const data = REUNIONES_ITEMS.map(item => ({
    name:  item.label,
    value: (metricas.reuniones as any)[item.key] as number,
    fill:  tono[item.tono],
  }));

  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Video size={14} className="mr-2.5 text-purple-500" strokeWidth={2} />
        Reuniones
      </h2>

      <div className="flex items-center gap-4">
        {/* RadialBarChart — 4 anillos concéntricos */}
        <div className="shrink-0" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius={18}
              outerRadius={62}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, maxVal]} angleAxisId={0} tick={false} />
              <RadialBar filter="url(#neon-glow)"
                background={{ fill: c.grid }}
                dataKey="value"
                cornerRadius={4}
              />
              <Tooltip content={<TooltipReuniones />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda + conteos */}
        <div className="flex-1 space-y-3">
          <div className="text-center mb-2">
            <p className="text-2xl font-bold text-zinc-100 leading-none">{total}</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">total</p>
          </div>
          {[...REUNIONES_ITEMS].reverse().map((item, i) => {
            const valor = (metricas.reuniones as any)[item.key] as number;
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tono[item.tono] }} />
                  <span className="text-[12px] font-medium text-zinc-300">{item.label}</span>
                </div>
                <span className="text-[13px] font-semibold text-zinc-100">{valor}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
