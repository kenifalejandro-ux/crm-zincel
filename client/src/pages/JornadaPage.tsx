/**client/src/pages/JornadaPage.tsx — REDISEÑO NEON
 * Cambios SOLO de presentación: header con kicker, selector de empresa neon (antes
 * dropdown con bg-amber-100/bg-amber-50/hover:bg-amber-50 — tema claro), fila en
 * edición neon (antes border-amber-200 bg-amber-50), acciones de fila neon (antes
 * hover:bg-blue-50/hover:bg-red-50), botón submit con acento, tarjetas resumen neon,
 * tooltip de recharts oscuro. Lógica (carga, alta/edición/borrado, semana) INTACTA.
 */
import { GLASS_BASE, BADGE_BASE, INPUT_BASE, PANEL_BASE } from "../lib/tokens";
import { NeonDonut } from "../components/ui/NeonDonut";
import { useEffect, useState, useRef } from "react";
import {
  Clock, Plus, Trash2, Edit2, Check, X,
  ChevronLeft, ChevronRight, BarChart2, Building2, Search,
} from "lucide-react";
import {
  getRegistrosJornada, getResumenJornada, getResumenSemanal,
  crearRegistroJornada, actualizarRegistroJornada, eliminarRegistroJornada,
} from "../services/jornada.api";
import { getProspectos } from "../services/prospectos.api";
import type { Prospecto } from "../types/prospecto.types";
import {
  ACTIVIDADES_JORNADA, ACTIVIDAD_LABELS, ACTIVIDAD_COLORS,
  SERVICIOS_JORNADA, SERVICIO_LABELS, SERVICIO_COLORS,
  type RegistroJornada, type ResumenJornada, type RegistroSemanal,
  type ActividadJornada, type ServicioJornada,
} from "../types/jornada.types";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";

function fechaISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function formatHoras(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm === 0 ? `${hh}h` : `${hh}h ${mm}m`;
}
function diasSemana(lunes: Date) {
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(lunes); d.setDate(d.getDate() + i); return d; });
}
function lunesDe(fecha: Date) {
  const d = new Date(fecha);
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (dow - 1)); d.setHours(0, 0, 0, 0); return d;
}
const DIA_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MES_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── Selector empresa (neon) ──────────────────────────────
function EmpresaSelector({ value, onChange, prospectos }: {
  value: string | null; onChange: (id: string | null) => void; prospectos: Prospecto[];
}) {
  const [query, setQuery]     = useState("");
  const [abierto, setAbierto] = useState(false);
  const [cursor, setCursor]   = useState(-1);
  const ref      = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const seleccionada = prospectos.find(p => p.id === value);
  const filtrados = query.trim() ? prospectos.filter(p => p.empresa.toLowerCase().includes(query.toLowerCase())) : prospectos;

  useEffect(() => {
    function click(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false); }
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);
  useEffect(() => { setCursor(-1); }, [query]);
  useEffect(() => {
    if (cursor < 0 || !listaRef.current) return;
    (listaRef.current.children[cursor] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!abierto) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, filtrados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (cursor >= 0 && filtrados[cursor]) { onChange(filtrados[cursor].id); setAbierto(false); setQuery(""); setCursor(-1); } }
    else if (e.key === "Escape") { setAbierto(false); setCursor(-1); }
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setAbierto(o => !o); setQuery(""); setCursor(-1); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs border border-white/10 rounded-lg hover:border-accent-30 bg-white/[0.04] text-left transition">
        <Building2 size={13} className="text-zinc-500 shrink-0" />
        <span className={seleccionada ? "text-zinc-200 flex-1 truncate" : "text-zinc-500 flex-1"}>
          {seleccionada ? seleccionada.empresa : "Seleccionar empresa (opcional)"}
        </span>
        {seleccionada && (
          <span onClick={e => { e.stopPropagation(); onChange(null); }} className="text-zinc-500 hover:text-zinc-300"><X size={11} /></span>
        )}
      </button>
      {abierto && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#0a101f]/97 backdrop-blur border border-white/10 rounded-xl shadow-xl overflow-hidden"
             style={{ boxShadow: "0 0 24px rgb(var(--accent) / calc(0.15*var(--glow))), 0 12px 30px rgba(0,0,0,0.6)" }}>
          <div className="p-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.04] rounded-lg">
              <Search size={12} className="text-zinc-500" />
              <input autoFocus type="text" placeholder="Buscar empresa…" value={query}
                onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
                className="flex-1 text-xs bg-transparent outline-none text-zinc-200 placeholder:text-zinc-600" />
            </div>
          </div>
          <div ref={listaRef} className="max-h-48 overflow-y-auto">
            {filtrados.length === 0
              ? <p className="px-3 py-4 text-xs text-zinc-500 text-center">Sin resultados</p>
              : filtrados.map((p, i) => (
                <button key={p.id} type="button"
                  onClick={() => { onChange(p.id); setAbierto(false); setQuery(""); setCursor(-1); }}
                  className={`w-full text-left px-3 py-2 text-xs transition ${
                    i === cursor ? "bg-accent-15 text-accent font-semibold"
                    : p.id === value ? "bg-accent-10 text-accent font-semibold"
                    : "text-zinc-300 hover:bg-white/[0.05]"
                  }`}>
                  {p.empresa}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FormState {
  fecha: string; servicio: ServicioJornada; categoria: ActividadJornada;
  descripcion: string; horas: string; prospecto_id: string | null;
}

function RegistroForm({ inicial, fechaDefault, prospectos, onGuardar, onCancelar }: {
  inicial?: Partial<FormState>; fechaDefault: string; prospectos: Prospecto[];
  onGuardar: (f: FormState) => Promise<void>; onCancelar?: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    fecha: inicial?.fecha ?? fechaDefault, servicio: inicial?.servicio ?? "desarrollo_web",
    categoria: inicial?.categoria ?? "propuesta_cotizacion", descripcion: inicial?.descripcion ?? "",
    horas: inicial?.horas ?? "", prospecto_id: inicial?.prospecto_id ?? null,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseFloat(form.horas);
    if (isNaN(h) || h <= 0 || h > 24) { setError("Horas: entre 0.5 y 24"); return; }
    setGuardando(true); setError("");
    try { await onGuardar(form); if (!inicial) setForm(f => ({ ...f, descripcion: "", horas: "", prospecto_id: null })); }
    catch { setError("Error al guardar"); }
    finally { setGuardando(false); }
  }

  const inp = `${INPUT_BASE} w-full px-3 py-2 text-xs`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Fecha</label>
          <input type="date" value={form.fecha} max={fechaISO(new Date())}
            onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} required />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Horas</label>
          <input type="number" step="0.5" min="0.5" max="24" placeholder="ej. 2.5"
            value={form.horas} onChange={e => setForm(f => ({ ...f, horas: e.target.value }))} className={inp} required />
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Servicio</label>
        <select value={form.servicio} onChange={e => setForm(f => ({ ...f, servicio: e.target.value as ServicioJornada }))} className={inp}>
          {SERVICIOS_JORNADA.map(s => <option key={s} value={s}>{SERVICIO_LABELS[s]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Actividad</label>
        <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as ActividadJornada }))} className={inp}>
          {ACTIVIDADES_JORNADA.map(a => <option key={a} value={a}>{ACTIVIDAD_LABELS[a]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Empresa</label>
        <EmpresaSelector value={form.prospecto_id} prospectos={prospectos} onChange={id => setForm(f => ({ ...f, prospecto_id: id }))} />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Descripción <span className="text-zinc-600">(opcional)</span></label>
        <textarea rows={2} placeholder="¿Qué hiciste exactamente?" value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={`${inp} resize-none`} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={guardando} className="btn-primary flex-1 py-2 text-xs disabled:opacity-50">
          {guardando ? "Guardando…" : inicial ? "Actualizar" : "Registrar"}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="btn-ghost px-3 py-2 text-xs text-zinc-300"><X size={14} /></button>
        )}
      </div>
    </form>
  );
}

function RegistroItem({ registro, onEliminar, onEditar }: {
  registro: RegistroJornada; prospectos: Prospecto[];
  onEliminar: (id: string) => void; onEditar: (r: RegistroJornada) => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const colorServicio  = registro.servicio  ? SERVICIO_COLORS[registro.servicio]   : "#9ca3af";
  const colorActividad = registro.categoria ? ACTIVIDAD_COLORS[registro.categoria] : "#9ca3af";

  return (
    <div className={`${PANEL_BASE} flex items-start gap-3 p-3 hover:border-accent-30 transition group`}>
      <div className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorServicio, boxShadow: `0 0 6px ${colorServicio}` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-200">{registro.servicio ? SERVICIO_LABELS[registro.servicio] : "—"}</span>
          <span className={`${BADGE_BASE} text-[10px] px-1.5 py-0.5 text-zinc-300`} style={{ borderLeft: `3px solid ${colorActividad}` }}>
            {registro.categoria ? ACTIVIDAD_LABELS[registro.categoria] : "—"}
          </span>
          <span className="text-xs font-display font-bold text-accent ml-auto tabular-nums">{formatHoras(registro.horas)}</span>
        </div>
        {registro.empresa && (
          <div className="flex items-center gap-1 mt-0.5"><Building2 size={10} className="text-zinc-500" /><span className="text-xs text-zinc-400 truncate">{registro.empresa}</span></div>
        )}
        {registro.descripcion && <p className="text-xs text-zinc-400 mt-0.5 truncate">{registro.descripcion}</p>}
        <p className="text-[10px] text-zinc-600 mt-0.5">{registro.fecha}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => onEditar(registro)} className="p-1.5 text-zinc-500 hover:text-accent hover:bg-white/5 rounded-lg transition"><Edit2 size={12} /></button>
        {confirmando ? (
          <>
            <button onClick={() => onEliminar(registro.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"><Check size={12} /></button>
            <button onClick={() => setConfirmando(false)} className="p-1.5 text-zinc-500 hover:bg-white/5 rounded-lg transition"><X size={12} /></button>
          </>
        ) : (
          <button onClick={() => setConfirmando(true)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={12} /></button>
        )}
      </div>
    </div>
  );
}

export default function JornadaPage() {
  const hoy = fechaISO(new Date());
  const [semanaBase, setSemanaBase] = useState(() => lunesDe(new Date()));
  const [fechaFiltro, setFechaFiltro] = useState(hoy);
  const [registros, setRegistros]   = useState<RegistroJornada[]>([]);
  const [resumen, setResumen]       = useState<ResumenJornada | null>(null);
  const [semanal, setSemanal]       = useState<RegistroSemanal[]>([]);
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [editando, setEditando]     = useState<RegistroJornada | null>(null);
  const [mostrarForm, setMostrarForm] = useState(true);

  useEffect(() => { cargarProspectos(); }, []);
  useEffect(() => { cargarRegistros(); }, [fechaFiltro]);

  async function cargarProspectos() {
    try {
      const res = await getProspectos({ limite: 500 });
      const lista: Prospecto[] = Array.isArray(res) ? res : (res.data ?? []);
      setProspectos(lista.sort((a, b) => a.empresa.localeCompare(b.empresa)));
    } catch {}
  }

  async function cargarRegistros() {
    setCargando(true);
    try {
      const [regs, res, sem] = await Promise.all([getRegistrosJornada({ fecha: fechaFiltro }), getResumenJornada(), getResumenSemanal()]);
      setRegistros(regs); setResumen(res); setSemanal(sem);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  }

  async function handleCrear(form: FormState) { await crearRegistroJornada({ ...form, horas: parseFloat(form.horas) }); cargarRegistros(); }
  async function handleEditar(form: FormState) {
    if (!editando) return;
    await actualizarRegistroJornada(editando.id, { ...form, horas: parseFloat(form.horas) });
    setEditando(null); cargarRegistros();
  }
  async function handleEliminar(id: string) { await eliminarRegistroJornada(id); cargarRegistros(); }

  function semanaAnterior() { const d = new Date(semanaBase); d.setDate(d.getDate() - 7); setSemanaBase(d); }
  function semanaSiguiente() { const d = new Date(semanaBase); d.setDate(d.getDate() + 7); if (d <= new Date()) setSemanaBase(d); }

  const donutServicio = (resumen?.por_servicio ?? []).map(s => ({
    name: SERVICIO_LABELS[s.servicio] ?? s.servicio, value: s.horas, color: SERVICIO_COLORS[s.servicio] ?? "#9ca3af",
  }));

  const dias = diasSemana(semanaBase);
  const barData = dias.map((d, i) => {
    const iso = fechaISO(d);
    const diaRegs = semanal.filter(r => r.fecha === iso);
    const entry: Record<string, any> = { dia: DIA_LABELS[i], fecha: iso };
    SERVICIOS_JORNADA.forEach(srv => {
      const total = diaRegs.filter(r => r.servicio === srv).reduce((s, r) => s + r.horas, 0);
      if (total > 0) entry[srv] = total;
    });
    return entry;
  });
  const serviciosEnSemana = SERVICIOS_JORNADA.filter(srv => barData.some(d => d[srv] != null));
  const totalDia = registros.reduce((s, r) => s + r.horas, 0);

  // Tarjetas resumen: Hoy (acento) · Semana (violeta) · Mes (esmeralda)
  const resumenCards = [
    { label: "Hoy",    valor: resumen?.horas_hoy    ?? 0, hex: null },
    { label: "Semana", valor: resumen?.horas_semana ?? 0, hex: "#a855f7" },
    { label: "Mes",    valor: resumen?.horas_mes    ?? 0, hex: "#34d399" },
  ];

  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Comercial</p>
        <h1 className="font-display text-[26px] font-bold text-zinc-50 tracking-tight leading-tight mt-1 flex items-center gap-2">
          <Clock size={22} className="text-accent" /> Mi Jornada
        </h1>
        <p className="text-[13px] text-zinc-500 mt-1">Registra tu tiempo productivo y visualiza cómo distribuyes tu jornada</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-4">
        {resumenCards.map(({ label, valor, hex }) => {
          const accent = hex === null;
          const color = accent ? "rgb(var(--accent))" : hex;
          return (
            <div key={label} className="neon-panel p-5 text-center"
                 style={{ borderColor: accent ? "rgb(var(--accent) / 0.3)" : `${hex}40`, background: accent ? "rgb(var(--accent) / 0.06)" : `${hex}12` }}>
              <p className="font-display text-2xl font-bold tabular-nums" style={{ color, textShadow: `0 0 12px ${accent ? "rgb(var(--accent) / calc(0.5*var(--glow)))" : hex + "66"}` }}>{formatHoras(valor)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Panel izquierdo */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${GLASS_BASE} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300">Registros</span>
                {totalDia > 0 && <span className={`${BADGE_BASE} text-xs font-display font-bold text-accent px-2 py-0.5`}>{formatHoras(totalDia)}</span>}
              </div>
              <input type="date" value={fechaFiltro} max={hoy} onChange={e => setFechaFiltro(e.target.value)} className={`${INPUT_BASE} text-xs px-2 py-1`} />
            </div>

            {cargando ? (
              <div className="text-center py-8 text-xs text-zinc-500">Cargando…</div>
            ) : registros.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">Sin registros para este día</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {registros.map(r =>
                  editando?.id === r.id ? (
                    <div key={r.id} className="rounded-xl p-3" style={{ border: "1px solid rgb(var(--accent) / 0.4)", background: "rgb(var(--accent) / 0.06)" }}>
                      <RegistroForm
                        inicial={{ fecha: r.fecha, servicio: r.servicio, categoria: r.categoria, descripcion: r.descripcion ?? "", horas: String(r.horas), prospecto_id: r.prospecto_id ?? null }}
                        fechaDefault={fechaFiltro} prospectos={prospectos} onGuardar={handleEditar} onCancelar={() => setEditando(null)} />
                    </div>
                  ) : (
                    <RegistroItem key={r.id} registro={r} prospectos={prospectos} onEliminar={handleEliminar} onEditar={setEditando} />
                  )
                )}
              </div>
            )}
          </div>

          <div className={`${GLASS_BASE} p-4`}>
            <button onClick={() => setMostrarForm(f => !f)} className="flex items-center gap-2 text-xs font-semibold text-zinc-300 w-full mb-3">
              <Plus size={14} className="text-accent" /> Nuevo registro
              <span className="ml-auto text-zinc-500">{mostrarForm ? "▲" : "▼"}</span>
            </button>
            {mostrarForm && <RegistroForm fechaDefault={fechaFiltro} prospectos={prospectos} onGuardar={handleCrear} />}
          </div>
        </div>

        {/* Gráficos */}
        <div className="lg:col-span-3 space-y-4">
          <div className={`${GLASS_BASE} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={15} className="text-accent" />
              <span className="text-xs font-semibold text-zinc-300">Horas por servicio — este mes</span>
            </div>
            {donutServicio.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-500">Sin datos aún</div>
            ) : (
              <div className="flex gap-4 items-center">
                <NeonDonut data={donutServicio.map((d) => ({ label: d.name, value: d.value, color: d.color }))} size={160} />
                <div className="flex-1 space-y-1.5">
                  {donutServicio.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                      <span className="text-xs text-zinc-400 flex-1 truncate">{d.name}</span>
                      <span className="text-xs font-display font-semibold text-zinc-200 tabular-nums">{formatHoras(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`${GLASS_BASE} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={15} className="text-violet-400" />
                <span className="text-xs font-semibold text-zinc-300">Horas por servicio — semana</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={semanaAnterior} className="p-1 hover:bg-white/5 rounded-lg transition"><ChevronLeft size={14} className="text-zinc-500" /></button>
                <span className="text-[10px] text-zinc-500 px-1">{dias[0].getDate()} {MES_LABELS[dias[0].getMonth()]} – {dias[6].getDate()} {MES_LABELS[dias[6].getMonth()]}</span>
                <button onClick={semanaSiguiente} disabled={fechaISO(dias[6]) >= hoy} className="p-1 hover:bg-white/5 rounded-lg transition disabled:opacity-30"><ChevronRight size={14} className="text-zinc-500" /></button>
              </div>
            </div>
            {serviciosEnSemana.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-500">Sin registros esta semana</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={18} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: any, name: any) => [formatHoras(Number(v)), SERVICIO_LABELS[name as ServicioJornada] ?? name]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, background: "rgba(10,16,31,0.97)", border: "1px solid rgba(255,255,255,0.1)", color: "#e4e4e7" }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend formatter={v => SERVICIO_LABELS[v as ServicioJornada] ?? v} wrapperStyle={{ fontSize: 10 }} />
                  {serviciosEnSemana.map(srv => (
                    <Bar filter="url(#neon-glow)" key={srv} dataKey={srv} stackId="a" fill={SERVICIO_COLORS[srv]}
                      radius={srv === serviciosEnSemana[serviciosEnSemana.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}