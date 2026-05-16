/**client/src/prospectos/ProspectoDetalle.tsx */

import { useEffect, useState } from "react";
import { Pencil, Phone, Calendar, FileText, Globe, Mail, MapPin, Building2, User, ClipboardList } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { LlamadaHistorial } from "../llamadas/LlamadaHistorial";
import { LlamadaForm } from "../llamadas/LlamadaForm";
import { ReunionForm } from "../reuniones/ReunionForm";
import { BrochureForm } from "../brochures/BrochureForm";
import { TablaPropuestas } from "./TablaPropuestas";
import { ModalPropuesta } from "./ModalPropuesta";
import { ModalEditarPropuesta } from "./ModalEditarPropuesta";
import { getProspecto } from "../../services/prospectos.api";
import { getReuniones } from "../../services/reuniones.api";
import { getBrochures } from "../../services/brochures.api";
import { usePropuestas } from "../../hooks/usePropuestas";
import type { Prospecto } from "../../types/prospecto.types";
import type { Reunion } from "../../types/reunion.types";
import type { Propuesta, FormPropuesta } from "../../types/propuesta.types";

const COLOR_ESTADO: Record<string, string> = {
  interesado:         "green",
  no_interesado:      "red",
  no_contesta:        "gray",
  volver_a_llamar:    "yellow",
  buzon_de_voz:       "orange",
  fuera_de_servicio:  "red",
  numero_equivocado:  "pink",
  ya_tiene_proveedor: "purple",
};

const LABEL_ESTADO: Record<string, string> = {
  interesado:         "Interesado",
  no_interesado:      "No interesado",
  no_contesta:        "No contesta",
  volver_a_llamar:    "Volver a llamar",
  buzon_de_voz:       "Buzón de voz",
  fuera_de_servicio:  "Fuera de servicio",
  numero_equivocado:  "Número equivocado",
  ya_tiene_proveedor: "Ya tiene proveedor",
};

const COLOR_PRIORIDAD: Record<string, "red" | "yellow" | "gray"> = {
  alta:  "red",
  media: "yellow",
  baja:  "gray",
};

const COLOR_VENTA: Record<string, "green" | "blue" | "gray"> = {
  si:         "green",
  en_proceso: "blue",
  no:         "gray",
};

interface ProspectoDetalleProps {
  prospecto: Prospecto;
  onCerrar:  () => void;
  onEditar:  () => void;
}

type Tab = "info" | "llamadas" | "reuniones" | "brochures" | "propuestas";

const FORM_PROPUESTA_VACIO: FormPropuesta = {
  servicio:        "desarrollo_web",
  descripcion:     "",
  monto_propuesto: "",
  monto_cerrado:   "",
  moneda:          "PEN",
  tipo_cambio:     "1",
  estado:          "enviada",
  fecha_propuesta: new Date().toISOString().split("T")[0],
  fecha_cierre:    "",
  notas:           "",
};

