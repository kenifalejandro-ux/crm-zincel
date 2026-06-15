/** client/src/components/inteligencia/InsightServicios.tsx */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Trophy, AlertTriangle, Lightbulb, CheckCircle2, Zap,
} from "lucide-react";
import { CARD_CLASS, BADGE_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { getAnalisisPipeline } from "../../services/propuestas.api";
import type { ServicioAnalisis } from "../../services/propuestas.api";
import { LABEL_SERVICIO } from "../../types/propuesta.types";
import type { ServicioPropuesta } from "../../types/propuesta.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return n > 0 ? `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "—";
}

function convRate(ganadas: number, perdidas: number): number | null {
  return (ganadas + perdidas) > 0 ? Math.round(ganadas / (ganadas + perdidas) * 100) : null;
}

function lbl(s: string) {
  return LABEL_SERVICIO[s as ServicioPropuesta] ?? s;
}

// ─── Generador de insights ────────────────────────────────────────────────────

interface Insight {
  tipo: "estrella" | "ok" | "alerta" | "oportunidad";
  titulo: string;
  texto: string;
}

function generarInsights(rows: ServicioAnalisis[]): Insight[] {
  if (rows.length === 0) return [];
  const out: Insight[] = [];

  const conResueltas = rows.filter(r => (r.ganadas + r.perdidas) > 0);
  const conIngresos  = rows.filter(r => r.monto_ganado > 0);
  const conActivos   = rows.filter(r => (r.enviadas + r.en_negociacion) > 0);

  // 1. Servicio más rentable por ingresos ganados
  const masRentable = [...conIngresos].sort((a, b) => b.monto_ganado - a.monto_ganado)[0];
  if (masRentable) {
    const c = convRate(masRentable.ganadas, masRentable.perdidas);
    out.push({
      tipo: "estrella",
      titulo: `${lbl(masRentable.servicio)} — servicio más rentable`,
      texto: `${fmt(masRentable.monto_ganado)} en ingresos ganados${c !== null ? ` con ${c}% de tasa de cierre` : ""}. Es donde más dinero has cerrado.`,
    });
  }

  // 2. Mejor tasa de cierre (distinto al más rentable)
  const mejorConv = [...conResueltas]
    .map(r => ({ ...r, c: convRate(r.ganadas, r.perdidas)! }))
    .sort((a, b) => b.c - a.c)
    .find(r => r.servicio !== masRentable?.servicio);
  if (mejorConv && mejorConv.c > 0) {
    out.push({
      tipo: "ok",
      titulo: `${lbl(mejorConv.servicio)} — mejor tasa de cierre`,
      texto: `${mejorConv.c}% de conversión (${mejorConv.ganadas} ganada${mejorConv.ganadas !== 1 ? "s" : ""} de ${mejorConv.ganadas + mejorConv.perdidas} resueltas). Priorizar este servicio aumenta tus probabilidades de cierre.`,
    });
  }

  // 3. Mayor volumen con conversión baja → oportunidad de mejora
  const mayorVolumen = [...rows].sort((a, b) => b.total - a.total)[0];
  if (mayorVolumen) {
    const c = convRate(mayorVolumen.ganadas, mayorVolumen.perdidas);
    if (c !== null && c < 40) {
      out.push({
        tipo: "alerta",
        titulo: `${lbl(mayorVolumen.servicio)} — mayor volumen pero bajo cierre`,
        texto: `Es el servicio con más propuestas (${mayorVolumen.total} en total) pero solo ${c}% de conversión. Analiza los motivos de pérdida para mejorar la propuesta.`,
      });
    } else if (c === null && mayorVolumen.total > 1) {
      out.push({
        tipo: "oportunidad",
        titulo: `${lbl(mayorVolumen.servicio)} — sin cierres registrados`,
        texto: `${mayorVolumen.total} propuestas enviadas sin ningún cierre resuelto. Es el servicio con más volumen pero sin resultado — prioriza el seguimiento.`,
      });
    }
  }

  // 4. Servicios con propuestas activas y ningún historial de cierre
  const activosSinHistorial = conActivos.filter(
    r => r.ganadas === 0 && r.perdidas === 0 && r.servicio !== mayorVolumen?.servicio,
  );
  if (activosSinHistorial.length > 0) {
    const nombres = activosSinHistorial.map(r => lbl(r.servicio)).slice(0, 3).join(", ");
    out.push({
      tipo: "oportunidad",
      titulo: `Primer cierre pendiente: ${nombres}`,
      texto: `${activosSinHistorial.length === 1 ? "Este servicio tiene" : "Estos servicios tienen"} propuestas activas en pipeline pero ningún cierre registrado — oportunidad de abrir el historial.`,
    });
  }

  // 5. Servicios con más pérdidas que ganancias
  const masPerdidasQueGanancias = rows.find(
    r => r.perdidas > r.ganadas && r.perdidas >= 2 && r.servicio !== mayorVolumen?.servicio,
  );
  if (masPerdidasQueGanancias) {
    out.push({
      tipo: "alerta",
      titulo: `${lbl(masPerdidasQueGanancias.servicio)} — más pérdidas que ganancias`,
      texto: `${masPerdidasQueGanancias.perdidas} propuestas perdidas vs ${masPerdidasQueGanancias.ganadas} ganadas. Revisa la propuesta de valor o el precio de este servicio.`,
    });
  }

  return out;
}

