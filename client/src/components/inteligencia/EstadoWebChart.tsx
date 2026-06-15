/** client/src/components/inteligencia/EstadoWebChart.tsx — NEON
 * Antes: WEB_CFG/LEAD_CFG/PRIO_CFG/URGENCIA_CLS en bg-*-100/bg-*-50 (tema claro), modal con
 * inputs border-gray-200 + focus:ring-brand, teléfono bg-green-100, botones bg-zinc-800/bg-brand,
 * tabla thead text-zinc-100 lavado + typo hover:bg-white/8/5/60, barras bg-zinc-800, skeleton
 * bg-zinc-800. Ahora: chips/badges translúcidos neon, modal neon-input, tabla neon. Lógica INTACTA.
 */
import { useEffect, useState } from "react";
import { Globe, ExternalLink, Phone, Check, X } from "lucide-react";
import { fechaHoy } from "../../utils/date";
import { NeonDonut } from "../ui/NeonDonut";
import { CARD_CLASS, HEADER_CLASS, PANEL_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { getEstadoWebDistribucion } from "../../services/prospectos.api";
import { crearLlamada } from "../../services/llamadas.api";
import type { EstadoWebItem, EstadoWebProspecto } from "../../services/prospectos.api";
import { Modal } from "../ui/Modal";

// chip translúcido: {color, bg, border}
function chip(hex: string) {
  return `text-[${hex}]`; // placeholder, usamos style inline abajo
}

const WEB_CFG: Record<string, { label: string; color: string }> = {
  actualizada:      { label: "Actualizada",      color: "#34d399" },
  por_actualizar:   { label: "Por actualizar",   color: "#fbbf24" },
  vencida:          { label: "Vencida",          color: "#f87171" },
  en_mantenimiento: { label: "En mantenimiento", color: "#60a5fa" },
  sin_informacion:  { label: "Sin información",  color: "#a1a1aa" },
};

const LEAD_CFG: Record<string, { label: string; hex: string }> = {
  nuevo:               { label: "Nuevo",            hex: "#a1a1aa" },
  por_gestionar:       { label: "Por gestionar",    hex: "#a1a1aa" },
  interesado:          { label: "Interesado",       hex: "var(--accent)" },
  solicita_informacion:{ label: "Solicita info",    hex: "var(--accent)" },
  volver_a_llamar:     { label: "Volver a llamar",     hex: "#60a5fa" },
  ocupado_en_reunion:  { label: "Ocupado / En reunión", hex: "#fbbf24" },
  prometio_llamar:     { label: "Prometió llamar",      hex: "#a855f7" },
  no_contesta:         { label: "No contesta",          hex: "#fbbf24" },
  buzon_de_voz:        { label: "Buzón de voz",     hex: "#fbbf24" },
  fuera_de_servicio:   { label: "Fuera servicio",   hex: "#fbbf24" },
  numero_equivocado:   { label: "Nro equivocado",   hex: "#a1a1aa" },
  no_interesado:       { label: "No interesado",    hex: "#f87171" },
  ya_tiene_proveedor:  { label: "Ya tiene prov.",   hex: "#f87171" },
  baja_de_oficio:      { label: "Baja de oficio",   hex: "#f87171" },
};

const PRIO_CFG: Record<string, { label: string; hex: string }> = {
  alta:  { label: "Alta",  hex: "#f87171" },
  media: { label: "Media", hex: "#a1a1aa" },
  baja:  { label: "Baja",  hex: "#71717a" },
};

const hx = (h: string) => h === "var(--accent)" ? "rgb(var(--accent))" : h;
function chipStyle(hex: string): React.CSSProperties {
  const c = hx(hex);
  return { color: c, background: hex === "var(--accent)" ? "rgb(var(--accent) / 0.15)" : `${hex}1a`, border: `1px solid ${c}38` };
}

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

const URGENCIA_HEX: Record<Urgencia, string> = { alta: "#f87171", media: "#fbbf24", baja: "#a1a1aa" };

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

  const cls = "neon-input w-full px-3 py-2 text-xs";

  async function handleGuardar() {
    setLoading(true);
    setError(null);
    try {
      const fechaISO = canal === "llamada"
        ? `${fecha}T${horaInicio}:00.000Z`
        : `${fecha}T12:00:00.000Z`;
      await crearLlamada({
        prospecto_id: prospecto.id, canal, contestada,
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
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.35)" }}>
            <Check size={20} className="text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-200">Llamada registrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prospecto.nombre_contacto && (
            <div className={`${PANEL_BASE} px-4 py-3 text-xs text-zinc-400 space-y-0.5`}>
              <p className="font-semibold text-zinc-200">{prospecto.nombre_contacto}</p>
              {prospecto.telefono && (
                <a href={`tel:${prospecto.telefono}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ color: "#34d399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)" }}
                  title="Llamar">
                  <Phone size={11} /> {prospecto.telefono}
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={cls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Canal</label>
              <select value={canal} onChange={e => setCanal(e.target.value)} className={cls}>
                {CANALES_WEB.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
          </div>

          {canal === "llamada" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Hora inicio</label>
                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={cls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Hora fin <span className="text-zinc-500">(opcional)</span></label>
                <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} className={cls} />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Resultado</label>
            <select value={resultado} onChange={e => setResultado(e.target.value)} className={cls}>
              <option value="">Sin resultado</option>
              {RESULTADOS_WEB.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={contestada} onChange={e => setContestada(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--accent-hex)]" style={{ accentColor: "rgb(var(--accent))" }} />
            <span className="text-xs text-zinc-400">¿Fue contestada?</span>
          </label>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Notas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder="Observaciones de la llamada..."
              className={`${cls} resize-none`} />
          </div>

          {error && <p className="text-xs text-red-300 px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)" }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onCerrar}
              className="flex-1 px-4 py-2 text-xs font-medium text-zinc-300 border border-white/10 hover:bg-white/5 rounded-lg transition">
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={loading}
              className="btn-primary flex-1 px-4 py-2 text-xs font-medium rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5">
              <Phone size={12} />
              {loading ? "Guardando..." : "Registrar llamada"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function EstadoWebChart() {
  const c = useChartColors();
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
        color: WEB_CFG[d.estado_web]?.color ?? c.muted,
      }))
    : [{ name: "Sin datos", value: 1, color: c.grid }];

  if (cargando) {
    return (
      <div className={CARD_CLASS}>
        <div className="animate-pulse h-40 bg-white/[0.05] rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <div className={`${CARD_CLASS} space-y-5`}>
        <h2 className={HEADER_CLASS}>
          <Globe size={14} className="mr-2.5 text-cyan-400" strokeWidth={2} />
          Estado de páginas web
        </h2>

        {total === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-8">
            No hay prospectos con web activa registrados aún.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-6">
              <NeonDonut
                data={datosGrafico.map((d) => ({ label: d.name, value: d.value, color: d.color }))}
                size={128}
                centerValue={total}
                centerLabel="con web"
              />

              <div className="flex-1 space-y-2.5">
                {distribucion.map(d => {
                  const cfg = WEB_CFG[d.estado_web] ?? WEB_CFG.sin_informacion;
                  const pct = Math.round((d.total / total) * 100);
                  return (
                    <div key={d.estado_web}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={chipStyle(cfg.color)}>
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-zinc-100">{d.total}</span>
                          <span className="text-[10px] text-zinc-500">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/[0.06] rounded-full h-1">
                        <div className="h-1 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {prospectos.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                  Oportunidades de contacto ({prospectos.length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        {["Empresa","Estado web","Lead","Prioridad"].map(h => (
                          <th key={h} className="text-left text-[10px] text-zinc-500 font-semibold uppercase tracking-wider pb-2 pr-3">{h}</th>
                        ))}
                        <th className="text-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider pb-2 pr-3">Contestó</th>
                        <th className="text-left text-[10px] text-zinc-500 font-semibold uppercase tracking-wider pb-2 pr-3">Acción sugerida</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {prospectos.map(p => {
                        const webCfg   = WEB_CFG[p.estado_web]   ?? WEB_CFG.sin_informacion;
                        const leadCfg  = LEAD_CFG[p.estado_lead ?? "por_gestionar"] ?? LEAD_CFG.por_gestionar;
                        const prioCfg  = PRIO_CFG[p.prioridad   ?? "media"]         ?? PRIO_CFG.media;
                        const accion   = accionSugerida(p);
                        return (
                          <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-2 pr-3">
                              <p className="font-medium text-zinc-200 truncate max-w-[150px]">{p.empresa}</p>
                              {p.nombre_contacto && (
                                <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{p.nombre_contacto}</p>
                              )}
                            </td>
                            <td className="py-2 pr-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={chipStyle(webCfg.color)}>
                                {webCfg.label}
                              </span>
                            </td>
                            <td className="py-2 pr-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={chipStyle(leadCfg.hex)}>
                                {leadCfg.label}
                              </span>
                            </td>
                            <td className="py-2 pr-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={chipStyle(prioCfg.hex)}>
                                {prioCfg.label}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-center">
                              {p.contesto === null ? (
                                <span className="text-[10px] text-zinc-500">—</span>
                              ) : p.contesto ? (
                                <Check size={13} className="text-emerald-400 mx-auto" />
                              ) : (
                                <X size={13} className="text-red-400 mx-auto" />
                              )}
                            </td>
                            <td className="py-2 pr-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={chipStyle(URGENCIA_HEX[accion.urgencia])}>
                                {accion.texto}
                              </span>
                            </td>
                            <td className="py-2 pl-1">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setLlamandoA(p)} title="Registrar llamada"
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-accent-10 transition">
                                  <Phone size={13} />
                                </button>
                                {p.pagina_web && (
                                  <a href={p.pagina_web.startsWith("http") ? p.pagina_web : `https://${p.pagina_web}`}
                                    target="_blank" rel="noreferrer" title="Ver web"
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-accent-10 transition">
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