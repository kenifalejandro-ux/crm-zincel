/** client/src/components/finanzas/TablaEmpresasAnalisis.tsx */

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, BarChart2, Calendar, TrendingUp, Zap } from "lucide-react";
import { CARD_CLASS } from "../../lib/tokens";
import { useEditar } from "../../hooks/useEditar";
import {
  getEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa,
  getPeriodos, crearPeriodo, actualizarPeriodo, eliminarPeriodo,
} from "../../services/analisisEmpresas.api";
import { ModalEmpresaAnalisis }   from "./ModalEmpresaAnalisis";
import { ModalPeriodoFinanciero } from "./ModalPeriodoFinanciero";
import type { EmpresaAnalisis, PeriodoFinanciero, FormEmpresa, FormPeriodo } from "../../types/analisisEmpresas.types";
import { useNavigate } from "react-router-dom";

// ─── Mini-indicador con semáforo ────────────────────────────────────────────
type Semaforo = "verde" | "amarillo" | "rojo" | "gris";

function semaforoLiquidez(v: number | null): Semaforo {
  if (v === null) return "gris";
  if (v >= 1.5) return "verde";
  if (v >= 1.0) return "amarillo";
  return "rojo";
}
function semaforoROE(v: number | null): Semaforo {
  if (v === null) return "gris";
  if (v >= 20) return "verde";
  if (v >= 10) return "amarillo";
  return "rojo";
}
function semaforoEndeud(v: number | null): Semaforo {
  if (v === null) return "gris";
  if (v < 50) return "verde";
  if (v <= 70) return "amarillo";
  return "rojo";
}

const SEMAFORO_CLASES: Record<Semaforo, string> = {
  verde:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  amarillo: "bg-amber-50 text-amber-700 border-amber-200",
  rojo:     "bg-red-50 text-red-600 border-red-200",
  gris:     "bg-zinc-100 text-zinc-400 border-zinc-200",
};
const PUNTO_CLASES: Record<Semaforo, string> = {
  verde:    "bg-emerald-500",
  amarillo: "bg-amber-400",
  rojo:     "bg-red-500",
  gris:     "bg-zinc-300",
};

