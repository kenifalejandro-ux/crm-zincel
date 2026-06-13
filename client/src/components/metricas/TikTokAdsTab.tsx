/** src/components/metricas/TikTokAdsTab.tsx */

import { GLASS_BASE } from "../../lib/tokens";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { RefreshCw, Loader2, TrendingUp, DollarSign, Eye, MousePointerClick, Users, Percent } from "lucide-react";
import { Metrica } from "../../types/metricas.types";
import { syncTikTokAds } from "../../services/tiktokAds.api";
import { fechaHoy } from "../../utils/date";

const hace30 = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const n = (v: any) => Number(v) || 0;

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `S/ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `S/ ${(v / 1_000).toFixed(1)}K`;
  return `S/ ${v.toFixed(2)}`;
}
function fmtNum(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
}

interface KpiCardProps { icon: React.ReactNode; label: string; value: string; sub?: string; color: string; }
function KpiCard({ icon, label, value, sub, color }: KpiCardProps) {
  return (
    <div className={`${GLASS_BASE} p-4 flex items-start gap-3`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-zinc-200 leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface Props {
  metricas: Metrica[];
  empresa?: string;
  onSync?: () => void;
}

export function TikTokAdsTab({ metricas, empresa, onSync }: Props) {
  const [syncing,  setSyncing]  = useState(false);
  const [syncMsg,  setSyncMsg]  = useState<string | null>(null);

  const tiktok = metricas.filter(m => m.plataforma === "tiktok");

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalGasto      = tiktok.reduce((s, m) => s + n(m.gasto), 0);
  const totalImpresiones = tiktok.reduce((s, m) => s + n(m.impresiones), 0);
  const totalAlcance    = tiktok.reduce((s, m) => s + n(m.alcance), 0);
  const totalClics      = tiktok.reduce((s, m) => s + n(m.clics), 0);
  const cpmProm = totalImpresiones > 0 ? (totalGasto / totalImpresiones) * 1000 : 0;
  const cpcProm = totalClics > 0 ? totalGasto / totalClics : 0;
  const ctrProm = totalImpresiones > 0 ? (totalClics / totalImpresiones) * 100 : 0;

  // ── Datos chart (top 10 campañas por gasto) ─────────────────────────────────
  const porCampana = Object.values(
    tiktok.reduce<Record<string, { nombre: string; gasto: number; impresiones: number; clics: number }>>((acc, m) => {
      const k = m.campana_nombre;
      if (!acc[k]) acc[k] = { nombre: k, gasto: 0, impresiones: 0, clics: 0 };
      acc[k].gasto       += n(m.gasto);
      acc[k].impresiones += n(m.impresiones);
      acc[k].clics       += n(m.clics);
      return acc;
    }, {})
  ).sort((a, b) => b.gasto - a.gasto).slice(0, 10);

  const handleSync = async () => {
    if (!empresa) return;
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await syncTikTokAds(empresa, hace30(), fechaHoy());
      setSyncMsg(`✓ ${res.insertados} nuevas · ${res.duplicados} duplicadas`);
      onSync?.();
    } catch (err: any) {
      setSyncMsg(err.response?.data?.message || "Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
      <TrendingUp size={32} />
      <p className="text-sm">Selecciona una empresa para ver sus campañas de TikTok</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">TikTok Ads</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">{empresa} · {tiktok.length} campaña{tiktok.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {syncMsg && (
            <span className={`text-[11px] font-medium ${syncMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
              {syncMsg}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-black hover:bg-zinc-800 text-white rounded-lg transition disabled:opacity-50"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Sincronizar TikTok
          </button>
        </div>
      </div>

      {tiktok.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <TrendingUp size={28} className="text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">Sin campañas de TikTok</p>
            <p className="text-[12px] text-zinc-500 mt-1">
              Haz click en <strong>Sincronizar TikTok</strong> o usa el botón ⚡ para importar desde la API
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              icon={<DollarSign size={16} className="text-white" />}
              label="Gasto total"
              value={fmtMoney(totalGasto)}
              color="bg-zinc-800"
            />
            <KpiCard
              icon={<Eye size={16} className="text-white" />}
              label="Impresiones"
              value={fmtNum(totalImpresiones)}
              color="bg-pink-500"
            />
            <KpiCard
              icon={<Users size={16} className="text-white" />}
              label="Alcance"
              value={fmtNum(totalAlcance)}
              color="bg-violet-500"
            />
            <KpiCard
              icon={<MousePointerClick size={16} className="text-white" />}
              label="Clics"
              value={fmtNum(totalClics)}
              color="bg-blue-500"
            />
            <KpiCard
              icon={<Percent size={16} className="text-white" />}
              label="CTR prom."
              value={`${ctrProm.toFixed(2)}%`}
              color="bg-emerald-500"
            />
            <KpiCard
              icon={<DollarSign size={16} className="text-white" />}
              label="CPM prom."
              value={`S/ ${cpmProm.toFixed(2)}`}
              sub={`CPC: S/ ${cpcProm.toFixed(2)}`}
              color="bg-amber-500"
            />
          </div>

          {/* Chart: Gasto por campaña */}
          {porCampana.length > 0 && (
            <div className={`${GLASS_BASE} p-5`}>
              <p className="text-sm font-semibold text-zinc-200 mb-4">Gasto por campaña</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porCampana} margin={{ top: 0, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis
                    dataKey="nombre"
                    tick={{ fontSize: 9, fill: "#a1a1aa" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                    tickFormatter={v => `S/${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                    width={48}
                  />
                  <Tooltip
                    formatter={(v: any) => [`S/ ${Number(v).toFixed(2)}`, "Gasto"]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
                  />
                  <Bar filter="url(#neon-glow)" dataKey="gasto" radius={[4, 4, 0, 0]}>
                    {porCampana.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#000000" : i === 1 ? "#ec4899" : "#f0abfc"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla de campañas */}
          <div className={`${GLASS_BASE} overflow-hidden`}>
            <div className="px-5 py-3 border-b border-white/8">
              <p className="text-sm font-semibold text-zinc-200">Detalle de campañas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8 bg-zinc-800/40">
                    <th className="text-left px-4 py-2.5 font-medium text-zinc-100">Campaña</th>
                    <th className="text-left px-4 py-2.5 font-medium text-zinc-100">Período</th>
                    <th className="text-right px-4 py-2.5 font-medium text-zinc-100">Gasto</th>
                    <th className="text-right px-4 py-2.5 font-medium text-zinc-100">Impresiones</th>
                    <th className="text-right px-4 py-2.5 font-medium text-zinc-100">Alcance</th>
                    <th className="text-right px-4 py-2.5 font-medium text-zinc-100">Clics</th>
                    <th className="text-right px-4 py-2.5 font-medium text-zinc-100">CTR</th>
                    <th className="text-right px-4 py-2.5 font-medium text-zinc-100">CPC</th>
                    <th className="text-right px-4 py-2.5 font-medium text-zinc-100">CPM</th>
                  </tr>
                </thead>
                <tbody>
                  {tiktok.map(m => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/8/5/50 transition">
                      <td className="px-4 py-2.5 max-w-[200px]">
                        <p className="font-medium text-zinc-200 truncate">{m.campana_nombre}</p>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
                        {m.periodo_inicio.slice(0, 10)} → {m.periodo_fin.slice(0, 10)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-zinc-200">
                        S/ {n(m.gasto).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-400">{fmtNum(n(m.impresiones))}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-400">{fmtNum(n(m.alcance))}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-400">{fmtNum(n(m.clics))}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-400">{n(m.ctr).toFixed(2)}%</td>
                      <td className="px-4 py-2.5 text-right text-zinc-400">
                        {n(m.cpc) > 0 ? `S/ ${n(m.cpc).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-400">
                        {n(m.cpm) > 0 ? `S/ ${n(m.cpm).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
