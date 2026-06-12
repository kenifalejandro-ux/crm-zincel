/** src/components/metricas/CicloVentaTab.tsx */

import { useEffect, useState } from "react";
import api from "@/services/api";
import { TrendingUp, Clock, Calendar } from "lucide-react";

interface CicloDato {
  metrica_id:           string;
  campana_nombre:       string;
  periodo_inicio:       string;
  periodo_fin:          string;
  proyectos:            string[];
  gasto:                number;
  resultado_id:         string;
  fecha_venta:          string;
  monto:                number;
  proyecto_venta:       string;
  confianza_atribucion: "confirmada" | "probable" | "sin_datos";
  dias_ciclo:           number;
}

interface Campana {
  id:             string;
  campana_nombre: string;
  periodo_inicio: string;
  periodo_fin:    string;
  proyectos:      string[];
  gasto:          number;
}

interface Venta {
  id:          string;
  fecha_venta: string;
  monto:       number;
  proyecto:    string;
}

const PROY_COLOR: Record<string, { bar: string; chip: string; dot: string }> = {
  "Alborada":      { bar: "bg-violet-400",  chip: "bg-violet-100 text-violet-700 border-violet-200",  dot: "bg-violet-500"  },
  "Terrenos Villa":{ bar: "bg-emerald-400", chip: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "San Fernando":  { bar: "bg-sky-400",     chip: "bg-sky-100 text-sky-700 border-sky-200",            dot: "bg-sky-500"     },
};
const defaultColor = { bar: "bg-zinc-300", chip: "bg-zinc-100 text-zinc-500 border-zinc-200", dot: "bg-zinc-400" };

const fmtFecha = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "2-digit" });
const fmtMonto = (n: number) => n >= 1000 ? `S/ ${(n / 1000).toFixed(0)}k` : `S/ ${Number(n).toLocaleString("es-PE")}`;
const toMs     = (d: string) => new Date(d + "T12:00:00").getTime();

interface Props { empresa?: string }

