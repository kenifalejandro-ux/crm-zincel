/** client/src/components/inteligencia/CoberturaLlamadas.tsx */

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { CARD_CLASS, COLORS, BADGE_BASE } from "../../lib/tokens";
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
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand" />
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
    { label: "Sin resultado registrado", valor: a.sin_resultado,       color: COLORS.danger,  alerta: true  },
    { label: "No interesado",            valor: a.no_interesado,       color: "#ef4444",      alerta: false },
    { label: "Interesado",               valor: a.interesado,          color: "#16a34a",      alerta: false },
    { label: "No contesta",              valor: a.no_contesta,         color: "#a1a1aa",      alerta: false },
    { label: "Volver a llamar",          valor: a.volver_a_llamar,     color: COLORS.primary, alerta: false },
    { label: "Número equivocado",        valor: a.numero_equivocado,   color: "#f59e0b",      alerta: false },
    { label: "Fuera de servicio",        valor: a.fuera_de_servicio,   color: "#94a3b8",      alerta: false },
    { label: "Solicita información",     valor: a.solicita_informacion,color: "#3b82f6",      alerta: false },
    { label: "Tiene proveedor",          valor: a.ya_tiene_proveedor,  color: "#6366f1",      alerta: false },
    { label: "Buzón de voz",             valor: a.buzon_de_voz,        color: "#d4d4d8",      alerta: false },
  ].filter(r => r.valor > 0);

  return (
    <div className={`${CARD_CLASS} space-y-5`}>

      {/* KPIs principales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/8 p-4 text-center">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest mb-1">Total llamadas</p>
          <p className="text-2xl font-bold text-zinc-100">{a.total}</p>
        </div>
        <div className="rounded-xl border border-white/8 p-4 text-center">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest mb-1">Contestadas</p>
          <p className="text-2xl font-bold text-teal-700">{a.contestadas}</p>
          <p className="text-[10px] text-zinc-400 mt-1">{pctContacto}% tasa de contacto</p>
        </div>
        <div className="rounded-xl border border-white/8 p-4 text-center">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest mb-1">No contestadas</p>
          <p className="text-2xl font-bold text-zinc-500">{a.no_contestadas}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Cobertura de prospección */}
        <div className="space-y-4">
          <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Cobertura de prospección</p>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Leads llamados al menos 1 vez</span>
              <span className="font-bold text-zinc-200">{c.con_llamadas} <span className="text-zinc-400 font-normal">/ {c.total_prospectos}</span></span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-800 rounded-full transition-all duration-700" style={{ width: `${pctCobertura}%` }} />
            </div>
            <p className="text-[10px] text-zinc-500">{pctCobertura}% del total · <span className="text-red-500 font-medium">{c.sin_llamadas} nunca contactados</span></p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Tasa de contacto (contestadas)</span>
              <span className="font-bold text-teal-700">{pctContacto}%</span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all duration-700" style={{ width: `${pctContacto}%` }} />
            </div>
            <p className="text-[10px] text-zinc-500">{a.contestadas} de {a.total} llamadas fueron atendidas</p>
          </div>

          {/* Tendencia mensual */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-zinc-100 uppercase tracking-wider">Tendencia de actividad</p>
            <div className="flex items-end gap-1.5 h-16">
              {[...tendencia].reverse().map(t => (
                <div key={t.mes} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end gap-px" style={{ height: 48 }}>
                    <div
                      className="w-full rounded-t bg-zinc-700"
                      style={{ height: `${Math.round((t.total / maxTendencia) * 48)}px` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-400">{labelMes(t.mes)}</span>
                  <span className="text-[9px] font-bold text-zinc-400">{t.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resultados de llamadas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Resultados registrados</p>
            {a.sin_resultado > 0 && (
              <span className={`${BADGE_BASE} flex items-center gap-1 text-[10px] text-amber-700 border-amber-200 px-2 py-0.5`}>
                <AlertTriangle size={10} />
                {a.sin_resultado} sin registrar ({Math.round((a.sin_resultado / total) * 100)}%)
              </span>
            )}
          </div>
          <div className="space-y-2">
            {resultados.map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <div className="h-2 rounded-full overflow-hidden bg-zinc-800 flex-1">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round((r.valor / total) * 100)}%`,
                      backgroundColor: r.color,
                    }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 w-32 shrink-0 truncate">{r.label}</span>
                <span className="text-[10px] font-bold text-zinc-200 w-5 text-right shrink-0">{r.valor}</span>
                <span className="text-[10px] text-zinc-400 w-8 text-right shrink-0">{Math.round((r.valor / total) * 100)}%</span>
              </div>
            ))}
          </div>

          {a.sin_resultado > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <span className="font-bold">{a.sin_resultado} llamadas ({Math.round((a.sin_resultado / total) * 100)}%)</span> no tienen resultado registrado — el vendedor marcó la llamada pero no anotó qué pasó. Esto impide analizar la efectividad real del equipo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
