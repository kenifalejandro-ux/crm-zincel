/** client/src/components/inteligencia/CoberturaLlamadas.tsx — NEON
 * Antes: KPIs text-zinc-100 lavado + text-teal-700, barra cobertura con relleno bg-zinc-800
 * (invisible sobre track bg-zinc-800), tendencia bg-zinc-700, banner bg-amber-50,
 * spinner border-brand, badge border-amber-200, border-white/8. Ahora: todo neon con glow.
 * Lógica/datos INTACTOS.
 */

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { CARD_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import api from "../../services/api";

interface AnalisisLlamadas {
  actividad: {
    total: number; contestadas: number; no_contestadas: number;
    sin_resultado: number; no_interesado: number; interesado: number;
    no_contesta: number; volver_a_llamar: number; solicita_informacion: number;
    numero_equivocado: number; fuera_de_servicio: number;
    buzon_de_voz: number; ya_tiene_proveedor: number;
  };
  cobertura: {
    con_llamadas: number; sin_llamadas: number; total_prospectos: number;
  };
  tendencia: Array<{ mes: string; total: number; contestadas: number }>;
}

const MESES: Record<string, string> = {
  "01":"Ene","02":"Feb","03":"Mar","04":"Abr","05":"May","06":"Jun",
  "07":"Jul","08":"Ago","09":"Sep","10":"Oct","11":"Nov","12":"Dic",
};

function labelMes(m: string) {
  const [y, mo] = m.split("-");
  return `${MESES[mo] ?? mo} ${y.slice(2)}`;
}

export function CoberturaLlamadas() {
  const clr = useChartColors();
  const [datos,    setDatos]    = useState<AnalisisLlamadas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.get("/prospectos/analisis-llamadas")
      .then(r => setDatos(r.data.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="flex justify-center py-10">
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent" style={{ borderColor: "rgb(var(--accent))", borderTopColor: "transparent" }} />
    </div>
  );
  if (!datos) return null;

  const { actividad: a, cobertura: c, tendencia } = datos;
  const total = a.total || 1;
  const pctContacto  = Math.round((a.contestadas / total) * 100);
  const pctCobertura = c.total_prospectos > 0
    ? Math.round((c.con_llamadas / c.total_prospectos) * 100)
    : 0;
  const maxTendencia = Math.max(...tendencia.map(t => t.total), 1);

  const resultados = [
    { label: "Sin resultado registrado", valor: a.sin_resultado,        color: clr.danger,  alerta: true  },
    { label: "No interesado",            valor: a.no_interesado,        color: "#f87171",   alerta: false },
    { label: "Interesado",               valor: a.interesado,           color: "#34d399",   alerta: false },
    { label: "No contesta",              valor: a.no_contesta,          color: "#a1a1aa",   alerta: false },
    { label: "Volver a llamar",          valor: a.volver_a_llamar,      color: clr.accent,  alerta: false },
    { label: "Número equivocado",        valor: a.numero_equivocado,    color: "#fbbf24",   alerta: false },
    { label: "Fuera de servicio",        valor: a.fuera_de_servicio,    color: "#94a3b8",   alerta: false },
    { label: "Solicita información",     valor: a.solicita_informacion, color: "#60a5fa",   alerta: false },
    { label: "Tiene proveedor",          valor: a.ya_tiene_proveedor,   color: "#818cf8",   alerta: false },
    { label: "Buzón de voz",             valor: a.buzon_de_voz,         color: "#d4d4d8",   alerta: false },
  ].filter(r => r.valor > 0);

  return (
    <div className={`${CARD_CLASS} space-y-5`}>

      {/* KPIs principales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 p-4 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total llamadas</p>
          <p className="font-display text-2xl font-bold text-zinc-100 tabular-nums">{a.total}</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ background: "rgb(var(--accent) / 0.06)", borderColor: "rgb(var(--accent) / 0.25)" }}>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Contestadas</p>
          <p className="font-display text-2xl font-bold text-accent tabular-nums" style={{ textShadow: "0 0 12px rgb(var(--accent) / calc(0.5*var(--glow)))" }}>{a.contestadas}</p>
          <p className="text-[10px] text-zinc-500 mt-1">{pctContacto}% tasa de contacto</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">No contestadas</p>
          <p className="font-display text-2xl font-bold text-zinc-400 tabular-nums">{a.no_contestadas}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Cobertura de prospección */}
        <div className="space-y-4">
          <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Cobertura de prospección</p>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Leads llamados al menos 1 vez</span>
              <span className="font-bold text-zinc-200">{c.con_llamadas} <span className="text-zinc-500 font-normal">/ {c.total_prospectos}</span></span>
            </div>
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctCobertura}%`, backgroundColor: clr.accent, boxShadow: `0 0 8px ${clr.accent}` }} />
            </div>
            <p className="text-[10px] text-zinc-500">{pctCobertura}% del total · <span className="text-red-400 font-medium">{c.sin_llamadas} nunca contactados</span></p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Tasa de contacto (contestadas)</span>
              <span className="font-bold text-emerald-400">{pctContacto}%</span>
            </div>
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctContacto}%`, background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            </div>
            <p className="text-[10px] text-zinc-500">{a.contestadas} de {a.total} llamadas fueron atendidas</p>
          </div>

          {/* Tendencia mensual */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Tendencia de actividad</p>
            <div className="flex items-end gap-1.5 h-16">
              {[...tendencia].reverse().map(t => (
                <div key={t.mes} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end gap-px" style={{ height: 48 }}>
                    <div
                      className="w-full rounded-t"
                      style={{ height: `${Math.round((t.total / maxTendencia) * 48)}px`, backgroundColor: clr.accent, boxShadow: `0 0 6px ${clr.accent}88` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-500">{labelMes(t.mes)}</span>
                  <span className="text-[9px] font-bold text-zinc-400">{t.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resultados de llamadas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Resultados registrados</p>
            {a.sin_resultado > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" }}>
                <AlertTriangle size={10} />
                {a.sin_resultado} sin registrar ({Math.round((a.sin_resultado / total) * 100)}%)
              </span>
            )}
          </div>
          <div className="space-y-2">
            {resultados.map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <div className="h-2 rounded-full overflow-hidden bg-white/[0.06] flex-1">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round((r.valor / total) * 100)}%`,
                      backgroundColor: r.color,
                      boxShadow: `0 0 6px ${r.color}88`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 w-32 shrink-0 truncate">{r.label}</span>
                <span className="text-[10px] font-bold text-zinc-200 w-5 text-right shrink-0">{r.valor}</span>
                <span className="text-[10px] text-zinc-500 w-8 text-right shrink-0">{Math.round((r.valor / total) * 100)}%</span>
              </div>
            ))}
          </div>

          {a.sin_resultado > 0 && (
            <div className="rounded-xl p-3 mt-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <p className="text-[11px] text-amber-300 leading-relaxed">
                <span className="font-bold">{a.sin_resultado} llamadas ({Math.round((a.sin_resultado / total) * 100)}%)</span> no tienen resultado registrado — el vendedor marcó la llamada pero no anotó qué pasó. Esto impide analizar la efectividad real del equipo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}