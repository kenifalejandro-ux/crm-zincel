/** src/components/metricas/CostoLeadTab.tsx */

import { GLASS_BASE, BADGE_BASE, PANEL_BASE } from "../../lib/tokens";
import { useEffect, useMemo, useState } from "react";
import { DollarSign, MessageSquare, BarChart3, Sparkles } from "lucide-react";
import { Metrica } from "../../types/metricas.types";
import type { Resultado } from "../../types/resultado.types";
import { listarResultados } from "../../services/resultados.api";
import { sectorLabel } from "../../utils/sectores";
import { getBenchmarkPorEmpresa } from "../../services/benchmarks.api";
import type { BenchmarkSector } from "../../types/benchmark.types";

interface Props {
  metricas: Metrica[];
  empresa?: string;
}

const FMT_SOL = (v: number) => `S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const FMT_PCT = (v: number) => `${v.toFixed(1)}%`;

export function CostoLeadTab({ metricas, empresa }: Props) {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [benchmarkDin, setBenchmarkDin] = useState<BenchmarkSector | null>(null);
  const [sectorActivo, setSectorActivo] = useState<string | null>(null);

  const empresaEfectiva = useMemo(() => {
    if (empresa) return empresa;
    const unicas = [...new Set(metricas.map((m) => m.empresa).filter(Boolean))];
    return unicas.length === 1 ? unicas[0] : null;
  }, [empresa, metricas]);

  useEffect(() => {
    if (!empresaEfectiva) {
      setBenchmarkDin(null);
      setSectorActivo(null);
      return;
    }
    getBenchmarkPorEmpresa(empresaEfectiva)
      .then((b) => { setBenchmarkDin(b); setSectorActivo(b?.sector ?? null); })
      .catch(() => { setBenchmarkDin(null); setSectorActivo(null); });
  }, [empresaEfectiva]);

  useEffect(() => {
    if (!empresaEfectiva) { setResultados([]); return; }
    listarResultados({ empresa: empresaEfectiva })
      .then(setResultados)
      .catch(() => setResultados([]));
  }, [empresaEfectiva]);

  const metricasFiltradas = useMemo(
    () => empresaEfectiva ? metricas.filter((m) => m.empresa === empresaEfectiva) : metricas,
    [empresaEfectiva, metricas]
  );

  const resumen = useMemo(() => {
    const totalGasto = metricasFiltradas.reduce((sum, m) => sum + Number(m.gasto), 0);
    const totalLeads = metricasFiltradas.reduce((sum, m) => sum + Number(m.leads), 0);
    const cpl = totalLeads > 0 ? totalGasto / totalLeads : null;

    const ventasAtribuidas = resultados.length;
    const totalMonto = resultados.reduce((sum, r) => sum + Number(r.monto), 0);
    const totalCostoVenta = resultados.reduce((sum, r) => sum + Number(r.costo_venta ?? 0), 0);
    const costoPorVenta = ventasAtribuidas > 0 ? (totalGasto + totalCostoVenta) / ventasAtribuidas : null;

    return { totalGasto, totalLeads, cpl, ventasAtribuidas, totalMonto, totalCostoVenta, costoPorVenta };
  }, [metricasFiltradas, resultados]);

  const campañaDetalle = useMemo(() => {
    const porCampana = new Map<string, {
      nombre: string;
      gasto: number;
      leads: number;
      ventas: number;
      montoAtribuido: number;
      costoVentaAtribuido: number;
    }>();

    for (const m of metricasFiltradas) {
      porCampana.set(m.id, {
        nombre: m.campana_nombre,
        gasto: Number(m.gasto),
        leads: Number(m.leads),
        ventas: 0,
        montoAtribuido: 0,
        costoVentaAtribuido: 0,
      });
    }

    for (const r of resultados) {
      const ids = (r.metrica_ids && r.metrica_ids.length > 0)
        ? r.metrica_ids
        : r.metrica_id
          ? [r.metrica_id]
          : [];
      const repartoMonto = ids.length > 0 ? Number(r.monto) / ids.length : 0;
      const repartoCosto = ids.length > 0 ? Number(r.costo_venta ?? 0) / ids.length : 0;

      for (const id of ids) {
        const item = porCampana.get(id);
        if (!item) continue;
        item.ventas += 1;
        item.montoAtribuido += repartoMonto;
        item.costoVentaAtribuido += repartoCosto;
      }
    }

    return Array.from(porCampana.values())
      .map((c) => ({
        ...c,
        cpl: c.leads > 0 ? c.gasto / c.leads : null,
      }))
      .sort((a, b) => (b.ventas - a.ventas) || ((a.cpl ?? 0) - (b.cpl ?? 0)));
  }, [metricasFiltradas, resultados]);

  const tabla = useMemo(() => {
    return campañaDetalle.map((c) => ({
      ...c,
      costoPorVentaAtribuida: c.ventas > 0 ? (c.gasto + c.costoVentaAtribuido) / c.ventas : null,
      roasAtribuido: c.gasto > 0 ? c.montoAtribuido / c.gasto : null,
    }));
  }, [campañaDetalle]);

  if (!empresaEfectiva) {
    return (
      <div className={`${PANEL_BASE} flex items-start gap-3 border-dashed px-5 py-6 text-xs text-zinc-500`}>
        <DollarSign size={16} className="mt-0.5 text-zinc-400 shrink-0" />
        <p>Selecciona una empresa en los filtros para ver CPL y costo por venta atribuida.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-base">📈</span>
        <div>
          <p className="text-sm font-semibold text-zinc-200">Costo por Lead & Costo por Venta Atribuida</p>
          <p className="text-xs text-zinc-500">Basado en las métricas y las ventas registradas en Resultados.</p>
        </div>
        {sectorActivo && (
          <span className={`${BADGE_BASE} text-[10px] text-violet-600 border-violet-200 px-2 py-0.5 font-medium`}>
            {sectorLabel(sectorActivo)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${GLASS_BASE} px-4 py-4`}>
          <p className="text-[10px] text-zinc-100 uppercase">Gasto total</p>
          <p className="text-lg font-bold text-zinc-100 mt-2">{FMT_SOL(resumen.totalGasto)}</p>
        </div>
        <div className={`${GLASS_BASE} px-4 py-4`}>
          <p className="text-[10px] text-zinc-100 uppercase">Leads totales</p>
          <p className="text-lg font-bold text-zinc-100 mt-2">{resumen.totalLeads.toLocaleString()}</p>
        </div>
        <div className={`${GLASS_BASE} px-4 py-4`}>
          <p className="text-[10px] text-zinc-100 uppercase">CPL promedio</p>
          <p className="text-lg font-bold text-zinc-100 mt-2">{resumen.cpl !== null ? FMT_SOL(resumen.cpl) : "—"}</p>
        </div>
        <div className={`${GLASS_BASE} px-4 py-4`}>
          <p className="text-[10px] text-zinc-100 uppercase">Ventas atribuidas</p>
          <p className="text-lg font-bold text-zinc-100 mt-2">{resumen.ventasAtribuidas}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`${GLASS_BASE} p-4`}>
          <p className="text-[10px] text-zinc-100 uppercase">Monto atribuido</p>
          <p className="text-xl font-bold text-zinc-100 mt-2">{FMT_SOL(resumen.totalMonto)}</p>
          <p className="text-[11px] text-zinc-500 mt-2">Total de ingresos atribuidos a las campañas con ventas registradas.</p>
        </div>
        <div className={`${GLASS_BASE} p-4`}>
          <p className="text-[10px] text-zinc-100 uppercase">Costo por venta atribuida</p>
          <p className="text-xl font-bold text-zinc-100 mt-2">{resumen.costoPorVenta !== null ? FMT_SOL(resumen.costoPorVenta) : "—"}</p>
          <p className="text-[11px] text-zinc-500 mt-2">Incluye gasto de pauta + costo de cierre dividido por ventas atribuidas.</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-zinc-800/40 text-zinc-100 uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3 text-left">Campaña</th>
              <th className="px-4 py-3 text-right">Gasto</th>
              <th className="px-4 py-3 text-right">Leads</th>
              <th className="px-4 py-3 text-right">CPL</th>
              <th className="px-4 py-3 text-right">Ventas atribuidas</th>
              <th className="px-4 py-3 text-right">Costo / venta</th>
              <th className="px-4 py-3 text-right">ROAS atribuido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tabla.map((c) => (
              <tr key={c.nombre} className="hover:bg-zinc-800/40 transition">
                <td className="px-4 py-3 font-medium text-zinc-200 max-w-[220px] truncate">{c.nombre}</td>
                <td className="px-4 py-3 text-right text-zinc-400">{FMT_SOL(c.gasto)}</td>
                <td className="px-4 py-3 text-right text-zinc-400">{c.leads.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-zinc-200">{c.cpl !== null ? FMT_SOL(c.cpl) : "—"}</td>
                <td className="px-4 py-3 text-right text-zinc-200">{c.ventas}</td>
                <td className="px-4 py-3 text-right text-zinc-200">{c.costoPorVentaAtribuida !== null ? FMT_SOL(c.costoPorVentaAtribuida) : "—"}</td>
                <td className="px-4 py-3 text-right text-zinc-200">{c.roasAtribuido !== null ? `${c.roasAtribuido.toFixed(1)}x` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${PANEL_BASE} p-4 text-xs text-zinc-500`}>
        <p className="font-semibold text-zinc-300">Notas</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>El CPL se calcula a partir del gasto total dividido por leads registradas en las métricas.</li>
          <li>El costo por venta atribuida incluye el gasto de pauta y el costo de cierre registrado en Resultados.</li>
          <li>Si una venta está ligada a varias campañas, su monto y costo se reparten equitativamente entre ellas.</li>
        </ul>
      </div>
    </div>
  );
}
