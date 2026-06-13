/** client/src/components/pipeline/OportunidadesKanban.tsx */

import { GLASS_BASE, BADGE_BASE, PANEL_BASE } from "../../lib/tokens";
import { useEffect, useRef, useState } from "react";
import { Phone, Building2, MapPin, TrendingUp, Trophy, AlertCircle, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { getKanbanOportunidades, actualizarPropuesta, type OportunidadKanban } from "../../services/propuestas.api";

const COLUMNAS: { key: string; label: string; color: string; dot: string }[] = [
  { key: "enviada",        label: "Enviada",        color: "border-yellow-400", dot: "bg-yellow-400" },
  { key: "en_negociacion", label: "Negociación",     color: "border-orange-400", dot: "bg-orange-400" },
  { key: "cerrada_ganada", label: "Ganada ✓",        color: "border-green-500",  dot: "bg-green-500"  },
  { key: "cerrada_perdida",label: "Perdida",         color: "border-red-400",    dot: "bg-red-400"    },
];

const SERVICIO_LABEL: Record<string, string> = {
  desarrollo_web:    "Desarrollo Web",
  wordpress:         "WordPress",
  diseño_marketing:  "Diseño & Marketing",
  redes_sociales:    "Redes Sociales",
  publicidad_digital:"Publicidad Digital",
  erp:               "ERP",
  crm:               "CRM",
  otro:              "Otro",
};

const SERVICIO_COLOR: Record<string, string> = {
  desarrollo_web:    "bg-blue-100 text-blue-700",
  wordpress:         "bg-sky-100 text-sky-700",
  diseño_marketing:  "bg-pink-100 text-pink-700",
  redes_sociales:    "bg-purple-100 text-purple-700",
  publicidad_digital:"bg-indigo-100 text-indigo-700",
  erp:               "bg-amber-100 text-amber-700",
  crm:               "bg-emerald-100 text-emerald-700",
  otro:              "bg-zinc-100 text-zinc-600",
};

function fmt(n: number) {
  if (n >= 1000) return `S/ ${(n / 1000).toFixed(1)}k`;
  return `S/ ${n.toLocaleString("es-PE")}`;
}

function nombreCorto(empresa: string): string {
  if (empresa.length <= 22) return empresa;
  const palabras = empresa.split(" ");
  let resultado = "";
  for (const p of palabras) {
    if ((resultado + " " + p).trim().length > 22) break;
    resultado = (resultado + " " + p).trim();
  }
  return resultado || empresa.slice(0, 22);
}

// ── Card expandible (igual estilo que KanbanCard de prospectos) ───────────────
function OportunidadCard({
  op,
  onDragStart,
}: {
  op: OportunidadKanban;
  onDragStart: (id: string) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const dragging = useRef(false);
  const monto    = op.estado === "cerrada_ganada" ? (op.monto_cerrado ?? op.monto_propuesto) : op.monto_propuesto;
  const montoNum = op.moneda === "USD" ? monto * op.tipo_cambio : monto;

  return (
    <div
      draggable
      onDragStart={() => { dragging.current = true; onDragStart(op.id); }}
      onDragEnd={() => setTimeout(() => { dragging.current = false; }, 100)}
      onClick={() => { if (!dragging.current) setExpandido(v => !v); }}
      className={`${GLASS_BASE} hover:shadow-md cursor-pointer transition-shadow select-none group`}
    >
      {/* Header siempre visible */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-zinc-200 truncate">{op.empresa}</p>
          {op.nombre_contacto && (
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{op.nombre_contacto}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {montoNum > 0 && <span className="text-[10px] font-semibold text-green-600">{fmt(montoNum)}</span>}
          <GripVertical size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing" />
          {expandido ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors" />}
        </div>
      </div>

      {/* Tags siempre visibles */}
      <div className="flex items-center gap-1.5 px-3 pb-2">
        <span className={`${BADGE_BASE} text-[9px] font-semibold px-1.5 py-0.5 ${SERVICIO_COLOR[op.servicio] ?? "bg-zinc-800 text-zinc-400"}`}>
          {SERVICIO_LABEL[op.servicio] ?? op.servicio}
        </span>
        {op.ciudad && <span className="text-[9px] text-zinc-400">{op.ciudad}</span>}
      </div>

      {/* Contenido expandido */}
      {expandido && (
        <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-2">

          {op.descripcion && (
            <p className="text-[11px] text-zinc-500 leading-relaxed">{op.descripcion}</p>
          )}

          {op.telefono && (
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="text-zinc-400 shrink-0" />
              <p className="text-[11px] text-zinc-400">{op.telefono}</p>
            </div>
          )}

          {/* Fechas */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: "Enviada",      val: op.fecha_propuesta },
              { label: "Negociación",  val: op.fecha_negociacion },
              { label: "Cierre",       val: op.fecha_cierre },
            ].filter(f => f.val).map(f => (
              <div key={f.label} className="bg-zinc-800/40 rounded-lg px-2 py-1">
                <p className="text-[9px] text-zinc-400">{f.label}</p>
                <p className="text-[10px] font-semibold text-zinc-300">
                  {new Date(f.val!).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                </p>
              </div>
            ))}
          </div>

          {/* Motivo pérdida */}
          {op.motivo_cierre_perdido && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-2 flex items-center gap-1.5">
              <AlertCircle size={11} className="text-red-500 shrink-0" />
              <p className="text-[11px] text-red-600">{op.motivo_cierre_perdido}</p>
            </div>
          )}

          {/* Monto cerrado si aplica */}
          {op.monto_cerrado && op.monto_cerrado > 0 && op.estado === "cerrada_ganada" && (
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-[10px] text-zinc-400">Monto cerrado</span>
              <span className="text-[11px] font-bold text-green-600">
                {fmt(op.moneda === "USD" ? op.monto_cerrado * op.tipo_cambio : op.monto_cerrado)}
              </span>
            </div>
          )}

          {op.telefono && (
            <a
              href={`tel:${op.telefono}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-700 transition mt-1"
            >
              <Phone size={11} /> Llamar
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function OportunidadesKanban() {
  const [porEstado,    setPorEstado]    = useState<Record<string, OportunidadKanban[]>>({});
  const [stats,        setStats]        = useState<{ total_activo: number; total_ganado: number } | null>(null);
  const [cargando,     setCargando]     = useState(true);
  const [dragOver,     setDragOver]     = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const { porEstado: pe, stats: s } = await getKanbanOportunidades();
      setPorEstado(pe);
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  async function handleDrop(estadoDestino: string) {
    setDragOver(null);
    const id = dragId.current;
    if (!id) return;
    dragId.current = null;

    const estadoOrigen = Object.keys(porEstado).find(k => porEstado[k].some(o => o.id === id));
    if (!estadoOrigen || estadoOrigen === estadoDestino) return;

    // Optimistic update
    setPorEstado(prev => {
      const next = structuredClone(prev);
      const op = next[estadoOrigen]?.find(o => o.id === id);
      if (!op) return prev;
      next[estadoOrigen] = next[estadoOrigen].filter(o => o.id !== id);
      op.estado = estadoDestino;
      if (!next[estadoDestino]) next[estadoDestino] = [];
      next[estadoDestino].unshift(op);
      return next;
    });

    // Actualizar stats del header en tiempo real
    const op = porEstado[estadoOrigen]?.find(o => o.id === id);
    if (op) {
      const activasKeys = new Set(["enviada", "en_negociacion"]);
      const montoActivo = op.moneda === "USD" ? op.monto_propuesto * op.tipo_cambio : op.monto_propuesto;
      const montoGanado = op.moneda === "USD"
        ? (op.monto_cerrado ?? op.monto_propuesto) * op.tipo_cambio
        : (op.monto_cerrado ?? op.monto_propuesto);
      const deltaActivo = (activasKeys.has(estadoDestino) ? montoActivo : 0) - (activasKeys.has(estadoOrigen) ? montoActivo : 0);
      const deltaGanado = (estadoDestino === "cerrada_ganada" ? montoGanado : 0) - (estadoOrigen === "cerrada_ganada" ? montoGanado : 0);
      setStats(prev => prev ? {
        total_activo: prev.total_activo + deltaActivo,
        total_ganado: prev.total_ganado + deltaGanado,
      } : null);
    }

    try {
      await actualizarPropuesta(id, { estado: estadoDestino });
    } catch {
      cargar(); // fallback
    }
  }

  // Stats por empresa y por servicio
  const todas = Object.values(porEstado).flat();
  const porEmpresa = Object.entries(
    todas.reduce((acc, op) => {
      if (!acc[op.empresa]) acc[op.empresa] = { ganadas: 0, total: 0 };
      acc[op.empresa].total++;
      if (op.estado === "cerrada_ganada") acc[op.empresa].ganadas++;
      return acc;
    }, {} as Record<string, { ganadas: number; total: number }>)
  )
    .map(([empresa, v]) => ({ empresa, ...v, tasa: Math.round((v.ganadas / v.total) * 100) }))
    .filter(e => e.total > 1)
    .sort((a, b) => b.tasa - a.tasa);

  const porServicio = Object.entries(
    todas.reduce((acc, op) => {
      const s = SERVICIO_LABEL[op.servicio] ?? op.servicio;
      if (!acc[s]) acc[s] = { ganadas: 0, total: 0 };
      acc[s].total++;
      if (op.estado === "cerrada_ganada") acc[s].ganadas++;
      return acc;
    }, {} as Record<string, { ganadas: number; total: number }>)
  )
    .map(([servicio, v]) => ({ servicio, ...v, tasa: Math.round((v.ganadas / v.total) * 100) }))
    .sort((a, b) => b.tasa - a.tasa);

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Stats globales */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 shrink-0">
          <div className={`${GLASS_BASE} p-3 text-center`}>
            <p className="text-[10px] text-zinc-100 uppercase tracking-wide">Pipeline activo</p>
            <p className="text-lg font-bold text-amber-600">{fmt(stats.total_activo)}</p>
          </div>
          <div className={`${GLASS_BASE} p-3 text-center`}>
            <p className="text-[10px] text-zinc-100 uppercase tracking-wide">Ganado total</p>
            <p className="text-lg font-bold text-green-600">{fmt(stats.total_ganado)}</p>
          </div>
          {porEmpresa[0] && (
            <div className={`${GLASS_BASE} p-3 text-center`}>
              <p className="text-[10px] text-zinc-100 uppercase tracking-wide flex items-center justify-center gap-1"><Trophy size={10} /> Mejor empresa</p>
              <p className="text-sm font-bold text-zinc-200 truncate" title={porEmpresa[0].empresa}>{nombreCorto(porEmpresa[0].empresa)}</p>
              <p className="text-[10px] text-zinc-500">{porEmpresa[0].tasa}% cierre · {porEmpresa[0].ganadas}/{porEmpresa[0].total}</p>
            </div>
          )}
          {porServicio[0] && (
            <div className={`${GLASS_BASE} p-3 text-center`}>
              <p className="text-[10px] text-zinc-100 uppercase tracking-wide flex items-center justify-center gap-1"><TrendingUp size={10} /> Mejor servicio</p>
              <p className="text-sm font-bold text-zinc-200 truncate">{porServicio[0].servicio}</p>
              <p className="text-[10px] text-zinc-500">{porServicio[0].tasa}% cierre · {porServicio[0].ganadas}/{porServicio[0].total}</p>
            </div>
          )}
        </div>
      )}

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto px-6 pb-4 flex-1">
        {COLUMNAS.map(col => {
          const ops = porEstado[col.key] ?? [];
          const totalCol = ops.reduce((s, o) => {
            const m = o.estado === "cerrada_ganada" ? (o.monto_cerrado ?? o.monto_propuesto) : o.monto_propuesto;
            return s + Number(o.moneda === "USD" ? m * o.tipo_cambio : m);
          }, 0);

          return (
            <div
              key={col.key}
              className={`${PANEL_BASE} flex flex-col shrink-0 w-72 border-t-2 ${col.color} ${dragOver === col.key ? "ring-2 ring-brand/40" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.key)}
            >
              {/* Header columna */}
              <div className="px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-zinc-200">{col.label}</span>
                  <span className={`${BADGE_BASE} text-xs text-zinc-400 px-1.5 py-0.5 font-medium`}>
                    {ops.length}
                  </span>
                </div>
                {totalCol > 0 && (
                  <span className="text-xs font-bold text-zinc-300">{fmt(totalCol)}</span>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[200px]">
                {ops.length === 0 ? (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-xl">
                    <p className="text-[11px] text-zinc-400">Arrastra aquí</p>
                  </div>
                ) : ops.map(op => (
                  <OportunidadCard
                    key={op.id}
                    op={op}
                    onDragStart={id => { dragId.current = id; }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics por empresa y servicio */}
      {(porEmpresa.length > 0 || porServicio.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 pb-6 shrink-0">

          {/* Por empresa */}
          {porEmpresa.length > 0 && (
            <div className={`${GLASS_BASE} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={13} className="text-zinc-500" />
                <p className="text-[11px] font-bold text-zinc-100 uppercase tracking-wide">Tasa de cierre por empresa</p>
              </div>
              <div className="space-y-2.5">
                {porEmpresa.map(e => (
                  <div key={e.empresa}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-zinc-300 truncate max-w-[60%]">{e.empresa}</span>
                      <span className="text-[11px] font-bold text-zinc-200">{e.tasa}% · {e.ganadas}/{e.total}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${e.tasa}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por servicio */}
          {porServicio.length > 0 && (
            <div className={`${GLASS_BASE} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-zinc-500" />
                <p className="text-[11px] font-bold text-zinc-100 uppercase tracking-wide">Tasa de cierre por servicio</p>
              </div>
              <div className="space-y-2.5">
                {porServicio.map(s => (
                  <div key={s.servicio}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-zinc-300">{s.servicio}</span>
                      <span className="text-[11px] font-bold text-zinc-200">{s.tasa}% · {s.ganadas}/{s.total}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-zinc-800 transition-all" style={{ width: `${s.tasa}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
