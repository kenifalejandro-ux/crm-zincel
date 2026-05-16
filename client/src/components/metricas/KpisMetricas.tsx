/** src/components/metricas/KpisMetricas.tsx */

import { DollarSign, Users, TrendingUp, Target, MousePointer } from "lucide-react";
import { Metrica } from "../../types/metricas.types";
import { KpiCards, KpiItem } from "@/components/shared/KpisCards";

interface Props { metricas: Metrica[] }

export const KpisMetricas = ({ metricas }: Props) => {
  const total = (key: keyof Metrica) =>
    metricas.reduce((a, m) => a + Number(m[key] || 0), 0);

  const totalGasto   = total("gasto");
  const totalLeads   = total("leads");
  const totalClics   = total("clics");
  const roasPromedio = metricas.length
    ? (metricas.reduce((a, m) => a + Number(m.roas), 0) / metricas.length).toFixed(2)
    : "0.00";
  const cpaPromedio  = metricas.length
    ? (metricas.reduce((a, m) => a + Number(m.cpa), 0) / metricas.length).toFixed(2)
    : "0.00";

  const kpis: KpiItem[] = [
    {
      label: "Total invertido",
      valor: `S/ ${totalGasto.toLocaleString("es-PE")}`,
      icon:  <DollarSign size={18} />,
      color: "text-amber-600",
      bg:    "bg-amber-50",
    },
    {
      label: "Total leads",
      valor: totalLeads.toLocaleString("es-PE"),
      icon:  <Users size={18} />,
      color: "text-blue-600",
      bg:    "bg-blue-50",
    },
    {
      label: "Total clics",
      valor: totalClics.toLocaleString("es-PE"),
      icon:  <MousePointer size={18} />,
      color: "text-purple-600",
      bg:    "bg-purple-50",
    },
    {
      label: "ROAS promedio",
      valor: `${roasPromedio}x`,
      icon:  <TrendingUp size={18} />,
      color: "text-green-600",
      bg:    "bg-green-50",
    },
    {
      label: "CPA promedio",
      valor: `S/ ${cpaPromedio}`,
      icon:  <Target size={18} />,
      color: "text-red-600",
      bg:    "bg-red-50",
    },
  ];

  return <KpiCards items={kpis} />;
};