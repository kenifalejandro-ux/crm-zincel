/** client/src/components/inteligencia/EstadoWebChart.tsx */
import { useEffect, useState } from "react";
import { Globe, ExternalLink, Phone, Check, X } from "lucide-react";
import { fechaHoy } from "../../utils/date";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import { getEstadoWebDistribucion } from "../../services/prospectos.api";
import { crearLlamada } from "../../services/llamadas.api";
import type { EstadoWebItem, EstadoWebProspecto } from "../../services/prospectos.api";
import { Modal } from "../ui/Modal";

// ── Config visual ─────────────────────────────────────────────────────────────

const WEB_CFG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  actualizada:      { label: "Actualizada",      color: "#4ade80", bg: "bg-green-100",  text: "text-green-700"  },
  por_actualizar:   { label: "Por actualizar",   color: "#fbbf24", bg: "bg-yellow-100", text: "text-yellow-700" },
  vencida:          { label: "Vencida",          color: "#f87171", bg: "bg-red-100",    text: "text-red-700"    },
  en_mantenimiento: { label: "En mantenimiento", color: "#60a5fa", bg: "bg-blue-100",   text: "text-blue-700"   },
  sin_informacion:  { label: "Sin información",  color: COLORS.surface, bg: "bg-zinc-100", text: "text-zinc-500" },
};

const LEAD_CFG: Record<string, { label: string; bg: string; text: string }> = {
  nuevo:               { label: "Nuevo",            bg: "bg-zinc-100",    text: "text-zinc-600"   },
  por_gestionar:       { label: "Por gestionar",    bg: "bg-zinc-100",    text: "text-zinc-600"   },
  interesado:          { label: "Interesado",       bg: "bg-brand/10",    text: "text-brand"      },
  solicita_informacion:{ label: "Solicita info",    bg: "bg-brand/10",    text: "text-brand"      },
  volver_a_llamar:     { label: "Volver a llamar",     bg: "bg-blue-50",     text: "text-blue-600"   },
  ocupado_en_reunion:  { label: "Ocupado / En reunión", bg: "bg-yellow-50",  text: "text-yellow-700" },
  prometio_llamar:     { label: "Prometió llamar",      bg: "bg-purple-50",  text: "text-purple-700" },
  no_contesta:         { label: "No contesta",          bg: "bg-yellow-50",  text: "text-yellow-700" },
  buzon_de_voz:        { label: "Buzón de voz",     bg: "bg-yellow-50",   text: "text-yellow-700" },
  fuera_de_servicio:   { label: "Fuera servicio",   bg: "bg-yellow-50",   text: "text-yellow-700" },
  numero_equivocado:   { label: "Nro equivocado",   bg: "bg-zinc-100",    text: "text-zinc-500"   },
  no_interesado:       { label: "No interesado",    bg: "bg-red-50",      text: "text-red-600"    },
  ya_tiene_proveedor:  { label: "Ya tiene prov.",   bg: "bg-red-50",      text: "text-red-600"    },
  baja_de_oficio:      { label: "Baja de oficio",   bg: "bg-red-50",      text: "text-red-600"    },
};

const PRIO_CFG: Record<string, { label: string; bg: string; text: string }> = {
  alta:  { label: "Alta",  bg: "bg-red-50",    text: "text-red-600"  },
  media: { label: "Media", bg: "bg-zinc-100",  text: "text-zinc-600" },
  baja:  { label: "Baja",  bg: "bg-zinc-50",   text: "text-zinc-400" },
};

// ── Acción sugerida ───────────────────────────────────────────────────────────

type Urgencia = "alta" | "media" | "baja";

function accionSugerida(p: EstadoWebProspecto): { texto: string; urgencia: Urgencia } {
  const sinContacto = p.canal_llamada === null;
  const contesto    = p.contesto === true;

  if (p.estado_web === "vencida") {
    if (contesto)     return { texto: "Seguimiento caliente",      urgencia: "alta"  };
    if (!sinContacto) return { texto: "Reintentar — web vencida",  urgencia: "alta"  };
    return                   { texto: "Primer contacto urgente",   urgencia: "alta"  };
  }
  if (p.estado_web === "en_mantenimiento") {
    return contesto
      ? { texto: "Seguimiento — en mantenimiento", urgencia: "media" }
      : { texto: "Contactar — en mantenimiento",   urgencia: "media" };
  }
  if (p.estado_web === "por_actualizar") {
    return contesto
      ? { texto: "Seguimiento — por actualizar",   urgencia: "media" }
      : { texto: "Contactar — necesita actualizar", urgencia: "media" };
  }
  return sinContacto
    ? { texto: "Primer contacto — detectar web", urgencia: "baja" }
    : { texto: "Verificar estado web",            urgencia: "baja" };
}

const URGENCIA_CLS: Record<Urgencia, string> = {
  alta:  "bg-red-50 text-red-700",
  media: "bg-yellow-50 text-yellow-700",
  baja:  "bg-zinc-100 text-zinc-500",
};

// ── Helpers de fecha/hora ─────────────────────────────────────────────────────

const getNowTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
};

const CANALES_WEB    = ["llamada", "whatsapp", "correo", "linkedin", "instagram", "facebook"];
const RESULTADOS_WEB = [
  { value: "interesado",          label: "Interesado" },
  { value: "solicita_informacion", label: "Solicita información" },
  { value: "no_interesado",       label: "No interesado" },
  { value: "no_contesta",         label: "No contesta" },
  { value: "volver_a_llamar",     label: "Volver a llamar" },
  { value: "ocupado_en_reunion",  label: "Ocupado / En reunión" },
  { value: "prometio_llamar",     label: "Prometió llamar" },
  { value: "buzon_de_voz",        label: "Buzón de voz" },
  { value: "fuera_de_servicio",   label: "Fuera de servicio" },
  { value: "numero_equivocado",   label: "Número equivocado" },
  { value: "ya_tiene_proveedor",  label: "Empresa con página web" },
  { value: "baja_de_oficio",      label: "Baja de oficio" },
  { value: "suspension_temporal", label: "Suspensión temporal" },
];

// ── Modal registrar llamada ───────────────────────────────────────────────────

interface RegistrarLlamadaModalProps {
  prospecto: EstadoWebProspecto;
  onCerrar: () => void;
  onGuardado: () => void;
}

function RegistrarLlamadaModal({ prospecto, onCerrar, onGuardado }: RegistrarLlamadaModalProps) {
  const [fecha,      setFecha]      = useState(fechaHoy());
  const [horaInicio, setHoraInicio] = useState(getNowTime());
  const [horaFin,    setHoraFin]    = useState("");
  const [canal,      setCanal]      = useState("llamada");
  const [resultado,  setResultado]  = useState("");
  const [contestada, setContestada] = useState(false);
  const [notas,      setNotas]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [guardado,   setGuardado]   = useState(false);

  const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50";

  async function handleGuardar() {
    setLoading(true);
    setError(null);
    try {
      const fechaISO = canal === "llamada"
        ? `${fecha}T${horaInicio}:00.000Z`
        : `${fecha}T12:00:00.000Z`;
      await crearLlamada({
        prospecto_id: prospecto.id,
        canal,
        contestada,
        resultado:    resultado || undefined,
        notas:        notas.trim() || undefined,
        fecha:        fechaISO,
        hora_fin:     canal === "llamada" ? (horaFin || undefined) : undefined,
      });
      setGuardado(true);
      setTimeout(() => { onGuardado(); onCerrar(); }, 900);
    } catch {
      setError("No se pudo registrar la llamada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Registrar llamada — ${prospecto.empresa}`} size="sm">
      {guardado ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
            <Check size={20} className="text-zinc-700" />
          </div>
          <p className="text-sm font-semibold text-zinc-800">Llamada registrada</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Contacto */}
          {prospecto.nombre_contacto && (
            <div className="bg-zinc-50 rounded-xl px-4 py-3 text-xs text-zinc-600 space-y-0.5">
              <p className="font-semibold text-zinc-800">{prospecto.nombre_contacto}</p>
              {prospecto.telefono && (
                <a href={`tel:${prospecto.telefono}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-xs font-medium"
                  title="Llamar">
                  <Phone size={11} /> {prospecto.telefono}
                </a>
              )}
            </div>
          )}

          {/* Fecha + Canal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={cls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Canal</label>
              <select value={canal} onChange={e => setCanal(e.target.value)} className={cls}>
                {CANALES_WEB.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
          </div>

          {/* Hora inicio + fin — solo para Llamada */}
          {canal === "llamada" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Hora inicio</label>
                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={cls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Hora fin <span className="text-gray-400">(opcional)</span></label>
                <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} className={cls} />
              </div>
            </div>
          )}

          {/* Resultado */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Resultado</label>
            <select value={resultado} onChange={e => setResultado(e.target.value)} className={cls}>
              <option value="">Sin resultado</option>
              {RESULTADOS_WEB.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Contestada */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={contestada} onChange={e => setContestada(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-brand/50" />
            <span className="text-xs text-gray-700">¿Fue contestada?</span>
          </label>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Notas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder="Observaciones de la llamada..."
              className={`${cls} resize-none`} />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onCerrar}
              className="flex-1 px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition">
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={loading}
              className="flex-1 px-4 py-2 text-xs font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-1.5">
              <Phone size={12} />
              {loading ? "Guardando..." : "Registrar llamada"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function EstadoWebChart() {
  const [distribucion, setDistribucion] = useState<EstadoWebItem[]>([]);
  const [prospectos,   setProspectos]   = useState<EstadoWebProspecto[]>([]);
  const [cargando,     setCargando]     = useState(true);
  const [llamandoA,    setLlamandoA]    = useState<EstadoWebProspecto | null>(null);

  const cargarDatos = () => {
    setCargando(true);
    getEstadoWebDistribucion()
      .then(d => { setDistribucion(d.distribucion); setProspectos(d.prospectos); })
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargarDatos(); }, []);

  const total = distribucion.reduce((s, d) => s + d.total, 0);

  const datosGrafico = distribucion.length > 0
    ? distribucion.map(d => ({
        name:  WEB_CFG[d.estado_web]?.label ?? d.estado_web,
        value: d.total,
        color: WEB_CFG[d.estado_web]?.color ?? COLORS.muted,
      }))
    : [{ name: "Sin datos", value: 1, color: COLORS.surface }];

  if (cargando) {
    return (
      <div className={CARD_CLASS}>
        <div className="animate-pulse h-40 bg-zinc-100 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <div className={`${CARD_CLASS} space-y-5`}>
        <h2 className={HEADER_CLASS}>
          <Globe size={14} className="mr-2.5 text-cyan-500" strokeWidth={2} />
          Estado de páginas web
        </h2>

        {total === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">
            No hay prospectos con web activa registrados aún.
          </p>
        ) : (
          <>
            {/* Donut + leyenda */}
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={datosGrafico} cx="50%" cy="50%"
                      innerRadius={38} outerRadius={54} paddingAngle={3}
                      dataKey="value" stroke="none">
                      {datosGrafico.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value}`, name]}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-900 leading-none">{total}</span>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">con web</span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5">
                {distribucion.map(d => {
                  const cfg = WEB_CFG[d.estado_web] ?? WEB_CFG.sin_informacion;
                  const pct = Math.round((d.total / total) * 100);
                  return (
                    <div key={d.estado_web}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-zinc-900">{d.total}</span>
                          <span className="text-[10px] text-zinc-400">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1">
                        <div className="h-1 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabla de oportunidades */}
            {prospectos.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Oportunidades de contacto ({prospectos.length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="text-left text-[10px] text-zinc-400 font-semibold uppercase tracking-wider pb-2 pr-3">Empresa</th>
                        <th className="text-left text-[10px] text-zinc-400 font-semibold uppercase tracking-wider pb-2 pr-3">Estado web</th>
                        <th className="text-left text-[10px] text-zinc-400 font-semibold uppercase tracking-wider pb-2 pr-3">Lead</th>
                        <th className="text-left text-[10px] text-zinc-400 font-semibold uppercase tracking-wider pb-2 pr-3">Prioridad</th>
                        <th className="text-center text-[10px] text-zinc-400 font-semibold uppercase tracking-wider pb-2 pr-3">Contestó</th>
                        <th className="text-left text-[10px] text-zinc-400 font-semibold uppercase tracking-wider pb-2 pr-3">Acción sugerida</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {prospectos.map(p => {
                        const webCfg   = WEB_CFG[p.estado_web]   ?? WEB_CFG.sin_informacion;
                        const leadCfg  = LEAD_CFG[p.estado_lead ?? "por_gestionar"] ?? LEAD_CFG.por_gestionar;
                        const prioCfg  = PRIO_CFG[p.prioridad   ?? "media"]         ?? PRIO_CFG.media;
                        const accion   = accionSugerida(p);
                        return (
                          <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">

                            {/* Empresa */}
                            <td className="py-2 pr-3">
                              <p className="font-medium text-zinc-800 truncate max-w-[150px]">{p.empresa}</p>
                              {p.nombre_contacto && (
                                <p className="text-[10px] text-zinc-400 truncate max-w-[150px]">{p.nombre_contacto}</p>
                              )}
                            </td>

                            {/* Estado web */}
                            <td className="py-2 pr-3">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${webCfg.bg} ${webCfg.text}`}>
                                {webCfg.label}
                              </span>
                            </td>

                            {/* Lead */}
                            <td className="py-2 pr-3">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${leadCfg.bg} ${leadCfg.text}`}>
                                {leadCfg.label}
                              </span>
                            </td>

                            {/* Prioridad */}
                            <td className="py-2 pr-3">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${prioCfg.bg} ${prioCfg.text}`}>
                                {prioCfg.label}
                              </span>
                            </td>

                            {/* Contestó */}
                            <td className="py-2 pr-3 text-center">
                              {p.contesto === null ? (
                                <span className="text-[10px] text-zinc-300">—</span>
                              ) : p.contesto ? (
                                <Check size={13} className="text-zinc-600 mx-auto" />
                              ) : (
                                <X size={13} className="text-zinc-400 mx-auto" />
                              )}
                            </td>

                            {/* Acción */}
                            <td className="py-2 pr-3">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${URGENCIA_CLS[accion.urgencia]}`}>
                                {accion.texto}
                              </span>
                            </td>

                            {/* Botones */}
                            <td className="py-2 pl-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setLlamandoA(p)}
                                  title="Registrar llamada"
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-brand/10 transition"
                                >
                                  <Phone size={13} />
                                </button>
                                {p.pagina_web && (
                                  <a
                                    href={p.pagina_web.startsWith("http") ? p.pagina_web : `https://${p.pagina_web}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Ver web"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-brand/10 transition"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {llamandoA && (
        <RegistrarLlamadaModal
          prospecto={llamandoA}
          onCerrar={() => setLlamandoA(null)}
          onGuardado={cargarDatos}
        />
      )}
    </>
  );
}
