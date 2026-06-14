/** src/components/metricas/CompetidoresTab.tsx */

import { GLASS_BASE, MODAL_BASE, BADGE_BASE, INPUT_BASE, PANEL_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { useEffect, useState, useMemo } from "react";
import {
  Plus, Trash2, Loader2, TrendingUp, TrendingDown,
  Minus, ExternalLink, Users, Building2, BarChart2, Pencil, Check, X,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { Competidor, SnapshotCompetidor } from "../../types/competidores.types";
import {
  getCompetidores, agregarCompetidorManual,
  actualizarSeguidores, eliminarCompetidor, getHistoriaCompetidor,
} from "../../services/competidores.api";


function fmtNum(n: number | string | null) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function CrecBadge({ v }: { v: number | null }) {
  const val = Number(v) || 0;
  if (val > 0) return (
    <span className={`${BADGE_BASE} inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-300 px-1.5 py-0.5`}>
      <TrendingUp size={10} /> +{fmtNum(val)}
    </span>
  );
  if (val < 0) return (
    <span className={`${BADGE_BASE} inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-300 px-1.5 py-0.5`}>
      <TrendingDown size={10} /> {fmtNum(val)}
    </span>
  );
  return (
    <span className={`${BADGE_BASE} inline-flex items-center gap-0.5 text-[10px] font-semibold text-zinc-500 px-1.5 py-0.5`}>
      <Minus size={10} /> —
    </span>
  );
}

function ModalAgregar({ empresa, onAgregado, onCerrar }: {
  empresa: string;
  onAgregado: () => void;
  onCerrar: () => void;
}) {
  const [nombre,     setNombre]     = useState("");
  const [seguidores, setSeguidores] = useState("");
  const [url,        setUrl]        = useState("");
  const [guardando,  setGuardando]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleGuardar = async () => {
    if (!nombre.trim() || !seguidores.trim()) return;
    setGuardando(true); setError(null);
    try {
      await agregarCompetidorManual(empresa, nombre.trim(), Number(seguidores), url.trim() || undefined);
      onAgregado();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`${MODAL_BASE} w-full max-w-md`}>
        <div className="p-5 border-b border-white/8">
          <h3 className="text-sm font-semibold text-zinc-200">Agregar competidor</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Ingresa los datos manualmente. Actualiza los seguidores cuando quieras.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Nombre de la página *</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Grupo Caral Inmobiliaria"
              className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40`}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Seguidores actuales *</label>
            <input
              type="number"
              value={seguidores}
              onChange={e => setSeguidores(e.target.value)}
              placeholder="Ej: 12500"
              className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40`}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-1 block">URL de la página (opcional)</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://facebook.com/NombrePagina"
              className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40`}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="p-4 border-t border-white/8 flex items-center justify-end gap-2">
          <button onClick={onCerrar} className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 border border-white/10 rounded-xl transition">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !nombre.trim() || !seguidores.trim()}
            className="flex items-center gap-1.5 px-4 py-2 btn-primary text-xs rounded-xl transition disabled:opacity-50"
          >
            {guardando ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function EditSeguidores({ id, actual, onGuardado }: {
  id: string;
  actual: number;
  onGuardado: (nuevo: number) => void;
}) {
  const [valor,     setValor]     = useState(String(actual));
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const n = Number(valor);
    if (!valor || isNaN(n)) return;
    setGuardando(true);
    try {
      await actualizarSeguidores(id, n);
      onGuardado(n);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={valor}
        onChange={e => setValor(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") guardar(); if (e.key === "Escape") onGuardado(actual); }}
        className={`${INPUT_BASE} w-24 text-xs border-accent-30 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/40`}
        autoFocus
      />
      <button onClick={guardar} disabled={guardando} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition">
        {guardando ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      </button>
      <button onClick={() => onGuardado(actual)} className="p-1 text-zinc-500 hover:bg-white/5 rounded transition">
        <X size={12} />
      </button>
    </div>
  );
}

interface Props { empresa?: string; }

export function CompetidoresTab({ empresa }: Props) {
  const c = useChartColors();
  const COLORS = c.palette;
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [historias,    setHistorias]    = useState<Record<string, SnapshotCompetidor[]>>({});
  const [cargando,     setCargando]     = useState(false);
  const [modal,        setModal]        = useState(false);
  const [editandoId,   setEditandoId]   = useState<string | null>(null);
  const [eliminando,   setEliminando]   = useState<string | null>(null);

  const cargar = async () => {
    if (!empresa) return;
    setCargando(true);
    try {
      const rows = await getCompetidores(empresa);
      setCompetidores(rows);
      const historiaMap: Record<string, SnapshotCompetidor[]> = {};
      await Promise.all(rows.map(async c => {
        try { historiaMap[c.id] = await getHistoriaCompetidor(c.id, 60); }
        catch { historiaMap[c.id] = []; }
      }));
      setHistorias(historiaMap);
    } catch {} finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [empresa]);

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Quitar este competidor?")) return;
    setEliminando(id);
    try {
      await eliminarCompetidor(id);
      setCompetidores(prev => prev.filter(c => c.id !== id));
    } finally {
      setEliminando(null);
    }
  };

  const handleSeguidoresActualizados = (id: string, nuevo: number) => {
    setCompetidores(prev =>
      prev.map(c => c.id === id ? { ...c, seguidores: nuevo } : c)
    );
    setEditandoId(null);
  };

  const chartData = useMemo(() => {
    if (!competidores.length) return [];
    const fechas = new Set<string>();
    Object.values(historias).forEach(h => h.forEach(s => fechas.add(s.fecha)));
    const fechasOrdenadas = [...fechas].sort();

    return fechasOrdenadas.map(fecha => {
      const punto: Record<string, any> = { fecha: fecha.slice(0, 10) };
      competidores.forEach(c => {
        const snap = (historias[c.id] ?? []).find(s => s.fecha.slice(0, 10) === fecha.slice(0, 10));
        if (snap) punto[c.nombre] = Number(snap.seguidores);
      });
      return punto;
    });
  }, [competidores, historias]);

  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
      <BarChart2 size={32} />
      <p className="text-sm">Selecciona una empresa para ver sus competidores</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Benchmark Competidores</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Seguimiento manual de seguidores — haz click en el número para actualizar
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs btn-primary rounded-lg transition"
        >
          <Plus size={12} /> Agregar competidor
        </button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16 gap-2 text-zinc-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando…</span>
        </div>
      ) : competidores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
            <Users size={28} className="text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">Sin competidores registrados</p>
            <p className="text-[12px] text-zinc-500 mt-1">Agrega competidores para rastrear su crecimiento en el tiempo</p>
          </div>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs btn-primary rounded-xl transition mt-1"
          >
            <Plus size={12} /> Agregar primer competidor
          </button>
        </div>
      ) : (
        <>
          {/* Tabla comparativa */}
          <div className={`${GLASS_BASE} overflow-hidden`}>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">Página</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">Seguidores</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">+7 días</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">+30 días</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {competidores.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length], boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}` }} />
                        {c.imagen_url
                          ? <img src={c.imagen_url} alt={c.nombre} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          : <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0"><Building2 size={14} className="text-zinc-400" /></div>
                        }
                        <div>
                          <p className="font-medium text-zinc-200">{c.nombre}</p>
                          {c.categoria && <p className="text-[10px] text-zinc-400">{c.categoria}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editandoId === c.id ? (
                        <EditSeguidores
                          id={c.id}
                          actual={Number(c.seguidores) || 0}
                          onGuardado={nuevo => handleSeguidoresActualizados(c.id, nuevo)}
                        />
                      ) : (
                        <button
                          onClick={() => setEditandoId(c.id)}
                          className="group inline-flex items-center gap-1 font-semibold text-zinc-200 hover:text-accent transition"
                        >
                          {fmtNum(c.seguidores)}
                          <Pencil size={10} className="opacity-0 group-hover:opacity-60 transition" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CrecBadge v={c.crecimiento_7d} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CrecBadge v={c.crecimiento_30d} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.url_pagina && (
                          <a href={c.url_pagina} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition">
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          onClick={() => handleEliminar(c.id)}
                          disabled={eliminando === c.id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                        >
                          {eliminando === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráfico evolución */}
          {chartData.length > 1 ? (
            <div className={`${GLASS_BASE} p-5`}>
              <p className="text-sm font-semibold text-zinc-200 mb-4">Evolución de seguidores (últimos 60 días)</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                    tickFormatter={v => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                    tickFormatter={v => fmtNum(v)}
                    width={40}
                  />
                  <Tooltip
                    formatter={(v: any, name: any) => [fmtNum(v), name]}
                    labelFormatter={l => `Fecha: ${l}`}
                    contentStyle={{ fontSize: 11, borderRadius: 8, background: "rgba(10,16,31,0.97)", border: "1px solid rgba(255,255,255,0.1)", color: "#e4e4e7" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {competidores.map((c, i) => (
                    <Line filter="url(#neon-glow)"
                      key={c.id}
                      type="monotone"
                      dataKey={c.nombre}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={`${PANEL_BASE} p-5 text-center`}>
              <p className="text-xs text-zinc-500">
                El gráfico aparecerá cuando registres más de un conteo de seguidores.<br />
                Haz click en el número de seguidores de cada competidor para actualizar.
              </p>
            </div>
          )}
        </>
      )}

      {modal && empresa && (
        <ModalAgregar
          empresa={empresa}
          onAgregado={() => { setModal(false); cargar(); }}
          onCerrar={() => setModal(false)}
        />
      )}
    </div>
  );
}
