/** client/src/pages/LlamadasPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import {
  getResumenLlamadas,
  getAllLlamadas,
  getEstadisticasLlamadas,
  crearLlamada,
  actualizarLlamada,
} from "../services/llamadas.api";
import { getProspectos } from "../services/prospectos.api";

import { KpisLlamadas }           from "../components/llamadas/KpisLlamadas";
import { FiltrosFecha }           from "../components/llamadas/FiltrosFecha";
import { EstadisticasPeriodo }    from "../components/llamadas/EstadisticasPeriodo";
import { HistorialLlamadas }      from "../components/llamadas/HistorialLlamadas";
import { ModalRegistrarLlamada, FormLlamada } from "../components/llamadas/ModalRegistrarLlamada";
import { ModalEditarLlamada }     from "../components/llamadas/ModalEditarLlamada";
import { useEditar }              from "../hooks/useEditar";

// ── Helpers ──────────────────────────────────────────────────────────────────

const FORM_INICIAL: FormLlamada = {
  prospecto_id:     "",
  canal:            "llamada",
  contestada:       false,
  duracion_minutos: 0,
  resultado:        "",
  notas:            "",
};

const calcularRangoFecha = (fecha: string, periodo: "dia" | "semana" | "mes") => {
  if (periodo === "mes") {
    const [year, month] = fecha.split("-").map(Number);
    if (!year || !month) return { fecha_inicio: undefined, fecha_fin: undefined };
    const inicio  = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
    const finMes  = month === 12
      ? `${year + 1}-01-01T00:00:00.000Z`
      : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00.000Z`;
    return { fecha_inicio: inicio, fecha_fin: finMes };
  }

  if (!fecha) return { fecha_inicio: undefined, fecha_fin: undefined };
  const [y, m, d] = fecha.split("-").map(Number);

  if (periodo === "dia") {
    const inicio = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00.000Z`;
    const finDia = new Date(Date.UTC(y, m - 1, d + 1));
    return { fecha_inicio: inicio, fecha_fin: finDia.toISOString() };
  }

  // semana
  const diaActual  = new Date(Date.UTC(y, m - 1, d));
  const ajuste     = (diaActual.getUTCDay() + 6) % 7;
  const inicioSem  = new Date(Date.UTC(y, m - 1, d - ajuste));
  const finSem     = new Date(Date.UTC(y, m - 1, d - ajuste + 7));
  return { fecha_inicio: inicioSem.toISOString(), fecha_fin: finSem.toISOString() };
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function LlamadasPage() {
  const [resumen,      setResumen]      = useState<any[]>([]);
  const [llamadas,     setLlamadas]     = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [prospectos,   setProspectos]   = useState<any[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [form,         setForm]         = useState<FormLlamada>(FORM_INICIAL);

  const editar = useEditar<any>();

  const handleGuardarEdicion = async (form: any) => {
    await editar.guardar(async () => {
      await actualizarLlamada(editar.editando!.id, form);
      await cargarLlamadas(filtroFecha, filtroPeriodo as "dia" | "mes" | "semana");
    });
  };

  const [filtroPeriodo, setFiltroPeriodo] = useState("mes");
  const [filtroFecha,   setFiltroFecha]   = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ── Carga de datos ──────────────────────────────────────
  const cargarLlamadas = async (fecha: string, periodo: "dia" | "semana" | "mes") => {
    try {
      const rango = calcularRangoFecha(fecha, periodo);
      const [res, llam, stats] = await Promise.all([
        getResumenLlamadas(rango),
        getAllLlamadas(rango),
        getEstadisticasLlamadas(periodo),
      ]);
      setResumen(res);
      setLlamadas(llam);
      setEstadisticas(stats);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarProspectos = async () => {
    try {
      const pros = await getProspectos({ limite: 200 });
      setProspectos(pros.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarLlamadas(filtroFecha, filtroPeriodo as "dia" | "mes" | "semana");
    cargarProspectos();
  }, []);

  // Ajustar formato de fecha al cambiar período
  useEffect(() => {
    if (filtroPeriodo === "mes" && filtroFecha.length > 7) {
      setFiltroFecha((prev) => prev.slice(0, 7));
    } else if (filtroPeriodo !== "mes" && filtroFecha.length === 7) {
      setFiltroFecha((prev) => `${prev}-01`);
    }
  }, [filtroPeriodo]);

  // ── Guardar llamada ─────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.prospecto_id) return;
    setCargando(true);
    try {
      await crearLlamada({ ...form, resultado: form.resultado || undefined });
      setModalAbierto(false);
      setForm(FORM_INICIAL);
      await cargarLlamadas(filtroFecha, filtroPeriodo as "dia" | "mes" | "semana");
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // ── Exportar Excel ──────────────────────────────────────
  const exportarExcel = () => {
    const rows = llamadas.map((l: any) => ({
      "Empresa":         l.empresa         ?? "",
      "Contacto":        l.nombre_contacto ?? "",
      "Canal":           l.canal,
      "Contestada":      l.contestada ? "Sí" : "No",
      "Duración (min)":  l.duracion_minutos ?? 0,
      "Resultado":       l.resultado ?? "",
      "Notas":           l.notas     ?? "",
      "Fecha":           l.fecha ? new Date(l.fecha).toLocaleDateString("es-PE") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Llamadas");
    XLSX.writeFile(wb, `llamadas_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── KPIs ────────────────────────────────────────────────
  const totalLlamadas     = resumen.reduce((acc, r) => acc + parseInt(r.por_canal || 0), 0);
  const totalContestadas  = resumen.reduce((acc, r) => acc + parseInt(r.contestadas || 0), 0);
  const totalNoContestadas = resumen.reduce((acc, r) => acc + parseInt(r.no_contestadas || 0), 0);

  // ── Estadísticas por período ────────────────────────────
  const estadisticasPorPeriodo = useMemo(() => {
    return estadisticas.map((stat) => {
      const fecha = new Date(stat.periodo);
      let fechaLabel: string;

      if (filtroPeriodo === "dia") {
        fechaLabel = fecha.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
      } else if (filtroPeriodo === "semana") {
        fechaLabel = `Semana del ${fecha.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}`;
      } else {
        fechaLabel = fecha.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
      }

      return {
        fecha:         fechaLabel,
        total:         stat.total,
        contestadas:   stat.contestadas,
        no_contestadas: stat.no_contestadas,
      };
    });
  }, [estadisticas, filtroPeriodo]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Llamadas</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Registro de contactos realizados</p>
        </div>
        <div className="flex gap-2">
          {llamadas.length > 0 && (
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              <FileDown size={15} /> Exportar Excel
            </button>
          )}
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus size={15} /> Registrar llamada
          </button>
        </div>
      </div>

      {/* Filtros de fecha */}
      <FiltrosFecha
        filtroPeriodo={filtroPeriodo}
        filtroFecha={filtroFecha}
        onPeriodoChange={setFiltroPeriodo}
        onFechaChange={setFiltroFecha}
        onAplicar={() => cargarLlamadas(filtroFecha, filtroPeriodo as "dia" | "mes" | "semana")}
      />

      {/* KPIs */}
      <KpisLlamadas
        total={totalLlamadas}
        contestadas={totalContestadas}
        noContestadas={totalNoContestadas}
      />

      {/* Estadísticas por período + resumen por canal */}
      <EstadisticasPeriodo
        estadisticas={estadisticasPorPeriodo}
        resumen={resumen}
        filtroPeriodo={filtroPeriodo}
        onPeriodoChange={setFiltroPeriodo}
      />

      {/* Historial */}
      <HistorialLlamadas llamadas={llamadas} onEditar={editar.abrir} />

      {/* Modal editar llamada */}
      {editar.editando && (
        <ModalEditarLlamada
          llamada={editar.editando}
          guardando={editar.guardando}
          error={editar.error}
          onGuardar={handleGuardarEdicion}
          onCerrar={editar.cerrar}
        />
      )}

      {/* Modal registrar */}
      {modalAbierto && (
        <ModalRegistrarLlamada
          form={form}
          prospectos={prospectos}
          cargando={cargando}
          onFormChange={setForm}
          onGuardar={handleGuardar}
          onCerrar={() => setModalAbierto(false)}
        />
      )}

    </div>
  );
}