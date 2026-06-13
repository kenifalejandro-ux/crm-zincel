/** client/src/features/inicio/LeadDrawer.tsx
 *  Panel lateral de ficha rápida de un lead caliente.
 */
import { BTN_PRIMARY, BTN_GHOST } from "../../lib/tokens";
import { ETAPA_LABEL, ETAPA_COLOR, ETAPAS_ORDEN, fmtSoles } from "./inicio.constants";
import { Phone, Calendar, User, Building, MapPin, ArrowUR, X } from "./inicio.icons";
import type { LeadCaliente } from "../../services/inicio.api";

interface Props {
  lead: LeadCaliente;
  onClose: () => void;
  onAccion?: (accion: "llamar" | "agendar" | "ficha", lead: LeadCaliente) => void;
}

export function LeadDrawer({ lead, onClose, onAccion }: Props) {
  const idx = ETAPAS_ORDEN.indexOf(lead.etapa_pipeline as (typeof ETAPAS_ORDEN)[number]);
  const color = ETAPA_COLOR[lead.etapa_pipeline] ?? "#06b6d4";

  const datos = [
    { Icon: Phone,    label: "Teléfono", value: lead.telefono ?? "Sin registrar" },
    { Icon: User,     label: "Contacto", value: lead.nombre_contacto ?? "Sin registrar" },
    { Icon: Building, label: "Ciudad",   value: lead.ciudad ?? "Sin registrar" },
  ];

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[400px] slide-in">
        <div className="neon-card h-full !rounded-none !rounded-l-2xl flex flex-col">

          <div className="px-6 pt-6 pb-5 border-b border-white/[0.07]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Lead caliente</p>
                <h2 className="font-display text-xl font-bold text-zinc-100 mt-1.5 leading-tight">{lead.empresa}</h2>
                <div className="flex items-center gap-3 mt-2 text-[12px] text-zinc-500">
                  {lead.nombre_contacto && <span className="flex items-center gap-1.5"><User size={12} />{lead.nombre_contacto}</span>}
                  {lead.ciudad && <span className="flex items-center gap-1.5"><MapPin size={12} />{lead.ciudad}</span>}
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition shrink-0">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="neon-panel p-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Valor pipeline</p>
                <p className="font-display text-[26px] font-bold text-accent leading-none mt-2 tabular-nums">
                  {lead.valor_pipeline > 0 ? fmtSoles(lead.valor_pipeline) : "—"}
                </p>
              </div>
              <span className="neon-badge px-2.5 py-1 text-[10.5px] font-bold" style={{ color }}>
                {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3">Etapa del pipeline</p>
              <div className="flex items-center gap-1.5">
                {ETAPAS_ORDEN.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full transition-all"
                    style={i <= idx
                      ? { background: color, boxShadow: `0 0 8px ${color}` }
                      : { background: "rgba(255,255,255,0.08)" }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[9.5px] uppercase tracking-wider text-zinc-600">
                <span>Contacto</span><span>Cierre</span>
              </div>
            </div>

            <div className="neon-panel divide-y divide-white/[0.06]">
              {datos.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3">
                  <Icon size={13} className="text-zinc-500 shrink-0" />
                  <span className="text-[11px] uppercase tracking-wider text-zinc-600 w-16 shrink-0">{label}</span>
                  <span className="text-[13px] text-zinc-200 font-medium truncate">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button onClick={() => onAccion?.("llamar", lead)} className={`${BTN_PRIMARY} w-full py-2.5 text-[13px] flex items-center justify-center gap-2`}>
                <Phone size={14} /> Llamar ahora
              </button>
              <button onClick={() => onAccion?.("agendar", lead)} className={`${BTN_GHOST} w-full py-2.5 text-[12.5px] font-semibold text-zinc-300 flex items-center justify-center gap-2`}>
                <Calendar size={13} /> Agendar reunión
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/[0.07]">
            <button onClick={() => onAccion?.("ficha", lead)} className="flex items-center gap-2 text-[13px] font-semibold text-accent hover:opacity-80 transition group">
              Abrir ficha completa
              <ArrowUR size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
