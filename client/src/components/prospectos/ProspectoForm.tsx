/**client/src/prospectos/ProspectosForm.tsx */
import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { crearProspecto, actualizarProspecto } from "../../services/prospectos.api";
import type { Prospecto } from "../../types/prospecto.types";

const ESTADOS_LEAD = [
  { value: "interesado",         label: "Interesado" },
  { value: "no_interesado",      label: "No interesado" },
  { value: "no_contesta",        label: "No contesta" },
  { value: "volver_a_llamar",    label: "Volver a llamar" },
  { value: "buzon_de_voz",       label: "Buzón de voz" },
  { value: "fuera_de_servicio",  label: "Fuera de servicio" },
  { value: "numero_equivocado",  label: "Número equivocado" },
  { value: "ya_tiene_proveedor", label: "Ya tiene proveedor" },
];

const REGIONES = [
  { value: "amazonas",     label: "Amazonas" },
  { value: "ancash",       label: "Áncash" },
  { value: "apurimac",     label: "Apurímac" },
  { value: "arequipa",     label: "Arequipa" },
  { value: "ayacucho",     label: "Ayacucho" },
  { value: "cajamarca",    label: "Cajamarca" },
  { value: "callao",       label: "Callao" },
  { value: "cusco",        label: "Cusco" },
  { value: "huancavelica", label: "Huancavelica" },
  { value: "huanuco",      label: "Huánuco" },
  { value: "ica",          label: "Ica" },
  { value: "junin",        label: "Junín" },
  { value: "la_libertad",  label: "La Libertad" },
  { value: "lambayeque",   label: "Lambayeque" },
  { value: "lima",         label: "Lima" },
  { value: "loreto",       label: "Loreto" },
  { value: "madre_de_dios",label: "Madre de Dios" },
  { value: "moquegua",     label: "Moquegua" },
  { value: "pasco",        label: "Pasco" },
  { value: "piura",        label: "Piura" },
  { value: "puno",         label: "Puno" },
  { value: "san_martin",   label: "San Martín" },
  { value: "tacna",        label: "Tacna" },
  { value: "tumbes",       label: "Tumbes" },
  { value: "ucayali",      label: "Ucayali" },
];

const CLASIFICACIONES = [
  { value: "por_gestionar", label: "Por gestionar" },
  { value: "gestionado",    label: "Gestionado" },
  { value: "cerrado",       label: "Cerrado" },
  { value: "descartado",    label: "Descartado" },
];