// ─── Estilos por tipo de insight ──────────────────────────────────────────────

const INSIGHT_ICON: Record<Insight["tipo"], React.ReactNode> = {
  estrella:    <Trophy       size={13} className="text-amber-400 shrink-0 mt-0.5" />,
  ok:          <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />,
  alerta:      <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />,
  oportunidad: <Lightbulb    size={13} className="text-cyan-400 shrink-0 mt-0.5" />,
};

const INSIGHT_BG: Record<Insight["tipo"], string> = {
  estrella:    "border border-amber-500/30 bg-amber-500/12",
  ok:          "border border-emerald-500/30 bg-emerald-500/12",
  alerta:      "border border-red-500/30 bg-red-500/12",
  oportunidad: "border border-cyan-500/30 bg-cyan-500/12",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function InsightServicios() {
  const c = useChartColors();
  const [datos,    setDatos]    = useState<ServicioAnalisis[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getAnalisisPipeline()
      .then(d => setDatos(d.por_servicio))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand" />
      </div>
    );
  }

  if (!datos || datos.length === 0) return null;

  const insights  = generarInsights(datos);
  const chartData = [...datos]
    .filter(r => r.total > 0)
    .sort((a, b) => (b.ganadas + b.en_negociacion + b.enviadas + b.perdidas) - (a.ganadas + a.en_negociacion + a.enviadas + a.perdidas))
    .map(r => ({
      name:     lbl(r.servicio).length > 16 ? lbl(r.servicio).slice(0, 15) + "…" : lbl(r.servicio),
      Ganadas:  r.ganadas,
      Activas:  r.enviadas + r.en_negociacion,
      Perdidas: r.perdidas,
    }));

  return (
    <div className={`${CARD_CLASS} space-y-5`}>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-cyan-400 shrink-0" />
        <div>
          <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Inteligencia por servicio</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Qué servicios venden más, cuáles se pierden y dónde está el dinero</p>
        </div>
      </div>

      {/* Gráfico de barras agrupadas */}
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
            <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar filter="url(#neon-glow)" dataKey="Ganadas"  fill="#16a34a"      radius={[3, 3, 0, 0]} barSize={12} />
            <Bar filter="url(#neon-glow)" dataKey="Activas"  fill={c.accent} radius={[3, 3, 0, 0]} barSize={12} />
            <Bar filter="url(#neon-glow)" dataKey="Perdidas" fill={c.danger} radius={[3, 3, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla resumen */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left py-2 px-3 text-zinc-500 font-medium">Servicio</th>
              <th className="text-center py-2 pr-2 text-zinc-500 font-medium">Activas</th>
              <th className="text-center py-2 pr-2 text-emerald-400 font-medium">Ganadas</th>
              <th className="text-center py-2 pr-2 text-red-400 font-medium">Perdidas</th>
              <th className="text-right py-2 pr-2 text-zinc-500 font-medium">Ingresos</th>
              <th className="text-center py-2 pr-3 text-zinc-500 font-medium">Cierre %</th>
            </tr>
          </thead>
          <tbody>
            {datos.map(r => {
              const c = convRate(r.ganadas, r.perdidas);
              return (
                <tr key={r.servicio} className="border-b border-white/[0.05] hover:bg-zinc-800/40 transition">
                  <td className="py-2.5 px-3 font-medium text-zinc-200">{lbl(r.servicio)}</td>
                  <td className="py-2.5 pr-2 text-center text-zinc-400">{r.enviadas + r.en_negociacion}</td>
                  <td className="py-2.5 pr-2 text-center font-semibold text-green-700">{r.ganadas}</td>
                  <td className="py-2.5 pr-2 text-center text-red-500">{r.perdidas}</td>
                  <td className="py-2.5 pr-2 text-right text-zinc-300">{r.monto_ganado > 0 ? fmt(r.monto_ganado) : "—"}</td>
                  <td className="py-2.5 pr-3 text-center">
                    {c !== null
                      ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ c >= 60 ? "bg-emerald-500/15 text-emerald-300" : c >= 30 ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300" }`}>{c}%</span>
                      : <span className="text-[10px] text-zinc-300">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider pt-1">Análisis automático</p>
          {insights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${INSIGHT_BG[ins.tipo]}`}>
              {INSIGHT_ICON[ins.tipo]}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-zinc-200 mb-0.5">{ins.titulo}</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{ins.texto}</p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
