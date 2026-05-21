/** client/src/components/propuestas/TablaPropuestas.tsx */

import { useState } from "react";
import { Pencil, Trash2, ArrowRight } from "lucide-react";
import type { Propuesta } from "../../types/propuesta.types";
import {
  LABEL_SERVICIO,
  LABEL_ESTADO,
  COLOR_ESTADO,
} from "../../types/propuesta.types";
import { ModalVistaPropuesta } from "./ModalVistaPropuesta";

interface Props {
  propuestas: Propuesta[];
  onEditar:   (p: Propuesta) => void;
  onEliminar: (id: string) => void;
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
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "long" });
}

function diffDias(desde: string | null | undefined, hasta: string | null | undefined) {
  const a = parseDate(desde);
  const b = parseDate(hasta);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function Paso({ icono, label, fecha, color }: { icono: string; label: string; fecha: string | null | undefined; color: string }) {
  if (!fecha) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap ${color}`}>
      {icono} {label} <span className="font-semibold">{fmtFecha(fecha)}</span>
    </span>
  );
}

function TimelinePropuesta({ p }: { p: Propuesta }) {
  const dNeg    = diffDias(p.fecha_propuesta, p.fecha_negociacion);
  const dCierre = p.fecha_negociacion
    ? diffDias(p.fecha_negociacion, p.fecha_cierre)
    : diffDias(p.fecha_propuesta, p.fecha_cierre);
  const dTotal  = diffDias(p.fecha_propuesta, p.fecha_cierre);

  const esGanada  = p.estado === "cerrada_ganada";
  const esPerdida = p.estado === "cerrada_perdida";

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Enviada — siempre */}
      <Paso icono="📤" label="Enviada" fecha={p.fecha_propuesta} color="bg-blue-50 text-blue-700" />

      {/* → Negociación */}
      {p.fecha_negociacion && (
        <>
          <div className="flex flex-col items-center text-zinc-300">
            <ArrowRight size={10} />
            {dNeg !== null && <span className="text-[9px] text-zinc-400">{dNeg}d</span>}
          </div>
          <Paso icono="⚖️" label="Negociación" fecha={p.fecha_negociacion} color="bg-amber-50 text-amber-700" />
        </>
      )}

      {/* → Cierre */}
      {p.fecha_cierre && (
        <>
          <div className="flex flex-col items-center text-zinc-300">
            <ArrowRight size={10} />
            {dCierre !== null && <span className="text-[9px] text-zinc-400">{dCierre}d</span>}
          </div>
          <Paso
            icono={esGanada ? "✅" : esPerdida ? "❌" : "🔒"}
            label={esGanada ? "Cerrada ganada" : esPerdida ? "Cerrada perdida" : "Vencida"}
            fecha={p.fecha_cierre}
            color={esGanada ? "bg-green-50 text-green-700" : esPerdida ? "bg-red-50 text-red-700" : "bg-zinc-50 text-zinc-500"}
          />
        </>
      )}

      {/* Total */}
      {dTotal !== null && (
        <span className="ml-1 text-[9px] text-zinc-400 font-medium self-end mb-1">
          = {dTotal}d total
        </span>
      )}
    </div>
  );
}

export function TablaPropuestas({ propuestas, onEditar, onEliminar }: Props) {
  const [vista, setVista] = useState<Propuesta | null>(null);

  return (
    <>
    {vista && (
      <ModalVistaPropuesta
        propuesta={vista}
        onCerrar={() => setVista(null)}
        onEditar={() => { setVista(null); onEditar(vista); }}
        onEliminar={() => { setVista(null); onEliminar(vista.id); }}
      />
    )}
    <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
      <table className="text-xs" style={{ minWidth: "900px", width: "100%" }}>
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase w-[120px]">Servicio</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase w-[150px]">Descripción</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase w-[110px]">Propuesto</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase w-[110px]">Cerrado</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase w-[110px]">Estado</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Línea de tiempo</th>
            <th className="px-3 py-3 w-[70px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {propuestas.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-10 text-xs text-zinc-400">
                Sin propuestas registradas
              </td>
            </tr>
          ) : propuestas.map((p) => {
            const diferencia = p.monto_cerrado != null
              ? p.monto_cerrado - p.monto_propuesto
              : null;

            return (
              <tr key={p.id} onClick={() => setVista(p)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5 font-medium text-zinc-800">
                  {LABEL_SERVICIO[p.servicio as keyof typeof LABEL_SERVICIO] ?? p.servicio}
                </td>
                <td className="px-5 py-3.5 text-zinc-500 max-w-[160px] truncate">
                  {p.descripcion}
                </td>
                <td className="px-5 py-3.5 font-semibold text-zinc-800 whitespace-nowrap">
                  {fmt(p.monto_propuesto, p.moneda)}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {p.monto_cerrado != null ? (
                    <span className={diferencia! < 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                      {fmt(p.monto_cerrado, p.moneda)}
                      {diferencia !== 0 && (
                        <span className="ml-1 text-[10px] font-normal">
                          ({diferencia! > 0 ? "+" : ""}{fmt(diferencia!, p.moneda)})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_ESTADO[p.estado as keyof typeof COLOR_ESTADO]}`}>
                    {LABEL_ESTADO[p.estado as keyof typeof LABEL_ESTADO] ?? p.estado}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <TimelinePropuesta p={p} />
                </td>
                <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditar(p)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onEliminar(p.id)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}
