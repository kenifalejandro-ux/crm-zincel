/** client/src/components/inteligencia/AbandonoPipeline.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { XCircle } from "lucide-react";
import { getAbandonoPipeline, type AbandonoPipeline } from "../../services/inteligencia.api";

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta",
  negociacion:       "Negociación",
  perdido:           "Perdido",
  descartado:        "Descartado",
};

const ETAPA_COLOR: Record<string, string> = {
  nuevo:             COLORS.mutedLight,
  contactado:        COLORS.muted,
  interesado:        COLORS.primary,
  propuesta_enviada: COLORS.primary,
  negociacion:       COLORS.mutedDark,
  perdido:           COLORS.danger,
  descartado:        COLORS.muted,
};

const TooltipBar = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-2.5 text-xs">
      <p className="font-semibold text-zinc-800 truncate max-w-[200px]">{d.label ?? d.motivo}</p>
      <p className="text-zinc-600 mt-0.5">{d.total} ocurrencia{d.total !== 1 ? "s" : ""}</p>
    </div>
  );
};

type Capa = "primer_contacto" | "propuesta";

export function AbandonoPipelineChart() {
  const [data, setData] = useState<AbandonoPipeline | null>(null);
  const [capa, setCapa] = useState<Capa>("primer_contacto");

  useEffect(() => {
    getAbandonoPipeline().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const totalPerdidos   = data.por_etapa.reduce((s, e) => s + e.total, 0);
  const totalMotivos1   = data.por_motivo.reduce((s, m) => s + m.total, 0);
  const totalMotivos2   = data.motivos_propuesta?.reduce((s, m) => s + m.total, 0) ?? 0;

  const motivoData1 = data.por_motivo.map((m) => ({
    motivo: m.motivo.length > 22 ? m.motivo.slice(0, 22) + "…" : m.motivo,
    total:  m.total,
  }));

  const motivoData2 = (data.motivos_propuesta ?? []).map((m) => ({
    motivo: m.motivo.length > 22 ? m.motivo.slice(0, 22) + "…" : m.motivo,
    total:  m.total,
  }));

  const motivoActivo = capa === "primer_contacto" ? motivoData1 : motivoData2;
  const totalActivo  = capa === "primer_contacto" ? totalMotivos1 : totalMotivos2;

  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50">
            <XCircle size={14} className="text-red-500" />
          </div>
          <div>
            <h3 className={HEADER_CLASS}>Análisis de abandono del pipeline</h3>
            <p className="text-[11px] text-zinc-600">{totalPerdidos} leads perdidos/descartados · ¿dónde y por qué se pierden?</p>
          </div>
        </div>

        {/* Toggle capas */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCapa("primer_contacto")}
            className={`px-3 py-1 text-xs rounded-md transition ${
              capa === "primer_contacto"
                ? "bg-white shadow-sm text-zinc-800 font-medium"
                : "text-zinc-700 hover:text-zinc-700"
            }`}
          >
            📞 Primer contacto
          </button>
          <button
            onClick={() => setCapa("propuesta")}
            className={`px-3 py-1 text-xs rounded-md transition ${
              capa === "propuesta"
                ? "bg-white shadow-sm text-zinc-800 font-medium"
                : "text-zinc-700 hover:text-zinc-700"
            }`}
          >
            📄 Etapa propuesta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Abandono por etapa del pipeline */}
        <div>
          <p className="text-xs font-medium text-zinc-700 mb-2">Pérdidas por etapa del pipeline</p>
          <div className="space-y-2">
            {data.por_etapa.length === 0 ? (
              <p className="text-xs text-zinc-700 text-center py-4">Sin datos de pérdida</p>
            ) : (
              data.por_etapa.map((e) => {
                const pct   = totalPerdidos > 0 ? Math.round((e.total / totalPerdidos) * 100) : 0;
                const color = ETAPA_COLOR[e.etapa] ?? COLORS.muted;
                return (
                  <div key={e.etapa} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-700 w-20 shrink-0">
                      {ETAPA_LABEL[e.etapa] ?? e.etapa}
                    </span>
                    <div className="flex-1 bg-zinc-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 2)}%`, background: color }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-600 w-8 text-right">{e.total}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Motivos según capa seleccionada */}
        <div>
          <p className="text-xs font-medium text-zinc-700 mb-2">
            {capa === "primer_contacto"
              ? "Motivos — no interesado (llamadas)"
              : "Motivos — venta perdida (propuestas)"
            }
          </p>

          {capa === "primer_contacto" && (
            <p className="text-[10px] text-zinc-600 mb-2">
              ¿Por qué el cliente rechazó en el primer contacto?
            </p>
          )}
          {capa === "propuesta" && (
            <p className="text-[10px] text-zinc-600 mb-2">
              ¿Por qué se cayó la venta en etapa de propuesta/negociación?
            </p>
          )}

          {motivoActivo.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-zinc-600">Sin motivos registrados</p>
              {capa === "propuesta" && (
                <p className="text-[10px] text-zinc-700 mt-1">
                  Selecciona el motivo al marcar una propuesta como "Cerrada perdida" o "Vencida"
                </p>
              )}
              {capa === "primer_contacto" && (
                <p className="text-[10px] text-zinc-700 mt-1">
                  Selecciona el motivo al registrar una llamada con resultado "No interesado"
                </p>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(90, motivoActivo.length * 24)}>
              <BarChart
                data={motivoActivo}
                layout="vertical"
                margin={{ top: 0, right: 35, left: 0, bottom: 0 }}
                barSize={13}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: COLORS.muted }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="motivo"
                  tick={{ fontSize: 9, fill: "#52525b" }}
                  tickLine={false}
                  axisLine={false}
                  width={95}
                />
                <Tooltip content={<TooltipBar />} cursor={{ fill: COLORS.surface }} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {motivoActivo.map((_, i) => (
                    <Cell
                      key={i}
                      fill={capa === "primer_contacto"
                        ? `hsl(${220 + i * 15}, 70%, 65%)`
                        : `hsl(${0 + i * 18}, 70%, 65%)`
                      }
                    />
                  ))}
                  <LabelList dataKey="total" position="right" style={{ fontSize: 9, fill: "#52525b", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {motivoActivo.length > 0 && (
            <p className="text-[10px] text-zinc-600 mt-1 text-right">
              {totalActivo} registros con motivo
            </p>
          )}
        </div>
      </div>

      {/* Cruce etapa × motivo */}
      {data.cruce.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-700 mb-2">Cruce etapa × motivo (primer contacto)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1.5 text-zinc-600 font-medium">Etapa</th>
                  <th className="text-left py-1.5 text-zinc-600 font-medium">Motivo</th>
                  <th className="text-right py-1.5 pr-1 text-zinc-600 font-medium">Leads</th>
                </tr>
              </thead>
              <tbody>
                {data.cruce.slice(0, 8).map((c, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                        style={{ background: ETAPA_COLOR[c.etapa] ?? COLORS.muted }}
                      >
                        {ETAPA_LABEL[c.etapa] ?? c.etapa}
                      </span>
                    </td>
                    <td className="py-1.5 text-zinc-600 max-w-[180px] truncate">{c.motivo}</td>
                    <td className="py-1.5 pr-1 text-right font-semibold text-zinc-700">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
