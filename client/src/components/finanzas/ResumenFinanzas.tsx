/** client/src/components/finanzas/ResumenFinanzas.tsx */

import { useState }                    from "react";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, RefreshCw, Landmark } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS }   from "../../lib/tokens";
import { FlujoCajaChart }             from "./FlujoCajaChart";
import { EgresosPorCategoriaChart }   from "./EgresosPorCategoriaChart";
import { IngresosPorServicioChart }   from "./IngresosPorServicioChart";
import type { ResumenFinanciero }      from "../../types/finanzas.types";
import { actualizarTipoCambioDesdeAPI, guardarTipoCambio } from "../../services/configuracion.api";

function KpiCard({
  label, valor, sub, icon, color, bg,
}: {
  label: string; valor: string; sub?: string;
  icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className={`${CARD_CLASS} !p-4 flex items-center gap-4`}>
      <div className={`${bg} p-2.5 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-[11px] text-zinc-600 font-medium uppercase">{label}</p>
        <p className="text-lg font-bold text-zinc-800 leading-tight">{valor}</p>
        {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 });
}

interface Props {
  resumen:              ResumenFinanciero;
  tipoCambio:           number;
  onTipoCambioChange:   (tc: number) => void;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function ResumenFinanzas({ resumen, tipoCambio, onTipoCambioChange }: Props) {
  const { ingresos, egresos, por_cobrar, pasivos, flujo_mensual, por_servicio, por_categoria } = resumen;
  const [actualizando,    setActualizando]    = useState(false);
  const [tcActualizadoEn, setTcActualizadoEn] = useState<string | null>(null);
  const [tcError,         setTcError]         = useState<string | null>(null);

  const utilidad         = ingresos.utilidad_neta;
  const utilidadNegativa = utilidad < 0;

  const handleActualizarAPI = async () => {
    setActualizando(true);
    setTcError(null);
    try {
      const tc = await actualizarTipoCambioDesdeAPI();
      onTipoCambioChange(tc.valor);
      setTcActualizadoEn(tc.actualizado_en);
    } catch {
      setTcError("No se pudo conectar con la API. Ingresa el valor manualmente.");
    } finally {
      setActualizando(false);
    }
  };

  const handleGuardarManual = async (valor: number) => {
    onTipoCambioChange(valor);
    try {
      const tc = await guardarTipoCambio(valor);
      setTcActualizadoEn(tc.actualizado_en);
    } catch {}
  };

  return (
    <div className="space-y-5">

      {/* Tipo de cambio configurable */}
      <div className={`${CARD_CLASS} !px-4 !py-3 flex flex-wrap items-center gap-3 text-xs`}>
        <span className="text-zinc-700 font-medium">Tipo de cambio USD → PEN</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-600">S/</span>
          <input
            type="number"
            min={1}
            step={0.01}
            value={tipoCambio}
            onChange={(e) => handleGuardarManual(Number(e.target.value))}
            className="w-20 px-2 py-1 border border-zinc-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <span className="text-zinc-600">/ USD</span>
        </div>
        <button
          onClick={handleActualizarAPI}
          disabled={actualizando}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg transition text-xs"
        >
          <RefreshCw size={12} className={actualizando ? "animate-spin" : ""} />
          {actualizando ? "Obteniendo..." : "Actualizar desde API"}
        </button>
        <div className="ml-auto text-[11px] text-zinc-600">
          {tcError && <span className="text-red-500">{tcError}</span>}
          {!tcError && tcActualizadoEn && <span>Actualizado: {fmtFecha(tcActualizadoEn)}</span>}
          {!tcError && !tcActualizadoEn && <span>Todos los montos en PEN</span>}
        </div>
      </div>

      {/* KPIs principales — fila 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos cobrados"
          valor={fmt(ingresos.total_cobrado)}
          sub={`${ingresos.cantidad} registro(s)`}
          icon={<TrendingUp size={18} />}
          color="text-green-600" bg="bg-green-50"
        />
        <KpiCard
          label="Egresos del período"
          valor={fmt(egresos.total_egresos)}
          sub={`${egresos.cantidad} registro(s)`}
          icon={<TrendingDown size={18} />}
          color="text-red-500" bg="bg-red-50"
        />
        <KpiCard
          label="Utilidad neta"
          valor={fmt(utilidad)}
          sub={utilidadNegativa ? "Pérdida este período" : "Ganancia este período"}
          icon={<DollarSign size={18} />}
          color={utilidadNegativa ? "text-red-600" : "text-brand"}
          bg={utilidadNegativa ? "bg-red-50" : "bg-brand/5"}
        />
        <KpiCard
          label="Por cobrar (total)"
          valor={fmt(por_cobrar.por_cobrar_total)}
          sub="Saldo pendiente acumulado"
          icon={<AlertCircle size={18} />}
          color="text-orange-500" bg="bg-orange-50"
        />
      </div>

      {/* KPIs pasivos — fila 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Pasivos (préstamos)"
          valor={fmt(pasivos.total_por_pagar)}
          sub={`${pasivos.cantidad_pendientes} préstamo(s) pendiente(s)${pasivos.cantidad_vencidos > 0 ? ` · ${pasivos.cantidad_vencidos} vencido(s)` : ""}`}
          icon={<Landmark size={18} />}
          color={pasivos.total_por_pagar > 0 ? "text-rose-600" : "text-zinc-600"}
          bg={pasivos.total_por_pagar > 0 ? "bg-rose-50" : "bg-gray-50"}
        />
        {pasivos.total_vencido > 0 && (
          <KpiCard
            label="Deuda vencida"
            valor={fmt(pasivos.total_vencido)}
            sub="Préstamos fuera de plazo"
            icon={<AlertCircle size={18} />}
            color="text-red-700" bg="bg-red-100"
          />
        )}
        <KpiCard
          label="Posición real"
          valor={fmt(pasivos.posicion_real)}
          sub="Utilidad neta − Préstamos por pagar"
          icon={<DollarSign size={18} />}
          color={pasivos.posicion_real >= 0 ? "text-brand" : "text-red-600"}
          bg={pasivos.posicion_real >= 0 ? "bg-brand/5" : "bg-red-50"}
        />
      </div>

      {/* Alerta si hay utilidad negativa */}
      {utilidadNegativa && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle size={14} />
          Los egresos superan los ingresos cobrados este período. Revisa tus gastos.
        </div>
      )}

      {/* Flujo de caja */}
      <FlujoCajaChart flujo={flujo_mensual} />

      {/* Gráficos de desglose */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <IngresosPorServicioChart por_servicio={por_servicio} />
        <EgresosPorCategoriaChart por_categoria={por_categoria} />
      </div>

      {/* Detalle ingresos acordados */}
      <div className={`${CARD_CLASS} !p-4`}>
        <h3 className={HEADER_CLASS}><Landmark size={14} className="mr-2.5 text-slate-500" strokeWidth={2} />Detalle del período</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="text-zinc-600">Total acordado</p>
            <p className="font-semibold text-zinc-800">{fmt(ingresos.total_acordado)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-zinc-600">Adelantos cobrados</p>
            <p className="font-semibold text-brand">{fmt(ingresos.total_cobrado)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-zinc-600">Saldo pendiente (período)</p>
            <p className="font-semibold text-orange-500">{fmt(ingresos.total_por_cobrar)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-zinc-600">Cobrado completo</p>
            <p className="font-semibold text-green-600">{fmt(ingresos.cobrado_completo)}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
