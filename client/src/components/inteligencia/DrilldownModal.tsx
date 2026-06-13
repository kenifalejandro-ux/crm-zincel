/** client/src/components/inteligencia/DrilldownModal.tsx */

import { useState } from "react";
import { X, Phone, PhoneCall, ExternalLink } from "lucide-react";
import { COLORS, MODAL_BASE, BADGE_BASE } from "../../lib/tokens";
import { LlamadaForm }     from "../llamadas/LlamadaForm";
import { ProspectoDetalle } from "../prospectos/ProspectoDetalle";
import { ProspectoForm }    from "../prospectos/ProspectoForm";
import { getProspecto }     from "../../services/prospectos.api";
import type { Prospecto }   from "../../types/prospecto.types";

export interface LeadDrilldown {
  id:              string;
  empresa:         string;
  nombre_contacto?: string | null;
  telefono?:        string | null;
  ciudad?:          string | null;
  etapa_pipeline?:  string | null;
  estado_lead?:     string | null;
  extra?:           string; // info contextual: "Score: 95", "Sin contacto: 30d", etc.
}

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta",
  negociacion:       "Negociación",
  cerrado_ganado:    "Cerrado",
  perdido:           "Perdido",
};

interface Props {
  titulo:     string;
  subtitulo?: string;
  leads:      LeadDrilldown[];
  cargando?:  boolean;
  onCerrar:   () => void;
}

export function DrilldownModal({ titulo, subtitulo, leads, cargando, onCerrar }: Props) {
  const [llamadaLead,    setLlamadaLead]    = useState<LeadDrilldown | null>(null);
  const [prospectoVer,   setProspectoVer]   = useState<Prospecto | null>(null);
  const [prospectoEditar,setProspectoEditar]= useState<Prospecto | null>(null);
  const [cargandoFicha,  setCargandoFicha]  = useState<string | null>(null);

  async function abrirFicha(lead: LeadDrilldown) {
    setCargandoFicha(lead.id);
    try {
      const p = await getProspecto(lead.id);
      setProspectoVer(p);
    } catch { /* silencioso */ }
    finally { setCargandoFicha(null); }
  }

  return (
    <>
      {/* Overlay principal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCerrar} />
        <div className={`${MODAL_BASE} relative w-full max-w-lg max-h-[80vh] flex flex-col`}>

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
            <div>
              <p className="text-sm font-semibold text-zinc-100">{titulo}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {cargando ? "Cargando..." : subtitulo ?? `${leads.length} empresa${leads.length !== 1 ? "s" : ""} · toca el teléfono para llamar`}
              </p>
            </div>
            <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-zinc-800 transition">
              <X size={16} className="text-zinc-400" />
            </button>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cargando ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              </div>
            ) : leads.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">Sin empresas en esta categoría</p>
            ) : leads.map(lead => (
              <div
                key={lead.id}
                className="p-3 rounded-xl border border-white/8 hover:border-brand/20 hover:bg-zinc-800/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Info empresa */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{lead.empresa}</p>
                    {lead.nombre_contacto && (
                      <p className="text-xs text-zinc-400 mt-0.5">{lead.nombre_contacto}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {lead.ciudad && (
                        <span className="text-[10px] text-zinc-500">{lead.ciudad}</span>
                      )}
                      {lead.etapa_pipeline && (
                        <span className={`${BADGE_BASE} text-[10px] font-medium px-1.5 py-0.5 text-zinc-300`}>
                          {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline.replace(/_/g," ")}
                        </span>
                      )}
                      {lead.extra && (
                        <span className="text-[10px] text-zinc-500 italic">{lead.extra}</span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Ver ficha */}
                    <button
                      onClick={() => abrirFicha(lead)}
                      disabled={cargandoFicha === lead.id}
                      className="p-2 rounded-lg border border-white/10 hover:bg-zinc-800 transition"
                      title="Ver ficha completa"
                    >
                      {cargandoFicha === lead.id
                        ? <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                        : <ExternalLink size={13} className="text-zinc-400" />
                      }
                    </button>

                    {/* Registrar llamada */}
                    <button
                      onClick={() => setLlamadaLead(lead)}
                      className="p-2 rounded-lg border border-white/10 hover:bg-zinc-800 transition"
                      title="Registrar llamada"
                    >
                      <PhoneCall size={13} className="text-zinc-400" />
                    </button>

                    {/* Llamar directo */}
                    {lead.telefono && (
                      <a
                        href={`tel:${lead.telefono}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition hover:opacity-90"
                        style={{ backgroundColor: COLORS.dark }}
                        title={lead.telefono}
                      >
                        <Phone size={12} />
                        {lead.telefono}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LlamadaForm pre-cargado */}
      {llamadaLead && (
        <LlamadaForm
          abierto
          prospectoId={llamadaLead.id}
          onCerrar={() => setLlamadaLead(null)}
          onGuardado={() => setLlamadaLead(null)}
        />
      )}

      {/* Ficha del prospecto */}
      {prospectoVer && (
        <ProspectoDetalle
          prospecto={prospectoVer}
          onCerrar={() => setProspectoVer(null)}
          onEditar={() => { setProspectoEditar(prospectoVer); setProspectoVer(null); }}
        />
      )}

      {/* Editar prospecto inline */}
      {prospectoEditar && (
        <ProspectoForm
          prospecto={prospectoEditar}
          onCerrar={() => setProspectoEditar(null)}
          onGuardado={() => setProspectoEditar(null)}
        />
      )}
    </>
  );
}
