/** client/src/components/inteligencia/PrioridadOperacional.tsx */

import { useState } from "react";
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import { useNavigate } from "react-router-dom";
import { X, Phone, Building2, MapPin, ChevronRight, Loader2, Flame, PhoneCall, PhoneOff, SkipForward, CheckCircle2 } from "lucide-react";
import type { AccionPrioridad, LeadPrioridad } from "../../services/inteligencia.api";
import { getLeadsPrioridad } from "../../services/inteligencia.api";
import { getProspecto } from "../../services/prospectos.api";
import { crearLlamada } from "../../services/llamadas.api";
import { ProspectoDetalle } from "../prospectos/ProspectoDetalle";
import { ProspectoForm }   from "../prospectos/ProspectoForm";
import { LlamadaForm } from "../llamadas/LlamadaForm";
import type { Prospecto } from "../../types/prospecto.types";

function horaActual() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
}
function fechaHoy() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

const NIVEL_STYLE = {
  critica:   { badge: "bg-red-100 text-red-700",    borde: "border-red-200",    bg: "bg-red-50"    },
  urgente:   { badge: "bg-amber-100 text-amber-700", borde: "border-amber-200", bg: "bg-amber-50"  },
  pendiente: { badge: "bg-zinc-100 text-zinc-600",   borde: "border-zinc-200",  bg: "bg-zinc-50"   },
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

  // Modal de lista
  const [accionActiva,    setAccionActiva]    = useState<AccionPrioridad | null>(null);
  const [leads,           setLeads]           = useState<LeadPrioridad[]>([]);
  const [cargandoLeads,   setCargandoLeads]   = useState(false);
  const [prospectoDetalle,setProspectoDetalle]= useState<Prospecto | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState<string | null>(null);
  const [prospectoEditar,  setProspectoEditar]  = useState<Prospecto | null>(null);

  // Cola de llamadas
  const [colaActiva,    setColaActiva]    = useState(false);
  const [colaIndex,     setColaIndex]     = useState(0);
  const [registrando,   setRegistrando]   = useState(false);
  const [colaStats,     setColaStats]     = useState({ registradas: 0, contestadas: 0, saltadas: 0 });

  // Modal de registro (se abre al marcar "Contestó")
  const [showRegistrar, setShowRegistrar] = useState(false);

  const abrirModal = async (acc: AccionPrioridad) => {
    setAccionActiva(acc);
    setLeads([]);
    setColaActiva(false);
    setColaIndex(0);
    setColaStats({ registradas: 0, contestadas: 0, saltadas: 0 });
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

  const cerrarModal   = () => { setAccionActiva(null); setLeads([]); setColaActiva(false); };
  const cerrarDetalle = () => setProspectoDetalle(null);

  const iniciarCola = () => {
    setColaActiva(true);
    setColaIndex(0);
    setColaStats({ registradas: 0, contestadas: 0, saltadas: 0 });
  };

  // "Contestó" → abre LlamadaForm (oscuro, reutilizable)
  const abrirRegistro = () => setShowRegistrar(true);

  // Callback tras guardar en LlamadaForm — avanza al siguiente lead
  const onRegistroGuardado = () => {
    setColaStats(s => ({ ...s, registradas: s.registradas + 1, contestadas: s.contestadas + 1 }));
    setShowRegistrar(false);
    setColaIndex(i => i + 1);
  };

  // "No contestó" → guarda automáticamente sin abrir nada
  const noContesto = async () => {
    const lead = leads[colaIndex];
    if (!lead) return;
    setRegistrando(true);
    try {
      await crearLlamada({
        prospecto_id: lead.id,
        fecha:        fechaHoy(),
        canal:        "llamada",
        contestada:   false,
      });
      setColaStats(s => ({ ...s, registradas: s.registradas + 1 }));
    } catch { /* silencioso */ }
    finally { setRegistrando(false); }
    setColaIndex(i => i + 1);
  };

  // "Saltar" → avanza sin registrar
  const saltarLead = () => {
    setColaStats(s => ({ ...s, saltadas: s.saltadas + 1 }));
    setColaIndex(i => i + 1);
  };

  if (!acciones.length) return (
    <div className={CARD_CLASS}>
      <div className="flex items-center gap-2 mb-2">
        <Flame size={16} className="text-orange-500" />
        <h3 className={HEADER_CLASS}>Prioridad operacional</h3>
      </div>
      <div className="flex items-center justify-center py-6 text-xs text-emerald-600 font-medium gap-2">
        <span>✅</span> Todo al día — no hay acciones urgentes pendientes
      </div>
    </div>
  );

  const criticas = acciones.filter(a => a.nivel === "critica");
  const urgentes = acciones.filter(a => a.nivel === "urgente");
  const leadActual = leads[colaIndex];
  const colaTerminada = colaActiva && colaIndex >= leads.length;
  const pctCola = leads.length > 0 ? Math.round((colaIndex / leads.length) * 100) : 0;

  return (
    <>
      {/* ── Lista de acciones ── */}
      <div className={`${CARD_CLASS} space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <div>
              <h3 className={HEADER_CLASS}>Haz esto primero</h3>
              <p className="text-xs text-zinc-600 mt-0.5">Acciones ordenadas por impacto en ventas</p>
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
                <div className="shrink-0 w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold text-zinc-700 mt-0.5">
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
                      {acc.cantidad} <ChevronRight size={12} className="text-zinc-600" />
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">{acc.descripcion}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Modal: lista de leads / cola de llamadas ── */}
      {accionActiva && !prospectoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

            {/* Header */}
            <div className={`flex items-center justify-between p-5 rounded-t-2xl border-b ${NIVEL_STYLE[accionActiva.nivel].bg} ${NIVEL_STYLE[accionActiva.nivel].borde}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{accionActiva.icono}</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    {colaActiva ? "Cola de llamadas" : accionActiva.titulo}
                  </p>
                  <p className="text-xs text-zinc-700 mt-0.5">
                    {colaActiva
                      ? `${Math.min(colaIndex + 1, leads.length)} / ${leads.length} leads`
                      : `${accionActiva.cantidad} leads · clic para gestionar`}
                  </p>
                </div>
              </div>
              <button onClick={cerrarModal} className="p-1.5 rounded-lg hover:bg-black/10 transition">
                <X size={16} className="text-zinc-700" />
              </button>
            </div>

            {/* ── VISTA: Lista normal ── */}
            {!colaActiva && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {cargandoLeads ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                    </div>
                  ) : leads.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-8">Sin leads disponibles</p>
                  ) : (
                    leads.map(lead => (
                      <button key={lead.id} onClick={() => abrirDetalle(lead)}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand/30 hover:bg-brand/5 transition group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Building2 size={11} className="text-zinc-600 shrink-0" />
                            <p className="text-xs font-semibold text-zinc-800 truncate">{lead.empresa}</p>
                          </div>
                          <p className="text-[11px] text-zinc-700 truncate">{lead.nombre_contacto}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {lead.telefono && (
                              <a href={`tel:${lead.telefono}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-[10px] font-medium"
                                onClick={e => e.stopPropagation()}
                                title="Llamar">
                                <Phone size={9} /> {lead.telefono}
                              </a>
                            )}
                            {lead.ciudad && (
                              <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                                <MapPin size={9} /> {lead.ciudad}
                              </span>
                            )}
                            <span className="text-[10px] text-brand font-medium capitalize">
                              {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}
                            </span>
                          </div>
                        </div>
                        {cargandoDetalle === lead.id
                          ? <Loader2 size={14} className="shrink-0 text-blue-500 animate-spin" />
                          : <ChevronRight size={14} className="shrink-0 text-zinc-700 group-hover:text-brand transition" />
                        }
                      </button>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 space-y-2">
                  {!cargandoLeads && leads.length > 0 && (
                    <button
                      onClick={iniciarCola}
                      className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition flex items-center justify-center gap-2"
                      style={{ backgroundColor: COLORS.dark }}
                    >
                      <PhoneCall size={14} />
                      Iniciar cola de llamadas · {leads.length} leads
                    </button>
                  )}
                  <button
                    onClick={() => { navigate("/prospectos"); cerrarModal(); }}
                    className="w-full py-2 text-xs font-medium text-zinc-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition"
                  >
                    Ver todos en Prospectos →
                  </button>
                </div>
              </>
            )}

            {/* ── VISTA: Cola activa — un lead a la vez ── */}
            {colaActiva && !colaTerminada && leadActual && (
              <>
                {/* Barra de progreso */}
                <div className="px-5 pt-4">
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pctCola}%`, backgroundColor: COLORS.primary }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 text-right">
                    {colaStats.registradas} registradas · {colaStats.saltadas} saltadas
                  </p>
                </div>

                {/* Lead card */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                    <Building2 size={22} className="text-zinc-600" />
                  </div>

                  <p className="text-lg font-bold text-zinc-900 leading-tight mb-1">
                    {leadActual.empresa}
                  </p>
                  <p className="text-sm text-zinc-600 mb-4">{leadActual.nombre_contacto}</p>

                  {leadActual.telefono ? (
                    <a
                      href={`tel:${leadActual.telefono}`}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm mb-4 transition hover:opacity-90"
                      style={{ backgroundColor: COLORS.primary }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Phone size={14} />
                      {leadActual.telefono}
                    </a>
                  ) : (
                    <p className="text-xs text-zinc-400 mb-4">Sin teléfono registrado</p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {leadActual.ciudad && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {leadActual.ciudad}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-zinc-100 rounded-full">
                      {ETAPA_LABEL[leadActual.etapa_pipeline] ?? leadActual.etapa_pipeline}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="p-5 border-t border-zinc-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={abrirRegistro}
                      disabled={registrando}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: COLORS.dark }}
                    >
                      <PhoneCall size={14} />
                      Contestó
                    </button>
                    <button
                      onClick={noContesto}
                      disabled={registrando}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-zinc-200 hover:bg-zinc-50 transition disabled:opacity-50 text-zinc-700"
                    >
                      {registrando ? <Loader2 size={14} className="animate-spin" /> : <PhoneOff size={14} />}
                      No contestó
                    </button>
                  </div>
                  <button
                    onClick={saltarLead}
                    disabled={registrando}
                    className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-700 flex items-center justify-center gap-1 transition"
                  >
                    <SkipForward size={12} /> Saltar este lead
                  </button>
                </div>
              </>
            )}

            {/* ── VISTA: Cola terminada — resumen ── */}
            {colaActiva && colaTerminada && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
                <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                <p className="text-lg font-bold text-zinc-900 mb-1">Sesión completada</p>
                <p className="text-sm text-zinc-500 mb-6">
                  Trabajaste {leads.length} leads de la lista
                </p>

                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                  <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-zinc-900">{colaStats.registradas}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">Registradas</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-xl font-bold" style={{ color: COLORS.dark }}>{colaStats.contestadas}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">Contestadas</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-zinc-400">{colaStats.saltadas}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">Saltadas</p>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={cerrarModal}
                    className="flex-1 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition text-zinc-600"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => { navigate("/llamadas"); cerrarModal(); }}
                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90"
                    style={{ backgroundColor: COLORS.dark }}
                  >
                    Ver llamadas →
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Ficha completa del prospecto */}
      {prospectoDetalle && (
        <ProspectoDetalle
          prospecto={prospectoDetalle}
          onCerrar={cerrarDetalle}
          onEditar={() => { setProspectoEditar(prospectoDetalle); cerrarDetalle(); }}
        />
      )}

      {/* Modal de registro oscuro — mismo que LlamadasPage y ProspectoDetalle */}
      {showRegistrar && leadActual && (
        <LlamadaForm
          abierto={showRegistrar}
          prospectoId={leadActual.id}
          onCerrar={() => setShowRegistrar(false)}
          onGuardado={onRegistroGuardado}
        />
      )}

      {/* Editar prospecto inline — sin navegar a ProspectosPage */}
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
