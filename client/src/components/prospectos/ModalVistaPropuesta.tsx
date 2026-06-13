/** client/src/components/propuestas/ModalVistaPropuesta.tsx */

import { MODAL_BASE, PANEL_BASE } from "../../lib/tokens";
import { X, Pencil, Trash2, ArrowRight } from "lucide-react";
import type { Propuesta } from "../../types/propuesta.types";
import { LABEL_SERVICIO, LABEL_ESTADO, COLOR_ESTADO } from "../../types/propuesta.types";

interface Props {
  propuesta:  Propuesta;
  onEditar:   () => void;
  onEliminar: () => void;
  onCerrar:   () => void;
}

const fmt = (n: number, moneda: string) =>
  `${moneda === "USD" ? "$ " : "S/ "}${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s.slice(0, 10) + "T12:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function fmtFecha(s: string | null | undefined) {
  const d = parseDate(s);
  if (!d) return null;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}

function diffDias(desde: string | null | undefined, hasta: string | null | undefined) {
  const a = parseDate(desde);
  const b = parseDate(hasta);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function ModalVistaPropuesta({ propuesta: p, onEditar, onEliminar, onCerrar }: Props) {
  const esGanada   = p.estado === "cerrada_ganada";
  const esPerdida  = p.estado === "cerrada_perdida";
  const diferencia = p.monto_cerrado != null ? p.monto_cerrado - p.monto_propuesto : null;

  const dNeg    = diffDias(p.fecha_propuesta, p.fecha_negociacion);
  const dCierre = p.fecha_negociacion
    ? diffDias(p.fecha_negociacion, p.fecha_cierre)
    : diffDias(p.fecha_propuesta, p.fecha_cierre);
  const dTotal  = diffDias(p.fecha_propuesta, p.fecha_cierre);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4"
      onClick={onCerrar}
    >
      <div
        className={`${MODAL_BASE} w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] text-zinc-400 mb-0.5">
              {LABEL_SERVICIO[p.servicio as keyof typeof LABEL_SERVICIO] ?? p.servicio}
            </p>
            <p className="text-sm font-semibold text-zinc-200 leading-snug">{p.descripcion}</p>
          </div>
          <button onClick={onCerrar} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-400 hover:bg-zinc-800 transition shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Estado */}
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${COLOR_ESTADO[p.estado as keyof typeof COLOR_ESTADO]}`}>
          {LABEL_ESTADO[p.estado as keyof typeof LABEL_ESTADO] ?? p.estado}
        </span>

        {/* Montos */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`${PANEL_BASE} p-3`}>
            <p className="text-[10px] text-zinc-400 mb-0.5">Monto propuesto</p>
            <p className="text-sm font-bold text-zinc-200">{fmt(p.monto_propuesto, p.moneda)}</p>
            {p.moneda === "USD" && (
              <p className="text-[10px] text-zinc-400">TC: {p.tipo_cambio}</p>
            )}
          </div>
          {p.monto_cerrado != null && (
            <div className={`${PANEL_BASE} p-3`}>
              <p className="text-[10px] text-zinc-400 mb-0.5">Monto cerrado</p>
              <p className={`text-sm font-bold ${diferencia! < 0 ? "text-red-600" : "text-green-600"}`}>
                {fmt(p.monto_cerrado, p.moneda)}
              </p>
              {diferencia !== 0 && diferencia != null && (
                <p className={`text-[10px] ${diferencia < 0 ? "text-red-400" : "text-green-400"}`}>
                  {diferencia > 0 ? "+" : ""}{fmt(diferencia, p.moneda)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Línea de tiempo */}
        <div className="border border-dashed border-white/10 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-semibold text-zinc-100 uppercase tracking-wide">Línea de tiempo</p>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 text-center text-sm">📤</span>
              <div>
                <p className="text-[10px] font-semibold text-blue-700">Enviada</p>
                <p className="text-xs text-zinc-400">{fmtFecha(p.fecha_propuesta) ?? "—"}</p>
              </div>
            </div>

            {p.fecha_negociacion && (
              <>
                <div className="flex items-center gap-2 pl-3">
                  <ArrowRight size={11} className="text-zinc-300" />
                  {dNeg !== null && (
                    <span className="text-[10px] text-zinc-400 bg-zinc-800/40 px-1.5 py-0.5 rounded-md">{dNeg} días</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-sm">⚖️</span>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-700">En negociación</p>
                    <p className="text-xs text-zinc-400">{fmtFecha(p.fecha_negociacion)}</p>
                  </div>
                </div>
              </>
            )}

            {p.fecha_cierre && (
              <>
                <div className="flex items-center gap-2 pl-3">
                  <ArrowRight size={11} className="text-zinc-300" />
                  {dCierre !== null && (
                    <span className="text-[10px] text-zinc-400 bg-zinc-800/40 px-1.5 py-0.5 rounded-md">{dCierre} días</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-sm">{esGanada ? "✅" : esPerdida ? "❌" : "🔒"}</span>
                  <div>
                    <p className={`text-[10px] font-semibold ${esGanada ? "text-green-700" : esPerdida ? "text-red-700" : "text-zinc-300"}`}>
                      {esGanada ? "Cerrada ganada" : esPerdida ? "Cerrada perdida" : "Vencida"}
                    </p>
                    <p className="text-xs text-zinc-400">{fmtFecha(p.fecha_cierre)}</p>
                  </div>
                </div>
              </>
            )}

            {dTotal !== null && (
              <div className="mt-1 pt-2 border-t border-white/8 flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">Proceso total:</span>
                <span className="text-xs font-bold text-zinc-300">{dTotal} días</span>
              </div>
            )}
          </div>
        </div>

        {/* Notas */}
        {p.notas && (
          <div>
            <p className="text-[10px] font-semibold text-zinc-100 uppercase tracking-wide mb-1">Notas</p>
            <p className="text-xs text-zinc-400 bg-zinc-800/40 rounded-lg p-3">{p.notas}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onEliminar}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-white/10 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-300 transition"
          >
            <Trash2 size={13} /> Eliminar
          </button>
          <button
            onClick={onEditar}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-brand hover:bg-brand-hover text-white rounded-lg transition"
          >
            <Pencil size={13} /> Editar propuesta
          </button>
        </div>
      </div>
    </div>
  );
}
