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
  getHeatmapLlamadas,
} from "../services/llamadas.api";
import { getProspectos }    from "../services/prospectos.api";
import { getMotivosPerdida } from "../services/prospectos.api";

import { KpisLlamadas }           from "../components/llamadas/KpisLlamadas";
import { FiltrosFecha }           from "../components/llamadas/FiltrosFecha";
import { EstadisticasPeriodo }    from "../components/llamadas/EstadisticasPeriodo";
import { HistorialLlamadas }      from "../components/llamadas/HistorialLlamadas";
import { ModalRegistrarLlamada, type FormLlamada } from "../components/llamadas/ModalRegistrarLlamada";
import { ModalEditarLlamada }     from "../components/llamadas/ModalEditarLlamada";
import { HeatmapHoras }           from "../components/llamadas/HeatmapHoras";
import { MotivosChart }           from "../components/llamadas/MotivosChart";
import { useEditar }              from "../hooks/useEditar";

// ── Helpers ──────────────────────────────────────────────────────────────────

const getNow = () => {
  const now = new Date();
  return {
    fecha:       now.toISOString().split("T")[0],
    hora_inicio: `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,
  };
};

const getFormInicial = (): FormLlamada => ({
  prospecto_id: "",
  ...getNow(),
  hora_fin:     "",
  canal:        "llamada",
  contestada:   false,
  resultado:    "",
  notas:        "",
});

const calcularRangoFecha = (fecha: string, periodo: "dia" | "semana" | "mes") => {
  if (periodo === "mes") {
    const [year, month] = fecha.split("-").map(Number);
    if (!year || !month) return { fecha_inicio: undefined, fecha_fin: undefined };
    const inicio = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
    const finMes = month === 12
      ? `${year + 1}-01-01T00:00:00.000Z`
      : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00.000Z`;
    return { fecha_inicio: inicio, fecha_fin: finMes };
  }
  if (!fecha) return { fecha_inicio: undefined, fecha_fin: undefined };
  const [y, m, d] = fecha.split("-").map(Number);
  if (periodo === "dia") {
    const inicio = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T00:00:00.000Z`;
    return { fecha_inicio: inicio, fecha_fin: new Date(Date.UTC(y, m-1, d+1)).toISOString() };
  }
  const dia    = new Date(Date.UTC(y, m-1, d));
  const ajuste = (dia.getUTCDay() + 6) % 7;
  const ini    = new Date(Date.UTC(y, m-1, d - ajuste));
  const fin    = new Date(Date.UTC(y, m-1, d - ajuste + 7));
  return { fecha_inicio: ini.toISOString(), fecha_fin: fin.toISOString() };
};

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

// ── Componente ────────────────────────────────────────────────────────────────

export default function LlamadasPage() {
  const [resumen,      setResumen]      = useState<any[]>([]);
  const [llamadas,     setLlamadas]     = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [prospectos,   setProspectos]   = useState<any[]>([]);
  const [heatmap,      setHeatmap]      = useState<any[]>([]);
  const [motivos,      setMotivos]      = useState<any[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [form,         setForm]         = useState<FormLlamada>(getFormInicial);

  const editar = useEditar<any>();

  const handleGuardarEdicion = async (formEdit: any) => {
    await editar.guardar(async () => {
      const { hora_inicio, ...resto } = formEdit;
      const payload: any = { ...resto };
      if (hora_inicio && editar.editando?.fecha) {
        const fechaBase = editar.editando.fecha.split("T")[0];
        payload.fecha = `${fechaBase}T${hora_inicio}:00.000Z`;
      }
      await actualizarLlamada(editar.editando!.id, payload);
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
      const [res, llam, stats, heat] = await Promise.all([
        getResumenLlamadas(rango),
        getAllLlamadas(rango),
        getEstadisticasLlamadas(periodo, rango),
        getHeatmapLlamadas(rango),
      ]);
      setResumen(res);
      setLlamadas(llam);
      setEstadisticas(stats);
      setHeatmap(heat);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    cargarLlamadas(filtroFecha, filtroPeriodo as "dia" | "mes" | "semana");
    getProspectos({ limite: 200 }).then(p => setProspectos(p.data)).catch(console.error);
    getMotivosPerdida().then(setMotivos).catch(console.error);
  }, []);

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
      const fechaISO = `${form.fecha}T${form.hora_inicio}:00.000Z`;
      await crearLlamada({
        prospecto_id: form.prospecto_id,
        fecha:        fechaISO,
        hora_fin:     form.hora_fin || undefined,
        canal:        form.canal,
        contestada:   form.contestada,
        resultado:    form.resultado || undefined,
        notas:        form.notas    || undefined,
      });
      setModalAbierto(false);
      setForm(getFormInicial());
      await cargarLlamadas(filtroFecha, filtroPeriodo as "dia" | "mes" | "semana");
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  // ── Exportar Excel ──────────────────────────────────────
  const exportarExcel = () => {
    const rows = llamadas.map((l: any) => ({
      "Empresa":    l.empresa          ?? "",
      "Contacto":   l.nombre_contacto  ?? "",
      "Canal":      l.canal,
      "Contestada": l.contestada ? "Sí" : "No",
      "Hora inicio": l.fecha ? new Date(l.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "",
      "Hora fin":   l.hora_fin ?? "",
      "Resultado":  l.resultado ?? "",
      "Notas":      l.notas    ?? "",
      "Fecha":      l.fecha ? new Date(l.fecha).toLocaleDateString("es-PE") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Llamadas");
    XLSX.writeFile(wb, `llamadas_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── KPIs ────────────────────────────────────────────────
  const totalLlamadas      = resumen.reduce((acc, r) => acc + parseInt(r.por_canal  || 0), 0);
  const totalContestadas   = resumen.reduce((acc, r) => acc + parseInt(r.contestadas || 0), 0);
  const totalNoContestadas = resumen.reduce((acc, r) => acc + parseInt(r.no_contestadas || 0), 0);

  const estadisticasPorPeriodo = useMemo(() => estadisticas.map((stat) => {
    let fechaLabel: string;
    if (filtroPeriodo === "dia") {
      // stat.periodo is an integer hour (0–23)
      const hora = typeof stat.periodo === "number" ? stat.periodo : parseInt(String(stat.periodo));
      fechaLabel = `${String(hora).padStart(2, "0")}:00`;
    } else {
      // stat.periodo is a date string "2026-01-15" (postgres DATE → string)
      const dateStr = (stat.periodo instanceof Date)
        ? stat.periodo.toISOString().split("T")[0]
        : String(stat.periodo).split("T")[0];
      const [, mo, dy] = dateStr.split("-").map(Number);
      fechaLabel = `${dy} ${MESES[mo - 1]}`;
    }
    return { fecha: fechaLabel, total: stat.total, contestadas: stat.contestadas, no_contestadas: stat.no_contestadas };
  }), [estadisticas, filtroPeriodo]);

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
            <button onClick={exportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition">
              <FileDown size={15} /> Exportar Excel
            </button>
          )}
          <button onClick={() => { setForm(getFormInicial()); setModalAbierto(true); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            <Plus size={15} /> Registrar llamada
          </button>
        </div>
      </div>

      {/* Filtros */}
      <FiltrosFecha
        filtroPeriodo={filtroPeriodo}
        filtroFecha={filtroFecha}
        onPeriodoChange={setFiltroPeriodo}
        onFechaChange={setFiltroFecha}
        onAplicar={() => cargarLlamadas(filtroFecha, filtroPeriodo as "dia" | "mes" | "semana")}
      />

      {/* KPIs */}
      <KpisLlamadas total={totalLlamadas} contestadas={totalContestadas} noContestadas={totalNoContestadas} />

      {/* Estadísticas + canal */}
      <EstadisticasPeriodo
        estadisticas={estadisticasPorPeriodo}
        resumen={resumen}
        filtroPeriodo={filtroPeriodo}
        onPeriodoChange={setFiltroPeriodo}
      />

      {/* Heatmap + Motivos en paralelo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeatmapHoras data={heatmap} />
        <MotivosChart data={motivos} />
      </div>

      {/* Historial */}
      <HistorialLlamadas llamadas={llamadas} onEditar={editar.abrir} />

      {editar.editando && (
        <ModalEditarLlamada
          llamada={editar.editando}
          guardando={editar.guardando}
          error={editar.error}
          onGuardar={handleGuardarEdicion}
          onCerrar={editar.cerrar}
        />
      )}

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
