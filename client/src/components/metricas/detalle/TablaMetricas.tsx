/** src/components/metricas/detalle/TablaMetricas.tsx */

import { useState, useRef }        from "react";
import { Pencil, Trash2, Tag }    from "lucide-react";
import { Metrica } from "@/types/metricas.types";
import { TableCheckbox } from "@/components/ui/TableCheckbox";
import { TableHeaderCheckbox } from "@/components/ui/TableHeaderCheckbox";
import { ModalDetalleMetrica } from "./ModalDetalleMetrica";
import { updateMetrica } from "@/services/metricas.api";

const BADGE: Record<string, string> = {
  meta:   "bg-blue-100 text-blue-700",
  google: "bg-red-100  text-red-700",
  tiktok: "bg-pink-100 text-pink-700",
};

const LABEL: Record<string, string> = {
  meta:   "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
};

const LABEL_SUB: Record<string, string> = {
  facebook:         "Facebook",
  instagram:        "Instagram",
  audience_network: "Audience Network",
};

interface Props {
  metricas:           Metrica[];
  seleccionados:      string[];
  todosSeleccionados: boolean;
  proyectos?:         string[];
  onToggleUno:        (id: string) => void;
  onToggleTodos:      () => void;
  onEditar:           (m: Metrica) => void;
  onBorrar:           (id: string) => void;
  onProyectoGuardado?: () => void;
  onSincronizado?:    () => void;
}

// ── Celda de proyecto con edición inline ─────────────────────────────────────
function ProyectoCell({ metrica, proyectos, onGuardado }: {
  metrica:    Metrica;
  proyectos:  string[];
  onGuardado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valor,    setValor]    = useState(metrica.proyecto ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const guardar = async () => {
    setEditando(false);
    if (valor !== (metrica.proyecto ?? "")) {
      await updateMetrica(metrica.id, { proyecto: valor || null } as any);
      onGuardado();
    }
  };

  if (editando) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={guardar}
          onKeyDown={(e) => { if (e.key === "Enter") guardar(); if (e.key === "Escape") setEditando(false); }}
          list={`proy-${metrica.id}`}
          placeholder="Proyecto..."
          className="text-xs border border-violet-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
        <datalist id={`proy-${metrica.id}`}>
          {proyectos.map((p) => <option key={p} value={p} />)}
        </datalist>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setEditando(true); }}
      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition group ${
        valor
          ? "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
          : "text-zinc-300 hover:text-zinc-500 border border-dashed border-zinc-200 hover:border-zinc-400"
      }`}
    >
      {valor ? (
        <><Tag size={9} />{valor}</>
      ) : (
        <><Tag size={9} /><span className="opacity-0 group-hover:opacity-100">Asignar</span></>
      )}
    </button>
  );
}

export const TablaMetricas = ({
  metricas, seleccionados, todosSeleccionados,
  proyectos = [],
  onToggleUno, onToggleTodos, onEditar, onBorrar, onProyectoGuardado, onSincronizado,
}: Props) => {

  const [detalle, setDetalle] = useState<Metrica | null>(null);

  return (
    <>
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 text-zinc-700 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">
                  <TableHeaderCheckbox
                    checked={todosSeleccionados}
                    onChange={onToggleTodos}
                  />
                </th>
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-left">Proyecto</th>
                <th className="px-4 py-3 text-left">Campaña</th>
                <th className="px-4 py-3 text-left">Plataforma</th>
                <th className="px-4 py-3 text-right">Gasto</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Clics</th>
                <th className="px-4 py-3 text-right">CTR%</th>
                <th className="px-4 py-3 text-right">ROAS</th>
                <th className="px-4 py-3 text-right">CPL</th>
                <th className="px-4 py-3 text-right">CPA</th>
                <th className="px-4 py-3 text-left">Período</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {metricas.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-zinc-600">
                    No hay métricas registradas
                  </td>
                </tr>
              ) : metricas.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setDetalle(m)}
                  className="hover:bg-zinc-50 transition cursor-pointer"
                >
                  {/* Checkbox — detiene propagación para no abrir el modal */}
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TableCheckbox
                      checked={seleccionados.includes(m.id)}
                      onChange={() => onToggleUno(m.id)}
                    />
                  </td>

                  <td className="px-4 py-3 font-medium text-zinc-800">
                    {m.empresa}
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <ProyectoCell
                      metrica={m}
                      proyectos={proyectos}
                      onGuardado={onProyectoGuardado ?? (() => {})}
                    />
                  </td>

                  <td className="px-4 py-3 text-zinc-600">
                    {m.campana_nombre}
                  </td>

                  {/* Plataforma + sub */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium w-fit ${BADGE[m.plataforma]}`}>
                        {LABEL[m.plataforma]}
                      </span>
                      {m.sub_plataforma && (
                        <span className="text-[10px] text-zinc-600 pl-1">
                          {LABEL_SUB[m.sub_plataforma] ?? m.sub_plataforma}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    S/ {Number(m.gasto).toLocaleString("es-PE")}
                  </td>

                  <td className="px-4 py-3 text-right">{m.leads}</td>

                  <td className="px-4 py-3 text-right">
                    {Number(m.clics).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right">{m.ctr}%</td>

                  <td className="px-4 py-3 text-right">{m.roas}x</td>

                  <td className="px-4 py-3 text-right">
                    S/ {Number(m.cpa).toLocaleString("es-PE")}
                  </td>

                  <td className="px-4 py-3 text-right text-zinc-400">
                    {Number(m.conversiones) > 0
                      ? `S/ ${(Number(m.gasto) / Number(m.conversiones)).toLocaleString("es-PE", { maximumFractionDigits: 0 })}`
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-zinc-700">
                    {new Date(m.periodo_inicio).toLocaleDateString("es-PE")} →{" "}
                    {new Date(m.periodo_fin).toLocaleDateString("es-PE")}
                  </td>

                  {/* Acciones — detienen propagación para no abrir el modal */}
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditar(m)}
                        className="text-zinc-600 hover:text-brand transition"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onBorrar(m.id)}
                        className="text-zinc-600 hover:text-red-500 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle */}
      {detalle && (
        <ModalDetalleMetrica
          metrica={detalle}
          onCerrar={() => setDetalle(null)}
          onSincronizado={onSincronizado}
        />
      )}
    </>
  );
};