export function CicloVentaTab({ empresa }: Props) {
  const [ciclos,   setCiclos]   = useState<CicloDato[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [ventas,   setVentas]   = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.get("/metricas/ciclo", { params: empresa ? { empresa } : {} })
      .then(r => {
        setCiclos(r.data.data.ciclos   ?? []);
        setCampanas(r.data.data.campanas ?? []);
        setVentas(r.data.data.ventas   ?? []);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [empresa]);

  if (cargando) return <div className="py-16 text-center text-zinc-400 text-sm">Cargando...</div>;

  if (campanas.length === 0) return (
    <div className="py-16 text-center text-zinc-400 text-sm">
      Sin campañas registradas para mostrar el ciclo de venta
    </div>
  );

  // ── Cálculos para el Gantt ────────────────────────────────────────────────
  const todasFechas = [
    ...campanas.map(c => toMs(c.periodo_inicio)),
    ...campanas.map(c => toMs(c.periodo_fin)),
    ...ventas.map(v => toMs(v.fecha_venta)),
  ];
  const minMs = Math.min(...todasFechas);
  const maxMs = Math.max(...todasFechas);
  const rangoMs = maxMs - minMs;
  const pct = (fecha: string) => ((toMs(fecha) - minMs) / rangoMs) * 100;
  const ancho = (ini: string, fin: string) => Math.max(((toMs(fin) - toMs(ini)) / rangoMs) * 100, 0.5);

  // ── Agrupar ciclos por venta ──────────────────────────────────────────────
  const ventasConCiclo = ventas.map(v => ({
    ...v,
    campanas: ciclos.filter(c => c.resultado_id === v.id),
  }));

  const promedioDias = ciclos.length
    ? Math.round(ciclos.reduce((s, c) => s + Number(c.dias_ciclo), 0) / ciclos.length)
    : null;

  // ── Etiquetas del eje X ───────────────────────────────────────────────────
  const meses: { label: string; pct: number }[] = [];
  const d = new Date(minMs);
  d.setDate(1);
  while (d.getTime() <= maxMs) {
    meses.push({
      label: d.toLocaleDateString("es-PE", { month: "short", year: "2-digit" }),
      pct:   ((d.getTime() - minMs) / rangoMs) * 100,
    });
    d.setMonth(d.getMonth() + 2);
  }

  return (
    <div className="space-y-6">

      {/* KPIs resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-2.5 bg-amber-50 rounded-xl"><Clock size={18} className="text-amber-500" /></div>
          <div>
            <p className="text-xs text-zinc-500">Ciclo promedio</p>
            <p className="text-xl font-bold text-zinc-900">{promedioDias ? `${promedioDias} días` : "—"}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-2.5 bg-green-50 rounded-xl"><TrendingUp size={18} className="text-green-500" /></div>
          <div>
            <p className="text-xs text-zinc-500">Ventas registradas</p>
            <p className="text-xl font-bold text-zinc-900">{ventas.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-2.5 bg-violet-50 rounded-xl"><Calendar size={18} className="text-violet-500" /></div>
          <div>
            <p className="text-xs text-zinc-500">Campañas en historial</p>
            <p className="text-xl font-bold text-zinc-900">{campanas.length}</p>
          </div>
        </div>
      </div>

      {/* Timeline Gantt */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-zinc-700 mb-1">Línea de tiempo: campañas y ventas</h3>
        <p className="text-xs text-zinc-400 mb-5">Barras = duración de campaña · Diamantes = fecha de cierre de venta</p>

        <div className="relative">
          {/* Eje X — meses */}
          <div className="relative h-5 mb-3 border-b border-zinc-100">
            {meses.map((m) => (
              <span
                key={m.label}
                className="absolute text-[10px] text-zinc-400 -translate-x-1/2"
                style={{ left: `${m.pct}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Filas de campaña */}
          <div className="space-y-2">
            {campanas.map((c) => {
              const proyecto = c.proyectos?.[0] ?? "";
              const s = PROY_COLOR[proyecto] ?? defaultColor;
              const multi = (c.proyectos ?? []).length > 1;
              return (
                <div key={c.id} className="relative h-7 flex items-center">
                  {/* Línea de fondo */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-zinc-50" />
                  </div>
                  {/* Barra de campaña */}
                  <div
                    className={`absolute h-5 rounded-full ${s.bar} ${multi ? "opacity-50" : "opacity-90"} flex items-center px-2 overflow-hidden whitespace-nowrap`}
                    style={{ left: `${pct(c.periodo_inicio)}%`, width: `${ancho(c.periodo_inicio, c.periodo_fin)}%`, minWidth: "4px" }}
                    title={`${c.campana_nombre}\n${fmtFecha(c.periodo_inicio)} → ${fmtFecha(c.periodo_fin)}\nS/ ${Number(c.gasto).toLocaleString("es-PE")}`}
                  >
                    <span className="text-[10px] text-white font-medium truncate">{c.campana_nombre}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Marcadores de ventas */}
          {ventas.map((v) => {
            const proyNorm = v.proyecto?.includes("Alborada") ? "Alborada"
              : v.proyecto?.includes("Villa") ? "Terrenos Villa"
              : v.proyecto?.includes("Fernando") ? "San Fernando"
              : "";
            const s = PROY_COLOR[proyNorm] ?? defaultColor;
            const x = pct(v.fecha_venta);
            return (
              <div
                key={v.id}
                className="absolute top-5 bottom-0 flex flex-col items-center"
                style={{ left: `${x}%` }}
                title={`Venta ${fmtMonto(Number(v.monto))}\n${v.proyecto}\n${fmtFecha(v.fecha_venta)}`}
              >
                <div className="flex-1" style={{ borderLeft: "2px dashed #4ade80", opacity: 0.6 }} />
                <div className={`w-3 h-3 rotate-45 ${s.dot} border-2 border-white shadow-sm`} />
                <span className="text-[9px] text-green-600 font-semibold mt-0.5 -rotate-45 origin-top-left whitespace-nowrap">
                  {fmtMonto(Number(v.monto))}
                </span>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 mt-8 pt-4 border-t border-zinc-50">
          {Object.entries(PROY_COLOR).map(([p, s]) => (
            <div key={p} className="flex items-center gap-1.5">
              <div className={`w-3 h-2 rounded-full ${s.bar}`} />
              <span className="text-[11px] text-zinc-500">{p}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-2.5 h-2.5 rotate-45 bg-green-400 border border-white" />
            <span className="text-[11px] text-zinc-500">Cierre de venta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-full bg-zinc-300 opacity-50" />
            <span className="text-[11px] text-zinc-500">Multi-proyecto</span>
          </div>
        </div>
      </div>

      {/* Tabla de ciclo por venta */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-50">
          <h3 className="text-sm font-semibold text-zinc-700">Ciclo por venta</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Tiempo desde inicio de campaña hasta cierre</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {ventasConCiclo.map((v) => {
            const proyNorm = v.proyecto?.includes("Alborada") ? "Alborada"
              : v.proyecto?.includes("Villa") ? "Terrenos Villa"
              : v.proyecto?.includes("Fernando") ? "San Fernando" : "";
            const s = PROY_COLOR[proyNorm] ?? defaultColor;
            return (
              <div key={v.id} className="p-5">
                {/* Cabecera de venta */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    <span className="font-semibold text-zinc-800">{fmtMonto(Number(v.monto))}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${s.chip}`}>{v.proyecto}</span>
                  </div>
                  <span className="text-xs text-zinc-500">Cierre: {fmtFecha(v.fecha_venta)}</span>
                </div>

                {/* Campañas atribuidas */}
                {v.campanas.length > 0 ? (
                  <div className="space-y-2 pl-5">
                    {v.campanas.map((c) => {
                      const dias = Number(c.dias_ciclo);
                      const maxDias = Math.max(...ciclos.map(x => Number(x.dias_ciclo)), 1);
                      const conf = c.confianza_atribucion;
                      const confCls = conf === "confirmada"
                        ? "bg-green-100 text-green-700"
                        : conf === "probable"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-zinc-100 text-zinc-500";
                      const proy0 = c.proyectos?.[0] ?? "";
                      const sc = PROY_COLOR[proy0] ?? defaultColor;
                      return (
                        <div key={c.metrica_id} className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${sc.bar} mt-0.5 shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-zinc-700 truncate">{c.campana_nombre}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${confCls}`}>{conf}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${sc.bar} rounded-full`}
                                  style={{ width: `${(dias / maxDias) * 100}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-zinc-600 shrink-0">{dias} días</span>
                              <span className="text-[10px] text-zinc-400 shrink-0">
                                ({fmtFecha(c.periodo_inicio)} → cierre)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 pl-5 italic">Sin campaña atribuida</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
