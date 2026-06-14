/** client/src/components/llamadas/HistorialLlamadas.tsx — REDISEÑO NEON
 * Antes: filas tema claro (bg-green-50/text-green-600, bg-zinc-800, divide-gray-50,
 *        border-white/8 inválido, text-gray-300, checkboxes nativos).
 * Ahora: filas neon con ícono contestada/no (verde/rojo glow), badge de canal,
 *        check de acento, acciones al hover. Props/lógica INTACTOS.
 */
import { GLASS_BASE } from "../../lib/tokens";
import { PhoneCall, PhoneMissed, Pencil, Trash2, Check } from "lucide-react";

interface Props {
  llamadas:        any[];
  seleccionados?:  string[];
  onToggle?:       (id: string) => void;
  onToggleTodos?:  () => void;
  onEditar?:       (l: any) => void;
  onEliminar?:     (id: string) => void;
  onVerProspecto?: (prospecto_id: string) => void;
}

const CANAL_COLOR: Record<string, string> = { llamada: "#06b6d4", whatsapp: "#34d399", email: "#a855f7", telefono: "#06b6d4" };

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${checked ? "bg-accent border-accent-30" : "border-white/20 hover:border-accent-30"}`}>
      {checked && <Check size={11} className="text-[#04101a]" strokeWidth={3} />}
    </button>
  );
}

export function HistorialLlamadas({
  llamadas, seleccionados = [], onToggle, onToggleTodos, onEditar, onEliminar, onVerProspecto,
}: Props) {
  const todosSeleccionados = llamadas.length > 0 && seleccionados.length === llamadas.length;
  const mostrarCheck = !!onToggle;

  return (
    <div className={`${GLASS_BASE} overflow-hidden max-h-[700px] overflow-y-auto`}>
      <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center gap-3 sticky top-0 bg-[#0a101f]/95 backdrop-blur z-10">
        {mostrarCheck && <Checkbox checked={todosSeleccionados} onChange={() => onToggleTodos?.()} />}
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Historial de llamadas</h2>
        <span className="ml-auto text-[11px] text-zinc-600">{llamadas.length} registros</span>
      </div>

      <div>
        {llamadas.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-500">Sin llamadas registradas</div>
        ) : (
          llamadas.slice(0, 50).map((l: any) => {
            const col = CANAL_COLOR[String(l.canal).toLowerCase()] ?? "#06b6d4";
            const linkable = onVerProspecto && l.prospecto_id;
            return (
              <div key={l.id} className="px-5 py-3 flex items-center gap-3 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] transition group">
                {mostrarCheck && <Checkbox checked={seleccionados.includes(l.id)} onChange={() => onToggle!(l.id)} />}

                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                     style={l.contestada
                       ? { background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }
                       : { background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.28)", color: "#f87171" }}>
                  {l.contestada ? <PhoneCall size={14} /> : <PhoneMissed size={14} />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-semibold text-zinc-100 truncate transition-colors ${linkable ? "cursor-pointer hover:text-accent" : ""}`}
                     onClick={() => linkable && onVerProspecto!(l.prospecto_id)}>
                    {l.empresa}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11.5px] text-zinc-500 truncate">{l.nombre_contacto || "Sin contacto"}</span>
                    <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide capitalize shrink-0" style={{ color: col, background: `${col}18` }}>{l.canal}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[12px] font-semibold text-zinc-300 tabular-nums">{new Date(l.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</p>
                  <p className="text-[10.5px] text-zinc-600 tabular-nums">{new Date(l.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditar && <button onClick={() => onEditar(l)} className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-white/5 transition" title="Editar"><Pencil size={13} /></button>}
                  {onEliminar && <button onClick={() => onEliminar(l.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Eliminar"><Trash2 size={13} /></button>}
                </div>
              </div>
            );
          })
        )}

        {llamadas.length > 50 && (
          <div className="px-5 py-3 text-center text-xs text-zinc-500">Mostrando 50 de {llamadas.length} llamadas</div>
        )}
      </div>
    </div>
  );
}