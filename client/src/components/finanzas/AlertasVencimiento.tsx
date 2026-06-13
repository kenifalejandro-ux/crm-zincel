/** client/src/components/finanzas/AlertasVencimiento.tsx */

import { INPUT_BASE } from "../../lib/tokens";
import { useState, useMemo } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { Egreso, Prestamo } from "../../types/finanzas.types";

interface AlertaItem {
  id:               string;
  tipo:             "egreso" | "prestamo";
  descripcion:      string;
  monto:            number;
  moneda:           string;
  fecha_vencimiento: string;
  diasRestantes:    number;
}

interface Props {
  egresos:   Egreso[];
  prestamos: Prestamo[];
}

function diasHasta(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fecha.split("T")[0] + "T12:00:00");
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtMonto(monto: number, moneda: string) {
  return (moneda === "USD" ? "$ " : "S/ ") +
    Number(monto).toLocaleString("es-PE", { minimumFractionDigits: 2 });
}

function fmtFechaCorta(fecha: string) {
  return new Date(fecha.split("T")[0] + "T12:00:00").toLocaleDateString("es-PE", {
    day: "2-digit", month: "short",
  });
}

export function AlertasVencimiento({ egresos, prestamos }: Props) {
  const [diasAnticipacion, setDiasAnticipacion] = useState(7);
  const [cerrado, setCerrado] = useState(false);

  const alertas = useMemo<AlertaItem[]>(() => {
    const items: AlertaItem[] = [];

    for (const eg of egresos) {
      if (eg.estado !== "pendiente" || !eg.fecha_vencimiento) continue;
      const dias = diasHasta(eg.fecha_vencimiento);
      if (dias <= diasAnticipacion) {
        items.push({
          id: eg.id, tipo: "egreso",
          descripcion: eg.descripcion,
          monto: eg.monto, moneda: eg.moneda,
          fecha_vencimiento: eg.fecha_vencimiento,
          diasRestantes: dias,
        });
      }
    }

    for (const p of prestamos) {
      if (p.estado === "pagado" || !p.fecha_vencimiento) continue;
      const dias = diasHasta(p.fecha_vencimiento);
      if (dias <= diasAnticipacion) {
        items.push({
          id: p.id, tipo: "prestamo",
          descripcion: p.descripcion,
          monto: p.monto, moneda: p.moneda,
          fecha_vencimiento: p.fecha_vencimiento,
          diasRestantes: dias,
        });
      }
    }

    return items.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [egresos, prestamos, diasAnticipacion]);

  if (cerrado || alertas.length === 0) return null;

  const tieneVencidos = alertas.some(a => a.diasRestantes <= 0);
  const tieneUrgentes = alertas.some(a => a.diasRestantes > 0 && a.diasRestantes <= 3);

  const colorBanner = tieneVencidos ? "bg-red-50 border-red-200"
    : tieneUrgentes ? "bg-orange-50 border-orange-200"
    : "bg-yellow-50 border-yellow-200";

  const colorIcono = tieneVencidos ? "text-red-500"
    : tieneUrgentes ? "text-orange-500"
    : "text-yellow-500";

  return (
    <div className={`border rounded-xl p-4 ${colorBanner}`}>
      <div className="flex items-start justify-between gap-3">

        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertTriangle size={18} className={`shrink-0 mt-0.5 ${colorIcono}`} />

          <div className="flex-1 min-w-0">
            {/* Título + selector de días */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
              <p className="text-sm font-semibold text-zinc-200">
                {alertas.length} vencimiento{alertas.length !== 1 ? "s" : ""} próximo{alertas.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-300">Alertar con</span>
                <select
                  value={diasAnticipacion}
                  onChange={e => setDiasAnticipacion(Number(e.target.value))}
                  onClick={e => e.stopPropagation()}
                  className={`${INPUT_BASE} text-xs px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand/50`}
                >
                  {[3, 7, 15, 30].map(d => (
                    <option key={d} value={d}>{d} días de anticipación</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de alertas */}
            <div className="space-y-2">
              {alertas.map(a => {
                const diasColor =
                  a.diasRestantes <= 0  ? "text-red-700 font-bold"      :
                  a.diasRestantes <= 3  ? "text-orange-600 font-semibold" :
                  "text-yellow-700";

                const etiquetaDias =
                  a.diasRestantes <= 0
                    ? `Vencido hace ${Math.abs(a.diasRestantes)} día${Math.abs(a.diasRestantes) !== 1 ? "s" : ""}`
                    : a.diasRestantes === 1
                    ? "Vence mañana"
                    : `Vence en ${a.diasRestantes} días`;

                return (
                  <div key={a.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      a.tipo === "egreso"
                        ? "bg-red-100 text-red-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {a.tipo === "egreso" ? "Egreso" : "Préstamo"}
                    </span>
                    <span className="text-zinc-200 font-medium">{a.descripcion}</span>
                    <span className="text-zinc-400">{fmtMonto(a.monto, a.moneda)}</span>
                    <span className={`${diasColor} flex items-center gap-1`}>
                      {etiquetaDias}
                      <span className="text-zinc-400 font-normal">
                        ({fmtFechaCorta(a.fecha_vencimiento)})
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={() => setCerrado(true)}
          className="shrink-0 text-zinc-400 hover:text-zinc-400 transition"
          title="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
