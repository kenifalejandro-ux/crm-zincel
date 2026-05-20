/** client/src/components/inteligencia/PrioridadOperacional.tsx */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Phone, Building2, MapPin, ChevronRight, Loader2 } from "lucide-react";
import type { AccionPrioridad, LeadPrioridad } from "../../services/inteligencia.api";
import { getLeadsPrioridad } from "../../services/inteligencia.api";
import { getProspecto } from "../../services/prospectos.api";
import { ProspectoDetalle } from "../prospectos/ProspectoDetalle";
import type { Prospecto } from "../../types/prospecto.types";

const NIVEL_STYLE = {
  critica:   { badge: "bg-red-100 text-red-700",    borde: "border-red-200",    bg: "bg-red-50"    },
  urgente:   { badge: "bg-amber-100 text-amber-700", borde: "border-amber-200", bg: "bg-amber-50"  },
  pendiente: { badge: "bg-blue-100 text-blue-700",   borde: "border-blue-200",  bg: "bg-blue-50"   },
};

const NIVEL_LABEL = { critica: "CRÍTICO", urgente: "URGENTE", pendiente: "PENDIENTE" };

const ETAPA_LABEL: Record<string, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
  propuesta_enviada: "Propuesta enviada", negociacion: "Negociación",
  cerrado_ganado: "Cerrado", perdido: "Perdido",
};

interface Props { acciones: AccionPrioridad[] }

export function PrioridadOperacional({ acciones }: Props) {
  const navigate = useNavigate();
  const [accionActiva,     setAccionActiva]     = useState<AccionPrioridad | null>(null);
  const [leads,            setLeads]            = useState<LeadPrioridad[]>([]);
  const [cargandoLeads,    setCargandoLeads]    = useState(false);
  const [prospectoDetalle, setProspectoDetalle] = useState<Prospecto | null>(null);
  const [cargandoDetalle,  setCargandoDetalle]  = useState<string | null>(null); // id que está cargando

  const abrirModal = async (acc: AccionPrioridad) => {
    setAccionActiva(acc);
    setLeads([]);
    setCargandoLeads(true);
    try {
      const data = await getLeadsPrioridad(acc.tipo);
      setLeads(data);
    } catch { /* silencioso */ }
    finally { setCargandoLeads(false); }
  };

  const abrirDetalle = async (lead: LeadPrioridad) => {
    setCargandoDetalle(lead.id);
    try {
      const prospecto = await getProspecto(lead.id);
      setProspectoDetalle(prospecto);
    } catch { /* silencioso */ }
    finally { setCargandoDetalle(null); }
  };

  const cerrarModal   = () => { setAccionActiva(null); setLeads([]); };
  const cerrarDetalle = () => setProspectoDetalle(null);

  if (!acciones.length) return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎯</span>
        <h3 className="text-sm font-semibold text-zinc-800">Prioridad operacional</h3>
      </div>
      <div className="flex items-center justify-center py-6 text-xs text-emerald-600 font-medium gap-2">
        <span>✅</span> Todo al día — no hay acciones urgentes pendientes
      </div>
    </div>
  );

  const criticas = acciones.filter(a => a.nivel === "critica");
  const urgentes = acciones.filter(a => a.nivel === "urgente");

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-800">Haz esto primero</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Acciones ordenadas por impacto en ventas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {criticas.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {criticas.length} crítico{criticas.length > 1 ? "s" : ""}
              </span>
            )}
            {urgentes.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {urgentes.length} urgente{urgentes.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {acciones.map((acc, i) => {
            const s = NIVEL_STYLE[acc.nivel];
            return (
              <button key={i} onClick={() => abrirModal(acc)}
                className={`w-full text-left flex items-start gap-3 rounded-xl border p-3.5 transition-all hover:shadow-sm hover:brightness-95 cursor-pointer ${s.bg} ${s.borde}`}>
                <div className="shrink-0 w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold text-zinc-500 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm">{acc.icono}</span>
                    <span className="text-xs font-semibold text-zinc-800">{acc.titulo}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.badge}`}>
                      {NIVEL_LABEL[acc.nivel]}
                    </span>
                    <span className="ml-auto text-xs font-bold text-zinc-700 shrink-0 flex items-center gap-1">
                      {acc.cantidad} <ChevronRight size={12} className="text-zinc-400" />
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">{acc.descripcion}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal lista de leads */}
      {accionActiva && !prospectoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">

            {/* Header */}
            <div className={`flex items-center justify-between p-5 rounded-t-2xl border-b ${NIVEL_STYLE[accionActiva.nivel].bg} ${NIVEL_STYLE[accionActiva.nivel].borde}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{accionActiva.icono}</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{accionActiva.titulo}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{accionActiva.cantidad} leads · clic para gestionar</p>
                </div>
              </div>
              <button onClick={cerrarModal} className="p-1.5 rounded-lg hover:bg-black/10 transition">
                <X size={16} className="text-zinc-500" />
              </button>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cargandoLeads ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                </div>
              ) : leads.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">Sin leads disponibles</p>
              ) : (
                leads.map((lead) => (
                  <button key={lead.id} onClick={() => abrirDetalle(lead)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Building2 size={11} className="text-zinc-400 shrink-0" />
                        <p className="text-xs font-semibold text-zinc-800 truncate">{lead.empresa}</p>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">{lead.nombre_contacto}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {lead.telefono && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                            <Phone size={9} /> {lead.telefono}
                          </span>
                        )}
                        {lead.ciudad && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                            <MapPin size={9} /> {lead.ciudad}
                          </span>
                        )}
                        <span className="text-[10px] text-blue-500 font-medium capitalize">
                          {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}
                        </span>
                      </div>
                    </div>
                    {cargandoDetalle === lead.id ? (
                      <Loader2 size={14} className="shrink-0 text-blue-500 animate-spin" />
                    ) : (
                      <ChevronRight size={14} className="shrink-0 text-zinc-300 group-hover:text-blue-500 transition" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => { navigate("/prospectos"); cerrarModal(); }}
                className="w-full py-2 text-xs font-medium text-zinc-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition">
                Ver todos en Prospectos →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ficha completa del prospecto — abre encima del modal de lista */}
      {prospectoDetalle && (
        <ProspectoDetalle
          prospecto={prospectoDetalle}
          onCerrar={cerrarDetalle}
          onEditar={() => { navigate("/prospectos"); cerrarDetalle(); cerrarModal(); }}
        />
      )}
    </>
  );
}