const PRIORIDADES = [
  { value: "alta",  label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja",  label: "Baja" },
];

const FUENTES = [
  { value: "facebook",     label: "Facebook" },
  { value: "instagram",    label: "Instagram" },
  { value: "tiktok",       label: "TikTok" },
  { value: "linkedin",     label: "LinkedIn" },
  { value: "referido",     label: "Referido" },
  { value: "web",          label: "Web" },
  { value: "llamada_fria", label: "Llamada fría" },
  { value: "otro",         label: "Otro" },
];

interface ProspectoFormProps {
  prospecto?:  Partial<Prospecto>;
  onCerrar:    () => void;
  onGuardado?: () => void;
}

const ETAPAS_PIPELINE = [
  { value: "nuevo",             label: "Nuevo" },
  { value: "contactado",        label: "Contactado" },
  { value: "interesado",        label: "Interesado" },
  { value: "propuesta_enviada", label: "Propuesta enviada" },
  { value: "negociacion",       label: "Negociación" },
  { value: "cerrado_ganado",    label: "Cerrado — Ganado" },
  { value: "perdido",           label: "Perdido" },
];

const INICIAL = {
  // Empresa
  empresa: "", rubro: "", pagina_web: "", tamano_empresa: "",
  web_activa: "", proveedor_web: "",
  // Contacto
  nombre_contacto: "", cargo: "", telefono: "", email_contacto: "",
  ciudad: "", region: "",
  // CRM
  estado_lead: "no_contesta", clasificacion: "por_gestionar",
  prioridad: "media", fuente: "", estado_venta: "no", notas: "",
  etapa_pipeline: "nuevo", valor_estimado: "",
  // Llamadas
  canal_llamada: "", contesto: "", devolvio_llamada: "", intentos: "",
  // Brochure
  brochure: "", canal_brochure: "",
  // Reunión
  agenda_reunion: "", modalidad_reunion: "", fecha_reunion: "",
  hora_reunion: "", ingreso_reunion: "", estado_reunion: "",
};

const selectClass = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

export function ProspectoForm({ prospecto, onCerrar, onGuardado }: ProspectoFormProps) {
  const esEdicion = !!prospecto?.id;
  const [form, setForm] = useState({ ...INICIAL });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (prospecto) {
      const p = prospecto as any;
      // Extraer datos de llamadas/brochures/reuniones si existen
      const llamada  = p.llamadas?.[0];
      const brochure = p.brochures?.[0];
      const reunion  = p.reuniones?.[0];

      setForm({
        empresa:          p.empresa         ?? "",
        rubro:            p.rubro           ?? "",
        pagina_web:       p.pagina_web      ?? "",
        web_activa:       p.web_activa      ?? "",
        proveedor_web:    p.proveedor_web   ?? "",
        tamano_empresa:   p.tamano_empresa  ?? "",
        nombre_contacto:  p.nombre_contacto ?? "",
        cargo:            p.cargo           ?? "",
        telefono:         p.telefono        ?? "",
        email_contacto:   p.email_contacto  ?? "",
        ciudad:           p.ciudad          ?? "",
        region:           p.region          ?? "",
        estado_lead:      p.estado_lead     ?? "no_contesta",
        clasificacion:    p.clasificacion   ?? "por_gestionar",
        prioridad:        p.prioridad       ?? "media",
        fuente:           p.fuente          ?? "",
        estado_venta:     p.estado_venta    ?? "no",
        notas:            p.notas           ?? "",
        etapa_pipeline:   p.etapa_pipeline  ?? "nuevo",
        valor_estimado:   p.valor_estimado != null ? String(p.valor_estimado) : "",
        // Llamadas
        canal_llamada:    llamada?.canal    ?? "",
        contesto:         llamada?.contestada ? "true" : "",
        devolvio_llamada: "",
        intentos:         "",
        // Brochure
        brochure:         brochure ? "true" : "",
        canal_brochure:   brochure?.canal   ?? "",
        // Reunión
        agenda_reunion:   reunion ? "true" : "",
        modalidad_reunion: reunion?.modalidad ?? "",
        fecha_reunion:    reunion?.fecha_hora?.split("T")[0] ?? "",
        hora_reunion:     reunion?.fecha_hora?.split("T")[1]?.slice(0, 5) ?? "",
        ingreso_reunion:  "",
        estado_reunion:   reunion?.estado   ?? "",
      });
    }
  }, [prospecto]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleGuardar() {
    if (!form.empresa.trim()) { setError("La empresa es obligatoria"); return; }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        empresa:          form.empresa,
        rubro:            form.rubro || undefined,
        pagina_web:       form.pagina_web || undefined,
        web_activa:       form.web_activa === "true" ? true : form.web_activa === "false" ? false : undefined,
        proveedor_web:    form.proveedor_web || undefined,
        tamano_empresa:   form.tamano_empresa || undefined,
        nombre_contacto:  form.nombre_contacto || undefined,
        cargo:            form.cargo || undefined,
        telefono:         form.telefono || undefined,
        email_contacto:   form.email_contacto || undefined,
        ciudad:           form.ciudad || undefined,
        region:           form.region || undefined,
        estado_lead:      form.estado_lead,
        clasificacion:    form.clasificacion,
        prioridad:        form.prioridad,
        fuente:           form.fuente || undefined,
        estado_venta:     form.estado_venta,
        notas:            form.notas || undefined,
        motivo_perdida:   (form as any).motivo_perdida || null,
        etapa_pipeline:   (form as any).etapa_pipeline || "nuevo",
        valor_estimado:   (form as any).valor_estimado ? parseFloat((form as any).valor_estimado) : null,
      };

      if (esEdicion && prospecto?.id) {
        await actualizarProspecto(prospecto.id, payload);
      } else {
        await crearProspecto(payload);
      }
      onGuardado?.();
      onCerrar();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={esEdicion ? `Editar — ${prospecto?.empresa}` : "Nuevo prospecto"}
      size="xl"
    >
      <div className="space-y-5">

        {/* ── EMPRESA ── */}
        <div>
          <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide mb-3">Empresa</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Empresa *" placeholder="Nombre de la empresa"
              value={form.empresa} onChange={e => set("empresa", e.target.value)} />
            <Input label="Rubro" placeholder="Ej: Tecnología, Retail..."
              value={form.rubro} onChange={e => set("rubro", e.target.value)} />
            <Input label="Enlace web" placeholder="https://..."
              value={form.pagina_web} onChange={e => set("pagina_web", e.target.value)} />
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">¿Web activa?</label>
              <select value={form.web_activa} onChange={e => set("web_activa", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <Input label="Proveedor web" placeholder="Ej: Wix, WordPress, agencia..."
              value={form.proveedor_web} onChange={e => set("proveedor_web", e.target.value)} />
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Tamaño empresa</label>
              <select value={form.tamano_empresa} onChange={e => set("tamano_empresa", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="1_10">1 - 10</option>
                <option value="11_50">11 - 50</option>
                <option value="51_200">51 - 200</option>
                <option value="201_500">201 - 500</option>
                <option value="mas_500">Más de 500</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── CONTACTO ── */}
        <div>
          <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide mb-3">Contacto</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre contacto" placeholder="Nombre completo"
              value={form.nombre_contacto} onChange={e => set("nombre_contacto", e.target.value)} />
            <Input label="Cargo" placeholder="Ej: Gerente General"
              value={form.cargo} onChange={e => set("cargo", e.target.value)} />
            <Input label="Teléfono" placeholder="+51 999 999 999"
              value={form.telefono} onChange={e => set("telefono", e.target.value)} />
            <Input label="Email" type="email" placeholder="correo@empresa.com"
              value={form.email_contacto} onChange={e => set("email_contacto", e.target.value)} />
            <Input label="Ciudad" placeholder="Ej: Lima"
              value={form.ciudad} onChange={e => set("ciudad", e.target.value)} />
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Región</label>
              <select value={form.region} onChange={e => set("region", e.target.value)} className={selectClass}>
                <option value="">Seleccione una región</option>
                {REGIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── CRM ── */}
        <div>
          <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide mb-3">CRM</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Estado del lead</label>
              <select value={form.estado_lead} onChange={e => set("estado_lead", e.target.value)} className={selectClass}>
                {ESTADOS_LEAD.filter(e => e.value !== "contestada").map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Clasificación</label>
              <select value={form.clasificacion} onChange={e => set("clasificacion", e.target.value)} className={selectClass}>
                {CLASIFICACIONES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {/* Motivo de pérdida — aparece solo cuando el lead es perdido */}
            {(form.estado_lead === "no_interesado" || form.estado_lead === "ya_tiene_proveedor") && (
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-red-600">¿Por qué no cerró? (motivo de pérdida)</label>
                <select value={(form as any).motivo_perdida ?? ""} onChange={e => set("motivo_perdida", e.target.value)} className={selectClass}>
                  <option value="">Sin especificar</option>
                  <option value="precio_alto">Precio alto</option>
                  <option value="ya_tiene_proveedor">Ya tiene proveedor</option>
                  <option value="sin_presupuesto">Sin presupuesto</option>
                  <option value="no_le_interesa">No le interesa el servicio</option>
                  <option value="tiene_web">Ya tiene web propia</option>
                  <option value="no_toma_decision">No es quien decide</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Prioridad</label>
              <select value={form.prioridad} onChange={e => set("prioridad", e.target.value)} className={selectClass}>
                {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Fuente</label>
              <select value={form.fuente} onChange={e => set("fuente", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                {FUENTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Estado de venta</label>
              <select value={form.estado_venta} onChange={e => set("estado_venta", e.target.value)} className={selectClass}>
                <option value="no">No</option>
                <option value="en_proceso">En proceso</option>
                <option value="si">Sí — Cerrada</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Etapa Pipeline</label>
              <select value={(form as any).etapa_pipeline ?? "nuevo"} onChange={e => set("etapa_pipeline", e.target.value)} className={selectClass}>
                {ETAPAS_PIPELINE.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Valor estimado (S/)</label>
              <input
                type="number" min="0" step="100"
                placeholder="Ej: 3500"
                value={(form as any).valor_estimado ?? ""}
                onChange={e => set("valor_estimado", e.target.value)}
                className={selectClass}
              />
            </div>
          </div>
        </div>

        {/* ── LLAMADAS ── */}
        <div>
          <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide mb-3">Llamadas</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Canal de contacto</label>
              <select value={form.canal_llamada} onChange={e => set("canal_llamada", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="llamada">Llamada</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="correo">Correo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">¿Contestó?</label>
              <select value={form.contesto} onChange={e => set("contesto", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">¿Devolvió llamada?</label>
              <select value={form.devolvio_llamada} onChange={e => set("devolvio_llamada", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <Input label="# Intentos" placeholder="Ej: 3"
              value={form.intentos} onChange={e => set("intentos", e.target.value)} />
          </div>
        </div>

        {/* ── BROCHURE ── */}
        <div>
          <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide mb-3">Brochure</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">¿Brochure enviado?</label>
              <select value={form.brochure} onChange={e => set("brochure", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Canal de envío</label>
              <select value={form.canal_brochure} onChange={e => set("canal_brochure", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="correo">Correo</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── REUNIÓN ── */}
        <div>
          <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide mb-3">Reunión</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">¿Agenda reunión?</label>
              <select value={form.agenda_reunion} onChange={e => set("agenda_reunion", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Modalidad</label>
              <select value={form.modalidad_reunion} onChange={e => set("modalidad_reunion", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
              </select>
            </div>
            <Input label="Fecha reunión" type="date"
              value={form.fecha_reunion} onChange={e => set("fecha_reunion", e.target.value)} />
            <Input label="Hora reunión" type="time"
              value={form.hora_reunion} onChange={e => set("hora_reunion", e.target.value)} />
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">¿Ingresó a la reunión?</label>
              <select value={form.ingreso_reunion} onChange={e => set("ingreso_reunion", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium gray-100">Estado de la reunión</label>
              <select value={form.estado_reunion} onChange={e => set("estado_reunion", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="agendada">Agendada</option>
                <option value="en_proceso">En proceso</option>
                <option value="cerrada">Cerrada</option>
                <option value="descartada">Descartada</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── NOTAS ── */}
        <div className="space-y-1">
          <label className="text-xs font-medium gray-100">Notas</label>
          <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
            placeholder="Observaciones generales del prospecto..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={handleGuardar}>
            {esEdicion ? "Guardar cambios" : "Crear prospecto"}
          </Button>
        </div>

      </div>
    </Modal>
  );
}