function MiniIndicador({
  label, valor, sufijo, semaforo,
}: {
  label: string; valor: number | null; sufijo?: string; semaforo: Semaforo;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium ${SEMAFORO_CLASES[semaforo]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PUNTO_CLASES[semaforo]}`} />
      <span className="text-[9px] font-normal opacity-70">{label}</span>
      <span className="font-bold">
        {valor !== null ? `${valor}${sufijo ?? ""}` : "—"}
      </span>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export function TablaEmpresasAnalisis() {
  const [empresas,       setEmpresas]       = useState<EmpresaAnalisis[]>([]);
  const [expandidas,     setExpandidas]     = useState<Set<string>>(new Set());
  const [periodosPor,    setPeriodosPor]    = useState<Record<string, PeriodoFinanciero[]>>({});
  const [modalEmpresa,   setModalEmpresa]   = useState(false);
  const [modalPeriodo,   setModalPeriodo]   = useState<string | null>(null);
  const [guardando,      setGuardando]      = useState(false);
  const editEmpresa  = useEditar<EmpresaAnalisis>();
  const editPeriodo  = useEditar<PeriodoFinanciero & { empresa_nombre: string }>();
  const navigate     = useNavigate();

  const cargarEmpresas = async () => {
    try { setEmpresas(await getEmpresas()); } catch {}
  };

  useEffect(() => { cargarEmpresas(); }, []);

  const toggleExpandir = async (id: string) => {
    const nuevo = new Set(expandidas);
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
      if (!periodosPor[id]) {
        try {
          const p = await getPeriodos(id);
          setPeriodosPor(prev => ({ ...prev, [id]: p }));
        } catch {}
      }
    }
    setExpandidas(nuevo);
  };

  const refrescarPeriodos = async (empresaId: string) => {
    try {
      const p = await getPeriodos(empresaId);
      setPeriodosPor(prev => ({ ...prev, [empresaId]: p }));
    } catch {}
  };

  const handleGuardarEmpresa = async (form: FormEmpresa) => {
    setGuardando(true);
    try {
      if (editEmpresa.editando) {
        await actualizarEmpresa(editEmpresa.editando.id, form);
        editEmpresa.cerrar();
      } else {
        await crearEmpresa(form);
        setModalEmpresa(false);
      }
      cargarEmpresas();
    } catch {} finally { setGuardando(false); }
  };

  const handleEliminarEmpresa = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar empresa "${nombre}" y todos sus períodos?`)) return;
    try {
      await eliminarEmpresa(id);
      cargarEmpresas();
    } catch {}
  };

  const handleGuardarPeriodo = async (form: FormPeriodo) => {
    setGuardando(true);
    try {
      if (editPeriodo.editando) {
        await actualizarPeriodo(editPeriodo.editando.id, form);
        editPeriodo.cerrar();
        await refrescarPeriodos(editPeriodo.editando.empresa_id);
      } else if (modalPeriodo) {
        await crearPeriodo(modalPeriodo, form);
        setModalPeriodo(null);
        await refrescarPeriodos(modalPeriodo);
        cargarEmpresas();
      }
    } catch {} finally { setGuardando(false); }
  };

  const handleEliminarPeriodo = async (p: PeriodoFinanciero) => {
    if (!confirm(`¿Eliminar período "${p.periodo}"?`)) return;
    try {
      await eliminarPeriodo(p.id);
      await refrescarPeriodos(p.empresa_id);
      cargarEmpresas();
    } catch {}
  };

  const irAAnalisis = (empresaId: string, periodoId: string) => {
    navigate(`/analisis-financiero?empresa=${empresaId}&periodo=${periodoId}`);
  };

  const fmtFecha = (f: string) => {
    try { return new Date(f).toLocaleDateString("es-PE", { month: "short", year: "numeric", day: "numeric" }); }
    catch { return f; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} registrada{empresas.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setModalEmpresa(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg transition"
        >
          <Plus size={13} /> Nueva empresa
        </button>
      </div>

      {empresas.length === 0 && (
        <div className={`${CARD_CLASS} text-center py-14`}>
          <BarChart2 size={32} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-600">Sin empresas registradas</p>
          <p className="text-xs text-zinc-400 mt-1">Agrega una empresa para ingresar sus datos financieros y generar el análisis.</p>
        </div>
      )}

      {empresas.map(empresa => {
        const expandida = expandidas.has(empresa.id);
        const periodos  = periodosPor[empresa.id] ?? [];
        const tieneDatos = empresa.total_periodos > 0;

        return (
          <div key={empresa.id} className={CARD_CLASS}>
            {/* ── Fila principal ── */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleExpandir(empresa.id)}
                className="mt-0.5 p-1 hover:bg-zinc-100 rounded-lg transition text-zinc-400 flex-shrink-0"
              >
                {expandida ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              <div className="flex-1 min-w-0">
                {/* Nombre + sector */}
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-zinc-800">{empresa.nombre}</p>
                  {empresa.sector && (
                    <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">{empresa.sector}</span>
                  )}
                  <span className="text-[10px] text-zinc-400">{empresa.moneda}</span>
                </div>

                {/* Info períodos */}
                <div className="flex items-center gap-2 mt-0.5">
                  {tieneDatos ? (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Calendar size={10} />
                      {empresa.total_periodos} período{empresa.total_periodos !== 1 ? "s" : ""}
                      {empresa.ultimo_periodo_label && ` · Último: ${empresa.ultimo_periodo_label}`}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400">Sin períodos aún</span>
                  )}
                </div>

                {/* Mini-indicadores del último período */}
                {tieneDatos && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <MiniIndicador
                      label="Liquidez"
                      valor={empresa.liquidez_actual}
                      semaforo={semaforoLiquidez(empresa.liquidez_actual)}
                    />
                    <MiniIndicador
                      label="ROE"
                      valor={empresa.roe_actual}
                      sufijo="%"
                      semaforo={semaforoROE(empresa.roe_actual)}
                    />
                    <MiniIndicador
                      label="Endeud."
                      valor={empresa.endeudamiento_actual}
                      sufijo="%"
                      semaforo={semaforoEndeud(empresa.endeudamiento_actual)}
                    />
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {tieneDatos && empresa.ultimo_periodo_id && (
                  <button
                    onClick={() => irAAnalisis(empresa.id, empresa.ultimo_periodo_id!)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Zap size={11} /> Analizar
                  </button>
                )}
                <button
                  onClick={() => setModalPeriodo(empresa.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg transition"
                >
                  <Plus size={11} /> Período
                </button>
                <button
                  onClick={() => editEmpresa.abrir(empresa)}
                  className="p-1.5 hover:bg-zinc-100 rounded-lg transition text-zinc-400"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleEliminarEmpresa(empresa.id, empresa.nombre)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition text-zinc-400 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* ── Períodos expandidos ── */}
            {expandida && (
              <div className="mt-4 border-t border-zinc-50 pt-4 space-y-2">
                {periodos.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-4">Sin períodos. Agrega el primer período financiero.</p>
                )}
                {periodos.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-zinc-50 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-700">{p.periodo}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{fmtFecha(p.fecha_periodo)}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-[10px] text-zinc-500">
                      <span>Caja: {Number(p.caja_bancos).toLocaleString("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 })}</span>
                      <span>CxC: {Number(p.cuentas_por_cobrar).toLocaleString("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 })}</span>
                      <span>Patrimonio: {Number(p.patrimonio).toLocaleString("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => irAAnalisis(empresa.id, p.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg transition"
                      >
                        <TrendingUp size={11} /> Analizar
                      </button>
                      <button
                        onClick={() => editPeriodo.abrir({ ...p, empresa_nombre: empresa.nombre })}
                        className="p-1.5 hover:bg-white rounded-lg transition text-zinc-400"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleEliminarPeriodo(p)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modales */}
      {modalEmpresa && (
        <ModalEmpresaAnalisis
          guardando={guardando}
          onGuardar={handleGuardarEmpresa}
          onCerrar={() => setModalEmpresa(false)}
        />
      )}
      {editEmpresa.editando && (
        <ModalEmpresaAnalisis
          empresa={editEmpresa.editando}
          guardando={guardando}
          onGuardar={handleGuardarEmpresa}
          onCerrar={editEmpresa.cerrar}
        />
      )}
      {modalPeriodo && (
        <ModalPeriodoFinanciero
          empresaNombre={empresas.find(e => e.id === modalPeriodo)?.nombre ?? ""}
          guardando={guardando}
          onGuardar={handleGuardarPeriodo}
          onCerrar={() => setModalPeriodo(null)}
        />
      )}
      {editPeriodo.editando && (
        <ModalPeriodoFinanciero
          empresaNombre={editPeriodo.editando.empresa_nombre}
          periodo={editPeriodo.editando}
          guardando={guardando}
          onGuardar={handleGuardarPeriodo}
          onCerrar={editPeriodo.cerrar}
        />
      )}
    </div>
  );
}