export function ProspectoDetalle({ prospecto, onCerrar, onEditar }: ProspectoDetalleProps) {
  const [tab, setTab]               = useState<Tab>("info");
  const [detalle, setDetalle]       = useState<Prospecto>(prospecto);
  const [reuniones, setReuniones]   = useState<Reunion[]>([]);
  const [brochures, setBrochures]   = useState<any[]>([]);
  const [, setCargando]     = useState(false);

  const [modalLlamada,  setModalLlamada]  = useState(false);
  const [modalReunion,  setModalReunion]  = useState(false);
  const [modalBrochure, setModalBrochure] = useState(false);

  // ── Propuestas ───────────────────────────────────────────────
  const { propuestas, cargarPropuestas, agregarPropuesta, editarPropuesta, borrarPropuesta } =
    usePropuestas(prospecto.id);

  const [modalNuevaPropuesta,  setModalNuevaPropuesta]  = useState(false);
  const [propuestaEditando,    setPropuestaEditando]    = useState<Propuesta | null>(null);
  const [formPropuesta,        setFormPropuesta]        = useState<FormPropuesta>(FORM_PROPUESTA_VACIO);
  const [guardandoPropuesta,   setGuardandoPropuesta]   = useState(false);

  useEffect(() => {
    cargarDetalle();
    cargarPropuestas();
  }, [prospecto.id]);

  async function cargarDetalle() {
    setCargando(true);
    try {
      const [det, reuns, broch] = await Promise.all([
        getProspecto(prospecto.id),
        getReuniones({ prospecto_id: prospecto.id }),
        getBrochures(prospecto.id),
      ]);
      setDetalle(det);
      setReuniones(reuns);
      setBrochures(broch);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  async function handleGuardarPropuesta() {
    setGuardandoPropuesta(true);
    try {
      await agregarPropuesta({
        prospecto_id:    prospecto.id,
        servicio:        formPropuesta.servicio as any,
        descripcion:     formPropuesta.descripcion,
        monto_propuesto: parseFloat(formPropuesta.monto_propuesto) || 0,
        monto_cerrado:   formPropuesta.monto_cerrado ? parseFloat(formPropuesta.monto_cerrado) : null,
        moneda:          formPropuesta.moneda,
        tipo_cambio:     parseFloat(formPropuesta.tipo_cambio) || 1,
        estado:          formPropuesta.estado as any,
        fecha_propuesta: formPropuesta.fecha_propuesta,
        fecha_cierre:    (formPropuesta.fecha_cierre || null) as any,
        notas:           formPropuesta.notas || "",
      });
      setModalNuevaPropuesta(false);
      setFormPropuesta(FORM_PROPUESTA_VACIO);
    } catch (err) {
      console.error(err);
    } finally {
      setGuardandoPropuesta(false);
    }
  }

  async function handleEditarPropuesta() {
    if (!propuestaEditando) return;
    setGuardandoPropuesta(true);
    try {
      await editarPropuesta(propuestaEditando.id, {
        servicio:        formPropuesta.servicio as any,
        descripcion:     formPropuesta.descripcion,
        monto_propuesto: parseFloat(formPropuesta.monto_propuesto) || 0,
        monto_cerrado:   formPropuesta.monto_cerrado ? parseFloat(formPropuesta.monto_cerrado) : null,
        moneda:          formPropuesta.moneda,
        tipo_cambio:     parseFloat(formPropuesta.tipo_cambio) || 1,
        estado:          formPropuesta.estado as any,
        fecha_propuesta: formPropuesta.fecha_propuesta,
        fecha_cierre:    (formPropuesta.fecha_cierre || null) as any,
        notas:           formPropuesta.notas || "",
      });
      setPropuestaEditando(null);
      // Recargar detalle del prospecto para reflejar cambios de estado_venta/clasificacion
      cargarDetalle();
    } catch (err) {
      console.error(err);
    } finally {
      setGuardandoPropuesta(false);
    }
  }

  function abrirEditarPropuesta(p: Propuesta) {
    setPropuestaEditando(p);
    setFormPropuesta({
      servicio:        p.servicio as any,
      descripcion:     p.descripcion,
      monto_propuesto: String(p.monto_propuesto),
      monto_cerrado:   p.monto_cerrado != null ? String(p.monto_cerrado) : "",
      moneda:          p.moneda as any,
      tipo_cambio:     String(p.tipo_cambio),
      estado:          p.estado as any,
      fecha_propuesta: p.fecha_propuesta,
      fecha_cierre:    p.fecha_cierre ?? "",
      notas:           p.notas ?? "",
    });
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "info",       label: "Información",  icon: <Building2 size={14} /> },
    { key: "llamadas",   label: "Llamadas",     icon: <Phone size={14} /> },
    { key: "reuniones",  label: "Reuniones",    icon: <Calendar size={14} /> },
    { key: "brochures",  label: "Brochures",    icon: <FileText size={14} /> },
    { key: "propuestas", label: "Propuestas",   icon: <ClipboardList size={14} /> },
  ];

  return (
    <>
      <Modal abierto onCerrar={onCerrar} titulo={detalle.empresa} size="xl">
        {/* Badges superiores */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <Badge color={COLOR_ESTADO[detalle.estado_lead] as any}>
            {LABEL_ESTADO[detalle.estado_lead] ?? detalle.estado_lead}
          </Badge>
          <Badge color={COLOR_PRIORIDAD[detalle.prioridad]}>
            Prioridad {detalle.prioridad}
          </Badge>
          <Badge color={COLOR_VENTA[detalle.estado_venta]}>
            Venta: {detalle.estado_venta === "si" ? "Cerrada" : detalle.estado_venta === "en_proceso" ? "En proceso" : "No"}
          </Badge>
          {detalle.clasificacion && (
            <Badge color="blue">
              Clasificación: {detalle.clasificacion}
            </Badge>
          )}
          {detalle.fuente && (
            <Badge color="gray">
              Fuente: {detalle.fuente}
            </Badge>
          )}
          <div className="ml-auto">
            <Button size="sm" variant="secondary" onClick={onEditar}>
              <Pencil size={13} /> Editar
            </Button>
          </div>
        </div>

        {/* Tabs informacion-llamadas-reuniones etc*/}
        <div className="overflow-x-auto mb-5 -mx-1 px-1">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg min-w-max">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition shrink-0 whitespace-nowrap
                  ${tab === t.key ? "bg-white shadow-sm text-zinc-800 font-medium" : "text-zinc-800 hover:text-gray-700"}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB: Información */}
        {tab === "info" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Empresa */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide">Empresa</p>
                {detalle.rubro && (
                  <div className="flex items-start gap-2">
                    <Building2 size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-700">{detalle.rubro}</span>
                  </div>
                )}
                {detalle.pagina_web && (
                  <div className="flex items-start gap-2">
                    <Globe size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <a href={detalle.pagina_web} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline truncate">
                      {detalle.pagina_web}
                    </a>
                  </div>
                )}
                {detalle.web_activa !== undefined && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-zinc-800 mt-0.5 shrink-0">Web activa:</span>
                    <span className="text-xs text-gray-700">{detalle.web_activa ? "Sí" : "No"}</span>
                  </div>
                )}
                {detalle.proveedor_web && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-zinc-800 mt-0.5 shrink-0">Proveedor:</span>
                    <span className="text-xs text-gray-700">{detalle.proveedor_web}</span>
                  </div>
                )}
                {detalle.ciudad && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-700">
                      {detalle.ciudad}{detalle.region ? `, ${detalle.region}` : ""}{detalle.pais ? `, ${detalle.pais}` : ""}
                    </span>
                  </div>
                )}
                {detalle.tamano_empresa && (
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-700">{detalle.tamano_empresa.replace(/_/g, " ")} empleados</span>
                  </div>
                )}
              </div>

              {/* Contacto */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide">Contacto</p>
                {detalle.nombre_contacto && (
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-700">{detalle.nombre_contacto}</p>
                      {detalle.cargo && <p className="text-xs text-zinc-800">{detalle.cargo}</p>}
                    </div>
                  </div>
                )}
                {detalle.telefono && (
                  <div className="flex items-start gap-2">
                    <Phone size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <a href={`tel:${detalle.telefono}`} className="text-xs text-gray-700 hover:text-blue-500 transition">
                      {detalle.telefono}
                    </a>
                  </div>
                )}
                {detalle.email_contacto && (
                  <div className="flex items-start gap-2">
                    <Mail size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <a href={`mailto:${detalle.email_contacto}`} className="text-xs text-gray-700 hover:text-blue-500 transition truncate">
                      {detalle.email_contacto}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            {detalle.notas && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide mb-2">Notas</p>
                <p className="text-xs gray-100 whitespace-pre-wrap">{detalle.notas}</p>
              </div>
            )}

            {/* Fechas */}
            <div className="flex gap-4 text-xs text-zinc-800 pt-1 border-t border-gray-100">
              <span>Creado: {new Date(detalle.creado_en).toLocaleDateString("es-PE")}</span>
              <span>Actualizado: {new Date(detalle.actualizado_en).toLocaleDateString("es-PE")}</span>
            </div>
          </div>
        )}

        {/* TAB: Llamadas */}
        {tab === "llamadas" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalLlamada(true)}>
                <Phone size={13} /> Registrar llamada
              </Button>
            </div>
            <LlamadaHistorial prospectoId={prospecto.id} />
          </div>
        )}

        {/* TAB: Reuniones */}
        {tab === "reuniones" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalReunion(true)}>
                <Calendar size={13} /> Nueva reunión
              </Button>
            </div>
            {reuniones.length === 0 ? (
              <p className="text-xs text-zinc-800 text-center py-6">Sin reuniones registradas</p>
            ) : (
              <div className="space-y-2">
                {reuniones.map(r => (
                  <div key={r.id} className="p-3 rounded-lg border border-gray-100 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-zinc-800">{r.titulo}</p>
                      <p className="text-xs text-zinc-800 mt-0.5 capitalize">{r.modalidad.replace("_", " ")}</p>
                      {r.notas && <p className="text-xs text-zinc-800 mt-1">{r.notas}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs font-medium text-gray-700">
                        {new Date(r.fecha_hora).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-zinc-800">
                        {new Date(r.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <Badge color={r.estado === "realizada" ? "green" : r.estado === "cancelada" ? "red" : "blue"}>
                        {r.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Brochures */}
        {tab === "brochures" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalBrochure(true)}>
                <FileText size={13} /> Registrar envío
              </Button>
            </div>
            {brochures.length === 0 ? (
              <p className="text-xs text-zinc-800 text-center py-6">Sin brochures enviados</p>
            ) : (
              <div className="space-y-2">
                {brochures.map(b => (
                  <div key={b.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-gray-700 capitalize">{b.canal}</span>
                      {b.notas && <p className="text-xs text-zinc-800 mt-0.5">{b.notas}</p>}
                    </div>
                    <span className="text-xs text-zinc-800">
                      {new Date(b.fecha_envio).toLocaleDateString("es-PE")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Propuestas */}
        {tab === "propuestas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {propuestas.length} propuesta{propuestas.length !== 1 ? "s" : ""} registrada{propuestas.length !== 1 ? "s" : ""}
              </p>
              <Button size="sm" onClick={() => { setFormPropuesta(FORM_PROPUESTA_VACIO); setModalNuevaPropuesta(true); }}>
                <ClipboardList size={13} /> Nueva propuesta
              </Button>
            </div>
            <TablaPropuestas
              propuestas={propuestas}
              onEditar={abrirEditarPropuesta}
              onEliminar={borrarPropuesta}
            />
          </div>
        )}
      </Modal>

      {/* Sub-modales */}
      <LlamadaForm
        abierto={modalLlamada}
        onCerrar={() => setModalLlamada(false)}
        prospectoId={prospecto.id}
        onGuardado={cargarDetalle}
      />
      <ReunionForm
        abierto={modalReunion}
        onCerrar={() => setModalReunion(false)}
        prospectoId={prospecto.id}
        onGuardado={cargarDetalle}
      />
      <BrochureForm
        abierto={modalBrochure}
        onCerrar={() => setModalBrochure(false)}
        prospectoId={prospecto.id}
        onGuardado={cargarDetalle}
      />

      {/* Modal nueva propuesta */}
      {modalNuevaPropuesta && (
        <ModalPropuesta
          form={formPropuesta}
          cargando={guardandoPropuesta}
          onFormChange={setFormPropuesta}
          onGuardar={handleGuardarPropuesta}
          onCerrar={() => setModalNuevaPropuesta(false)}
        />
      )}

      {/* Modal editar propuesta */}
      {propuestaEditando && (
        <ModalEditarPropuesta
          propuesta={propuestaEditando}
          form={formPropuesta}
          cargando={guardandoPropuesta}
          onFormChange={setFormPropuesta}
          onGuardar={handleEditarPropuesta}
          onCerrar={() => setPropuestaEditando(null)}
        />
      )}
    </>
  );
}