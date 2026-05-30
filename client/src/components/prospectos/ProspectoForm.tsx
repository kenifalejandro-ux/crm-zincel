/**client/src/prospectos/ProspectosForm.tsx */
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  Building2, Tag, Globe, Server,
  User, Briefcase, Phone, Mail, MapPin,
  StickyNote,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { crearProspecto, actualizarProspecto } from "../../services/prospectos.api";
import { upsertContactoSecundario, eliminarContactoSecundario } from "../../services/prospectos.api";
import type { Prospecto } from "../../types/prospecto.types";

/** Campo con icono + línea inferior, sin borde completo */
function Field({ icon, label, required, children }: { icon: ReactNode; label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-zinc-400 font-medium">
        {label}{required && <span className="text-brand ml-0.5">*</span>}
      </label>
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-1.5 focus-within:border-brand transition-colors group">
        <span className="text-yellow-500 group-focus-within:text-brand transition-colors shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}

{/**texto de relleno de los campos del formulario */
}const fieldInput = "flex-1 text-xs text-zinc-100 bg-transparent outline-none placeholder:text-zinc-500 min-w-0";

const ESTADOS_LEAD = [
  { value: "nuevo",               label: "Nuevo (última carga)" },
  { value: "por_gestionar",       label: "Por gestionar" },
  { value: "interesado",          label: "Interesado" },
  { value: "solicita_informacion", label: "Solicita información" },
  { value: "no_interesado",       label: "No interesado" },
  { value: "no_contesta",         label: "No contesta" },
  { value: "volver_a_llamar",     label: "Volver a llamar" },
  { value: "buzon_de_voz",        label: "Buzón de voz" },
  { value: "fuera_de_servicio",   label: "Fuera de servicio" },
  { value: "numero_equivocado",   label: "Número equivocado" },
  { value: "ya_tiene_proveedor",  label: "Empresa con página web" },
  { value: "baja_de_oficio",      label: "Baja de oficio" },
  { value: "suspension_temporal", label: "Suspensión temporal" },
  { value: "perdida",             label: "Venta perdida" },
];

// Prioridad automática según tamaño + estado web
function calcularPrioridad(tamano: string, estadoWeb: string): string | null {
  if (estadoWeb === "actualizada") return "baja";
  const base: Record<string, string> = {
    "1_10": "baja", "11_50": "media",
    "51_200": "alta", "201_500": "alta", "mas_500": "alta",
  };
  const p = base[tamano];
  if (!p) return null;
  const webConOportunidad = ["por_actualizar", "vencida", "en_mantenimiento", "sin_informacion"];
  if (tamano === "1_10" && webConOportunidad.includes(estadoWeb)) return "media";
  return p;
}

// Clasificación automática según estado del lead
const AUTO_CLASIFICACION: Record<string, string> = {
  nuevo:                "por_gestionar",
  por_gestionar:        "por_gestionar",
  interesado:           "gestionado",
  solicita_informacion: "gestionado",
  no_contesta:          "gestionado",
  volver_a_llamar:      "gestionado",
  buzon_de_voz:         "gestionado",
  fuera_de_servicio:    "gestionado",
  numero_equivocado:    "gestionado",
  baja_de_oficio:       "descartado",
  no_interesado:        "descartado",
  ya_tiene_proveedor:   "descartado",
  suspension_temporal:  "descartado",
  perdida:              "descartado",
};

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
  { value: "base_propia",  label: "Base propia" },
  { value: "referido",     label: "Referido" },
  { value: "google_ads",   label: "Google Ads" },
  { value: "facebook",     label: "Facebook" },
  { value: "instagram",    label: "Instagram" },
  { value: "tiktok",       label: "TikTok" },
  { value: "linkedin",     label: "LinkedIn" },
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
  web_activa: "false", proveedor_web: "", estado_web: "",
  // Contacto
  nombre_contacto: "", cargo: "", telefono: "", email_contacto: "",
  ciudad: "", region: "",
  // CRM
  estado_lead: "por_gestionar", clasificacion: "por_gestionar",
  prioridad: "media", fuente: "", estado_venta: "no", notas: "",
  etapa_pipeline: "nuevo", motivo_perdida_detalle: "",
};
{/** boton desplegables  */
}
const selectClass = "w-full px-3 py-2.5 text-xs bg-zinc-800 border border-yellow-300/50 rounded-xl text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/50 transition-all";
const sectionHeader = (title: string) => (
  <div className="flex items-center gap-2.5 mb-4">
    <span className="w-1 h-3.5 rounded-full bg-brand block shrink-0" />
    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">{title}</span>
  </div>
);

export function ProspectoForm({ prospecto, onCerrar, onGuardado }: ProspectoFormProps) {
  const esEdicion = !!prospecto?.id;
  const [form, setForm] = useState({ ...INICIAL });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [contacto2, setContacto2] = useState({ id: "", nombre: "", cargo: "", telefono: "", email: "" });
  const setC2 = (k: string, v: string) => setContacto2(c => ({ ...c, [k]: v }));

  useEffect(() => {
    if (prospecto) {
      const p = prospecto as any;
      const c2 = p.contactos?.[0];
      if (c2) setContacto2({ id: c2.id ?? "", nombre: c2.nombre ?? "", cargo: c2.cargo ?? "", telefono: c2.telefono ?? "", email: c2.email ?? "" });

      setForm({
        empresa:          p.empresa         ?? "",
        rubro:            p.rubro           ?? "",
        pagina_web:       p.pagina_web      ?? "",
        web_activa:       p.web_activa      ?? "",
        proveedor_web:    p.proveedor_web   ?? "",
        estado_web:       p.estado_web      ?? "",
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
        etapa_pipeline:         p.etapa_pipeline          ?? "nuevo",
        motivo_perdida_detalle: p.motivo_perdida_detalle  ?? "",
      });
    }
  }, [prospecto]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleGuardar() {
    const faltantes: string[] = [];
    if (!form.empresa.trim())   faltantes.push("Empresa");
    if (!form.rubro.trim())     faltantes.push("Rubro");
    if (!form.tamano_empresa)   faltantes.push("Tamaño de empresa");
    if (!form.region)           faltantes.push("Región");
    if (!form.ciudad.trim())    faltantes.push("Ciudad");
    if (!form.estado_lead)      faltantes.push("Estado del lead");
    if (!form.clasificacion)    faltantes.push("Clasificación");
    if (!form.prioridad)        faltantes.push("Prioridad");
    if (faltantes.length > 0) {
      setError(`Campos obligatorios incompletos: ${faltantes.join(", ")}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        empresa:          form.empresa,
        rubro:            form.rubro || undefined,
        pagina_web:       form.pagina_web || undefined,
        web_activa:       form.web_activa === "true" ? true : form.web_activa === "false" ? false : undefined,
        proveedor_web:    form.proveedor_web || undefined,
        estado_web:       form.web_activa === "true" && form.estado_web ? form.estado_web : null,
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
        motivo_perdida:         (form as any).motivo_perdida || null,
        motivo_perdida_detalle: (form as any).motivo_perdida === "otro"
          ? (form as any).motivo_perdida_detalle || undefined
          : null,
        etapa_pipeline:   (form as any).etapa_pipeline || "nuevo",
      };

      let prospectoId: string;
      if (esEdicion && prospecto?.id) {
        await actualizarProspecto(prospecto.id, payload);
        prospectoId = prospecto.id;
      } else {
        const nuevo = await crearProspecto(payload);
        prospectoId = nuevo.id;
      }

      // Contacto secundario: upsert si tiene nombre, eliminar si se borró
      if (contacto2.nombre.trim()) {
        await upsertContactoSecundario(prospectoId, {
          id:       contacto2.id || undefined,
          nombre:   contacto2.nombre.trim(),
          cargo:    contacto2.cargo || undefined,
          telefono: contacto2.telefono || undefined,
          email:    contacto2.email || undefined,
        });
      } else if (contacto2.id) {
        await eliminarContactoSecundario(prospectoId, contacto2.id);
      }

      onGuardado?.();
      onCerrar();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        setError(data.errors.map((e: any) => e.message).join(" · "));
      } else {
        setError(data?.message || "Error al guardar");
      }
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
      variant="dark"
    >
      <div className="space-y-4 ">

        {/* ── EMPRESA ── */}
        <div className="rounded-2xl  border border-zinc-700 bg-zinc-800 p-5">
          {sectionHeader("Empresa")}
          <div className="grid grid-cols-2  gap-x-6 gap-y-4">
            <Field icon={<Building2 size={14}/>} label="Empresa" required>
              <input value={form.empresa} onChange={e => set("empresa", e.target.value)}
                placeholder="Nombre de la empresa" className={fieldInput} />
            </Field>
            <Field icon={<Tag size={14}/>} label="Rubro" required>
              <input value={form.rubro} onChange={e => set("rubro", e.target.value)}
                placeholder="Ej: Tecnología, Retail..." className={fieldInput} />
            </Field>
            <Field icon={<Globe size={14}/>} label="Enlace web">
              <input value={form.pagina_web} onChange={e => {
                const url = e.target.value;
                set("pagina_web", url);
                set("web_activa", url.trim() ? "true" : "false");
                if (!url.trim()) set("estado_web", "");
              }} placeholder="https://..." className={fieldInput} />
            </Field>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">¿WEB ACTIVA?</label>
              <select value={form.web_activa} onChange={e => { set("web_activa", e.target.value); if (e.target.value !== "true") set("estado_web", ""); }} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <Field icon={<Server size={14}/>} label="Proveedor web">
              <input value={form.proveedor_web} onChange={e => set("proveedor_web", e.target.value)}
                placeholder="Ej: Wix, WordPress, agencia..." className={fieldInput} />
            </Field>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">
                TAMAÑO EMPRESA <span className="text-brand">*</span>
              </label>
              <select
                value={form.tamano_empresa}
                onChange={e => {
                  const t = e.target.value;
                  set("tamano_empresa", t);
                  const p = calcularPrioridad(t, form.estado_web);
                  if (p) set("prioridad", p);
                }}
                className={selectClass}
              >
                <option value="">Sin especificar</option>
                <option value="1_10">1 – 10 empleados</option>
                <option value="11_50">11 – 50 empleados</option>
                <option value="51_200">51 – 200 empleados</option>
                <option value="201_500">201 – 500 empleados</option>
                <option value="mas_500">Más de 500</option>
              </select>
            </div>
            {form.web_activa === "true" && (
              <div className="col-span-2">
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">ESTADO DE LA WEB</label>
                <select
                  value={form.estado_web}
                  onChange={e => {
                    const val = e.target.value;
                    set("estado_web", val);
                    if (val === "actualizada") {
                      set("estado_lead",    "ya_tiene_proveedor");
                      set("clasificacion",  "descartado");
                      set("contesto",       "true");
                      set("motivo_perdida", "tiene_web");
                    } else if (val) {
                      set("estado_lead",    "ya_tiene_proveedor");
                      set("clasificacion",  "gestionado");
                      set("contesto",       "true");
                      set("motivo_perdida", "");
                    }
                    const p = calcularPrioridad(form.tamano_empresa, val);
                    if (p) set("prioridad", p);
                  }}
                  className={selectClass}
                >
                  <option value="">Sin especificar</option>
                  <option value="actualizada">Actualizada</option>
                  <option value="por_actualizar">Por actualizar</option>
                  <option value="vencida">Vencida</option>
                  <option value="en_mantenimiento">En mantenimiento</option>
                  <option value="sin_informacion">Sin información</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── CONTACTO PRINCIPAL ── */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-5">
          {sectionHeader("Contacto principal")}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field icon={<User size={14}/>} label="Nombre contacto">
              <input value={form.nombre_contacto} onChange={e => set("nombre_contacto", e.target.value)}
                placeholder="Nombre completo" className={fieldInput} />
            </Field>
            <Field icon={<Briefcase size={14}/>} label="Cargo">
              <input value={form.cargo} onChange={e => set("cargo", e.target.value)}
                placeholder="Ej: Gerente General" className={fieldInput} />
            </Field>
            <Field icon={<Phone size={14}/>} label="Teléfono">
              <input value={form.telefono} onChange={e => set("telefono", e.target.value)}
                placeholder="+51 999 999 999" className={fieldInput} />
            </Field>
            <Field icon={<Mail size={14}/>} label="Email">
              <input type="email" value={form.email_contacto} onChange={e => set("email_contacto", e.target.value)}
                placeholder="correo@empresa.com" className={fieldInput} />
            </Field>
            <Field icon={<MapPin size={14}/>} label="Ciudad" required>
              <input value={form.ciudad} onChange={e => set("ciudad", e.target.value)}
                placeholder="Ej: Lima" className={fieldInput} />
            </Field>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">
                REGIÓN <span className="text-brand">*</span>
              </label>
              <select value={form.region} onChange={e => set("region", e.target.value)} className={selectClass}>
                <option value="">Seleccione una región</option>
                {REGIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── CONTACTO SECUNDARIO ── */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-5">
          {sectionHeader("Contacto 2 (opcional)")}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
            </div>
            {contacto2.id && !contacto2.nombre && (
              <span className="text-[10px] text-zinc-400 italic">Deja el nombre vacío para eliminar</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field icon={<User size={14}/>} label="Nombre">
              <input value={contacto2.nombre} onChange={e => setC2("nombre", e.target.value)}
                placeholder="Nombre del segundo contacto" className={fieldInput} />
            </Field>
            <Field icon={<Briefcase size={14}/>} label="Cargo">
              <input value={contacto2.cargo} onChange={e => setC2("cargo", e.target.value)}
                placeholder="Ej: Administrador" className={fieldInput} />
            </Field>
            <Field icon={<Phone size={14}/>} label="Teléfono">
              <input value={contacto2.telefono} onChange={e => setC2("telefono", e.target.value)}
                placeholder="+51 999 999 999" className={fieldInput} />
            </Field>
            <Field icon={<Mail size={14}/>} label="Email">
              <input type="email" value={contacto2.email} onChange={e => setC2("email", e.target.value)}
                placeholder="correo@empresa.com" className={fieldInput} />
            </Field>
          </div>
        </div>

        {/* ── CRM ── */}
        <div className="rounded-2xl border border-brand/20 bg-zinc-800 p-5">
          {sectionHeader("CRM")}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">
                ESTADO DEL LEAD <span className="text-brand">*</span>
              </label>
              <select
                value={form.estado_lead}
                onChange={e => {
                  const nuevo = e.target.value;
                  set("estado_lead", nuevo);
                  const autoClasif = AUTO_CLASIFICACION[nuevo];
                  if (autoClasif) set("clasificacion", autoClasif);
                  const SIN_CONTACTO = ["por_gestionar", "baja_de_oficio", "suspension_temporal", "fuera_de_servicio"];
                  const CONTESTO_NO  = ["no_contesta", "buzon_de_voz"];
                  if (SIN_CONTACTO.includes(nuevo)) set("contesto", "");
                  else if (CONTESTO_NO.includes(nuevo)) set("contesto", "false");
                  else set("contesto", "true");
                  if (["baja_de_oficio", "suspension_temporal", "fuera_de_servicio", "buzon_de_voz"].includes(nuevo))
                    set("canal_llamada", "");
                }}
                className={selectClass}
              >
                {ESTADOS_LEAD.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-zinc-400 font-medium">
                  CLASIFICACIÓN <span className="text-brand">*</span>
                </label>
                {AUTO_CLASIFICACION[form.estado_lead] === form.clasificacion && (
                  <span className="text-[9px] text-brand font-bold uppercase tracking-wider">auto</span>
                )}
              </div>
              <select value={form.clasificacion} onChange={e => set("clasificacion", e.target.value)} className={selectClass}>
                {CLASIFICACIONES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {(form.estado_lead === "no_interesado" || form.estado_lead === "ya_tiene_proveedor") && (
              <div className="col-span-2 rounded-xl bg-red-50 border border-red-100 p-3 space-y-2">
                <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Motivo de descarte</label>
                <select value={(form as any).motivo_perdida ?? ""} onChange={e => set("motivo_perdida", e.target.value)} className={selectClass}>
                  <option value="">Sin especificar</option>
                  <option value="precio_alto">Precio alto</option>
                  <option value="sin_presupuesto">Sin presupuesto</option>
                  <option value="no_le_interesa">No le interesa el servicio</option>
                  <option value="tiene_web">Empresa con página web</option>
                  <option value="no_toma_decision">No es quien decide</option>
                  <option value="otro">Otro</option>
                </select>
                {(form as any).motivo_perdida === "otro" && (
                  <input type="text"
                    value={(form as any).motivo_perdida_detalle ?? ""}
                    onChange={e => set("motivo_perdida_detalle", e.target.value)}
                    placeholder="Especifica el motivo..."
                    className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-xl text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
                  />
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">
                PRIORIDAD <span className="text-brand">*</span>
              </label>
              <select value={form.prioridad} onChange={e => set("prioridad", e.target.value)} className={selectClass}>
                {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">FUENTE</label>
              <select value={form.fuente} onChange={e => set("fuente", e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                {FUENTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">ESTADO DE VENTA</label>
              <select value={form.estado_venta} onChange={e => set("estado_venta", e.target.value)} className={selectClass}>
                <option value="no">No</option>
                <option value="en_proceso">En proceso</option>
                <option value="si">Sí — Cerrada</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">ETAPA PIPELINE</label>
              <select value={(form as any).etapa_pipeline ?? "nuevo"} onChange={e => set("etapa_pipeline", e.target.value)} className={selectClass}>
                {ETAPAS_PIPELINE.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── NOTAS ── */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={13} className="text-brand" />
            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">Notas</span>
          </div>
          <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
            placeholder="Observaciones generales del prospecto..."
            className="w-full text-xs bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2.5 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/40 transition-all resize-none" />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <span className="text-red-400 text-sm">⚠</span>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={handleGuardar}>
            {esEdicion ? "Guardar cambios" : "Guardar Prospecto"}
          </Button>
        </div>

      </div>
    </Modal>
  );
}