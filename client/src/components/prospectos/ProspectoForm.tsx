/**client/src/prospectos/ProspectosForm.tsx */
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  Building2, Tag, Globe, Server,
  User, Briefcase, Phone, Mail, MapPin,
  StickyNote, Users, Share2, Sparkles,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { crearProspecto, actualizarProspecto } from "../../services/prospectos.api";
import { upsertContactoSecundario, eliminarContactoSecundario } from "../../services/prospectos.api";
import type { Prospecto } from "../../types/prospecto.types";

// ── Datos de sector / perfil / plan sugerido ────────────────────────────────

const SECTORES = [
  { value: "construccion",           label: "Construcción" },
  { value: "arquitectura_ingenieria",label: "Arquitectura e Ingeniería" },
  { value: "manufactura_industria",  label: "Manufactura / Industria" },
  { value: "comercio_retail",        label: "Comercio / Retail" },
  { value: "comercio_mayorista",     label: "Comercio Mayorista" },
  { value: "salud",                  label: "Salud" },
  { value: "educacion",              label: "Educación" },
  { value: "gastronomia_turismo",    label: "Gastronomía / Turismo" },
  { value: "servicios_profesionales",label: "Servicios Profesionales" },
  { value: "tecnologia",             label: "Tecnología / TI" },
  { value: "transporte_logistica",   label: "Transporte / Logística" },
  { value: "inmobiliaria",           label: "Inmobiliaria" },
  { value: "agroindustria",          label: "Agroindustria / Agro" },
  { value: "mineria_energia",        label: "Minería / Energía" },
  { value: "seguridad",              label: "Seguridad / CCTV" },
  { value: "otro",                   label: "Otro" },
];

const PERFILES_POR_SECTOR: Record<string, { value: string; label: string }[]> = {
  construccion:            [{ value: "construccion", label: "Constructora / Contratista" }, { value: "ferreteria_materiales", label: "Ferretería / Materiales" }],
  arquitectura_ingenieria: [{ value: "arquitectura", label: "Estudio de Arquitectura" }, { value: "ingenieria_consultoria", label: "Ingeniería / Consultoría técnica" }],
  manufactura_industria:   [{ value: "fabrica_manufactura", label: "Fábrica / Planta de producción" }, { value: "taller_industrial", label: "Taller industrial / Metalmecánica" }, { value: "agroindustria", label: "Agroindustria / Procesadora" }],
  comercio_retail:         [{ value: "tienda_retail", label: "Tienda / Retail (ropa, calzado...)" }, { value: "farmacia_botica", label: "Farmacia / Botica" }],
  comercio_mayorista:      [{ value: "distribuidora_mayorista", label: "Distribuidora / Mayorista" }, { value: "drogueria_farmaceutica", label: "Droguería / Dist. farmacéutica" }, { value: "importadora_exportadora", label: "Importadora / Exportadora" }],
  salud:                   [{ value: "clinica_hospital", label: "Clínica / Hospital" }, { value: "consultorio_medico", label: "Consultorio Médico / Dental" }, { value: "laboratorio", label: "Laboratorio Clínico" }],
  educacion:               [{ value: "instituto_academia", label: "Instituto / Academia" }, { value: "colegio", label: "Colegio / Centro educativo" }, { value: "centro_capacitacion", label: "Centro de capacitación" }],
  gastronomia_turismo:     [{ value: "restaurante", label: "Restaurante / Cevichería" }, { value: "hotel_hospedaje", label: "Hotel / Hospedaje" }, { value: "agencia_viajes", label: "Agencia de viajes / Tours" }],
  servicios_profesionales: [{ value: "estudio_juridico", label: "Estudio Jurídico / Abogados" }, { value: "contabilidad_auditoria", label: "Contabilidad / Auditoría" }, { value: "consultoria_empresarial", label: "Consultoría / Asesoría empresarial" }],
  tecnologia:              [{ value: "tecnologia_ti", label: "Empresa de TI / Software" }],
  transporte_logistica:    [{ value: "empresa_transportes", label: "Empresa de transportes" }, { value: "almacen_logistica", label: "Almacén / Logística" }, { value: "agencia_aduanas", label: "Agencia de aduanas" }],
  inmobiliaria:            [{ value: "inmobiliaria", label: "Inmobiliaria / Desarrolladora" }],
  agroindustria:           [{ value: "agroindustria", label: "Agroindustria / Procesadora" }],
  mineria_energia:         [{ value: "mineria_energia", label: "Minera / Energía / Electricidad" }],
  seguridad:               [{ value: "seguridad_cctv", label: "Empresa de seguridad / CCTV" }],
  otro:                    [{ value: "otro", label: "Otro" }, { value: "ong_asociacion", label: "ONG / Asociación" }],
};

const REDES_OPCIONES = [
  { value: "facebook",  label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok",    label: "TikTok" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "ninguna",   label: "Ninguna" },
];

function inferirSectorPerfil(actividad: string, empresa: string = ""): { sector: string; perfil: string } | null {
  const t = (actividad + " " + empresa).toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, ""); // quita tildes

  // Construcción
  if (/CONSTRUCC|OBRA CIVIL|CONTRATIST|EDIFICACI|HABILITACION URBANA/.test(t))
    return { sector: "construccion", perfil: "construccion" };
  // Ferretería / materiales (antes de comercio genérico)
  if (/FERRETERI|MATERIALES DE CONSTRUCC/.test(t))
    return { sector: "construccion", perfil: "ferreteria_materiales" };
  // Inmobiliaria
  if (/INMOBILI|BIENES RAICES|DESARROLLO INMOB/.test(t))
    return { sector: "inmobiliaria", perfil: "inmobiliaria" };
  // Arquitectura e Ingeniería
  if (/ARQUITECTURA/.test(t))
    return { sector: "arquitectura_ingenieria", perfil: "arquitectura" };
  if (/INGENIERIA|INGENIERÍA|CONSULTORIA TEC|CONSULTOR.*TECNI/.test(t))
    return { sector: "arquitectura_ingenieria", perfil: "ingenieria_consultoria" };
  // Minería / Energía
  if (/MINER|EXTRACCION DE|PETROLEO|GAS NATURAL|ELECTRICIDAD|GENERACION DE ENERGIA/.test(t))
    return { sector: "mineria_energia", perfil: "mineria_energia" };
  // Agroindustria
  if (/AGRICULTUR|GANADERI|ACUICULT|PESCA(?!DO)|CULTIVO|AGROINDUST/.test(t))
    return { sector: "agroindustria", perfil: "agroindustria" };
  // Manufactura
  if (/FABRICACI|MANUFACTURA|ELABORACI|PRODUCCION DE|PLANTA.*PRODUC/.test(t))
    return { sector: "manufactura_industria", perfil: "fabrica_manufactura" };
  if (/TALLER|METALMECAN|METAL MECAN/.test(t))
    return { sector: "manufactura_industria", perfil: "taller_industrial" };
  // Salud — laboratorio primero (más específico)
  if (/LABORATORIO CLINIC|LABORATORIO DE ANALISIS|ANALISIS CLINIC/.test(t))
    return { sector: "salud", perfil: "laboratorio" };
  if (/ODONTOLOG|DENTAL|CONSULTORIO MEDIC/.test(t))
    return { sector: "salud", perfil: "consultorio_medico" };
  if (/ATENCION.*SALUD|CLINICA|HOSPITAL|CENTRO MEDIC|CENTRO DE SALUD/.test(t))
    return { sector: "salud", perfil: "clinica_hospital" };
  // Farmacia por mayor → droguería
  if (/FARMACEUT/.test(t) && /POR MAYOR|DROGUER/.test(t))
    return { sector: "comercio_mayorista", perfil: "drogueria_farmaceutica" };
  // Farmacia por menor → botica
  if (/FARMACEUT/.test(t) && /POR MENOR/.test(t))
    return { sector: "comercio_retail", perfil: "farmacia_botica" };
  // Educación
  if (/CAPACITACI/.test(t))
    return { sector: "educacion", perfil: "centro_capacitacion" };
  if (/PRIMARIA|SECUNDARIA|COLEGIO|ESCUELA/.test(t))
    return { sector: "educacion", perfil: "colegio" };
  if (/ENSENANZA|ENSEÑANZA|EDUCACI|INSTITUTO|ACADEMIA/.test(t))
    return { sector: "educacion", perfil: "instituto_academia" };
  // Turismo / Gastronomía
  if (/HOTEL|HOSPEDAJE|ALOJAMIENTO/.test(t))
    return { sector: "gastronomia_turismo", perfil: "hotel_hospedaje" };
  if (/AGENCIA.*VIAJE|VIAJES.*TURISMO|AGENCIA.*TURISMO/.test(t))
    return { sector: "gastronomia_turismo", perfil: "agencia_viajes" };
  if (/RESTAUR|CAFETERI|CEVICHER|PICANTER|SERVICIO DE COMIDA/.test(t))
    return { sector: "gastronomia_turismo", perfil: "restaurante" };
  // Servicios profesionales
  if (/JURIDIC|JURIDICA|NOTARI|ABOGADO|ESTUDIO DE DERECHO/.test(t))
    return { sector: "servicios_profesionales", perfil: "estudio_juridico" };
  if (/CONTABILIDAD|AUDITORIA|CONTADURI/.test(t))
    return { sector: "servicios_profesionales", perfil: "contabilidad_auditoria" };
  if (/CONSULTORIA|ASESORIA|GESTION EMPRESARIAL/.test(t))
    return { sector: "servicios_profesionales", perfil: "consultoria_empresarial" };
  // Tecnología
  if (/PROGRAMACI|SOFTWARE|INFORMATICA|TECNOLOGIA.*INFORMACI|SISTEMAS INFORM/.test(t))
    return { sector: "tecnologia", perfil: "tecnologia_ti" };
  // Seguridad
  if (/SEGURIDAD|VIGILANCIA/.test(t))
    return { sector: "seguridad", perfil: "seguridad_cctv" };
  // Transporte y logística
  if (/AGENCIA.*ADUANA|OPERADOR.*ADUANA/.test(t))
    return { sector: "transporte_logistica", perfil: "agencia_aduanas" };
  if (/ALMACENAMIENTO|ALMACEN|DEPOSITO.*MERCANC/.test(t))
    return { sector: "transporte_logistica", perfil: "almacen_logistica" };
  if (/TRANSPORTE/.test(t))
    return { sector: "transporte_logistica", perfil: "empresa_transportes" };
  // Importadora / Exportadora (antes de comercio genérico)
  if (/IMPORTACI|EXPORTACI|IMPORT.*EXPORT/.test(t))
    return { sector: "comercio_mayorista", perfil: "importadora_exportadora" };
  // Distribuidora / mayorista
  if (/POR MAYOR|AL POR MAYOR|DISTRIBUCI/.test(t))
    return { sector: "comercio_mayorista", perfil: "distribuidora_mayorista" };
  // Retail / comercio minorista
  if (/POR MENOR|AL POR MENOR|COMERCIO ESPECIALI/.test(t))
    return { sector: "comercio_retail", perfil: "tienda_retail" };

  return null;
}

function calcularPlanSugerido(n: number): { nombre: string; rango: string; color: string } | null {
  if (n <= 0) return null;
  if (n <= 5)  return { nombre: "Base — Web Express",  rango: "S/ 500–700",    color: "text-zinc-400" };
  if (n <= 10) return { nombre: "Gold — Web Pro",      rango: "S/ 900–1,200",  color: "text-yellow-500" };
  if (n <= 30) return { nombre: "Red — Web Advanced",  rango: "S/ 1,300–1,600",color: "text-red-400" };
  if (n <= 100)return { nombre: "Blue — Web Expert",   rango: "S/ 1,700–2,000",color: "text-blue-400" };
  return       { nombre: "Platinum — Elite",            rango: "S/ 2,000+",     color: "text-purple-400" };
}

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
  { value: "ocupado_en_reunion",  label: "Ocupado / En reunión" },
  { value: "prometio_llamar",     label: "Prometió llamar" },
  { value: "buzon_de_voz",        label: "Buzón de voz" },
  { value: "fuera_de_servicio",   label: "Fuera de servicio" },
  { value: "numero_equivocado",   label: "Número equivocado" },
  { value: "ya_tiene_proveedor",  label: "Empresa con página web" },
  { value: "baja_de_oficio",      label: "Baja de oficio" },
  { value: "suspension_temporal", label: "Suspensión temporal" },
  { value: "no_habido",           label: "No habido" },
  { value: "perdida",             label: "Venta perdida" },
];

// ── Sistema de scoring de prioridad ─────────────────────────────────────────

const SECTOR_SCORE: Record<string, number> = {
  construccion: 15, inmobiliaria: 15, manufactura_industria: 15,
  agroindustria: 15, mineria_energia: 15,
  salud: 12, servicios_profesionales: 12, comercio_mayorista: 12, arquitectura_ingenieria: 12,
  tecnologia: 8, transporte_logistica: 8, seguridad: 8, educacion: 8,
  comercio_retail: 5, gastronomia_turismo: 5, otro: 5,
};

const PERFIL_SCORE: Record<string, number> = {
  construccion: 6, clinica_hospital: 6, importadora_exportadora: 6,
  fabrica_manufactura: 6, drogueria_farmaceutica: 6, estudio_juridico: 6,
  distribuidora_mayorista: 3, hotel_hospedaje: 3, consultoria_empresarial: 3,
  almacen_logistica: 3, agencia_aduanas: 3, inmobiliaria: 3, ingenieria_consultoria: 3,
  arquitectura: 0, laboratorio: 0, contabilidad_auditoria: 0, instituto_academia: 0,
  empresa_transportes: 0, seguridad_cctv: 0, taller_industrial: 0,
  ferreteria_materiales: 0, agencia_viajes: 0, agroindustria: 0,
  consultorio_medico: 0, colegio: 0, tecnologia_ti: 0,
  farmacia_botica: -4, tienda_retail: -4, restaurante: -4,
  ong_asociacion: -4, centro_capacitacion: -4,
};

const TAMANO_FALLBACK_SCORE: Record<string, number> = {
  "1_10": 2, "11_50": 7, "51_200": 9, "201_500": 15, "mas_500": 15,
};

function scoreWorkers(n: number): number {
  if (n === 1)    return -5;
  if (n <= 3)     return -3;
  if (n <= 5)     return 0;
  if (n <= 10)    return 2;
  if (n <= 15)    return 4;
  if (n <= 25)    return 5;
  if (n <= 50)    return 7;
  if (n <= 100)   return 9;
  if (n <= 200)   return 12;
  return 15;
}

function scoreWeb(webActiva: string, estadoWeb: string): number {
  if (webActiva !== "true") return 8;
  const map: Record<string, number> = {
    vencida: 5, sin_informacion: 4, por_actualizar: 3, en_mantenimiento: 1, actualizada: -10,
  };
  return map[estadoWeb] ?? 0;
}

function scoreRedes(redes: string[]): number {
  const activas = redes.filter(r => r !== "ninguna");
  if (activas.length === 0) return 0;
  let pts = activas.length === 1 ? 1 : 2;
  if (activas.includes("linkedin")) pts += 2;
  return Math.min(pts, 4);
}

function calcularScoring(params: {
  sector: string; perfil: string; cantidad_trabajadores: string;
  tamano_empresa: string; web_activa: string; estado_web: string;
  redes: string[];
}): { score: number; prioridad: "alta" | "media" | "baja" } {
  let total = 0;
  total += SECTOR_SCORE[params.sector] ?? 0;
  total += PERFIL_SCORE[params.perfil] ?? 0;
  const n = parseInt(params.cantidad_trabajadores);
  total += !isNaN(n) ? scoreWorkers(n) : (TAMANO_FALLBACK_SCORE[params.tamano_empresa] ?? 0);
  total += scoreWeb(params.web_activa, params.estado_web);
  total += scoreRedes(params.redes);
  const prioridad: "alta" | "media" | "baja" = total >= 25 ? "alta" : total >= 12 ? "media" : "baja";
  return { score: total, prioridad };
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
  empresa: "", actividad_economica: "", sector: "", perfil_empresa: "",
  cantidad_trabajadores: "", pagina_web: "", tamano_empresa: "",
  web_activa: "false", proveedor_web: "", estado_web: "",
  // Contacto
  nombre_contacto: "", cargo: "", telefono: "", email_contacto: "",
  ciudad: "", region: "",
  // CRM
  estado_lead: "por_gestionar", clasificacion: "por_gestionar",
  prioridad: "media", fuente: "", estado_venta: "no", notas: "",
  etapa_pipeline: "nuevo", motivo_perdida: "", motivo_perdida_detalle: "",
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
  const [redesSociales, setRedesSociales] = useState<string[]>([]);
  const [prioridadAuto, setPrioridadAuto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [contacto2, setContacto2] = useState({ id: "", nombre: "", cargo: "", telefono: "", email: "" });
  const setC2 = (k: string, v: string) => setContacto2(c => ({ ...c, [k]: v }));

  useEffect(() => {
    if (prospecto) {
      const p = prospecto as any;
      const c2 = p.contactos?.[0];
      if (c2) setContacto2({ id: c2.id ?? "", nombre: c2.nombre ?? "", cargo: c2.cargo ?? "", telefono: c2.telefono ?? "", email: c2.email ?? "" });

      if (Array.isArray(p.redes_sociales)) setRedesSociales(p.redes_sociales);

      setForm({
        empresa:               p.empresa              ?? "",
        actividad_economica:   p.actividad_economica  ?? "",
        sector:                p.sector               ?? "",
        perfil_empresa:        p.perfil_empresa        ?? "",
        cantidad_trabajadores: p.cantidad_trabajadores != null ? String(p.cantidad_trabajadores) : "",
        pagina_web:            p.pagina_web            ?? "",
        web_activa:            p.web_activa != null ? String(p.web_activa) : "",
        proveedor_web:         p.proveedor_web         ?? "",
        estado_web:            p.estado_web            ?? "",
        motivo_perdida:        p.motivo_perdida        ?? "",
        tamano_empresa:        p.tamano_empresa        ?? "",
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
    if (!form.tamano_empresa && !form.cantidad_trabajadores) faltantes.push("Tamaño de empresa o Nro. de trabajadores");
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
      const nroTrabajadores = form.cantidad_trabajadores ? parseInt(form.cantidad_trabajadores) : undefined;
      const payload: any = {
        empresa:               form.empresa,
        actividad_economica:   form.actividad_economica || undefined,
        sector:                form.sector || undefined,
        perfil_empresa:        form.perfil_empresa || undefined,
        cantidad_trabajadores: nroTrabajadores,
        redes_sociales:        redesSociales.length > 0 ? redesSociales : undefined,
        pagina_web:            form.pagina_web || undefined,
        web_activa:            form.web_activa === "true" ? true : form.web_activa === "false" ? false : undefined,
        proveedor_web:         form.proveedor_web || undefined,
        estado_web:            form.web_activa === "true" ? (form.estado_web || undefined) : undefined,
        tamano_empresa:        form.tamano_empresa || undefined,
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
        motivo_perdida:         (form as any).motivo_perdida || undefined,
        motivo_perdida_detalle: (form as any).motivo_perdida === "otro"
          ? (form as any).motivo_perdida_detalle || undefined
          : undefined,
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
              <input
                value={form.empresa}
                onChange={e => {
                  const val = e.target.value;
                  set("empresa", val);
                  if (!form.sector && form.actividad_economica.trim().length > 5) {
                    const inferido = inferirSectorPerfil(form.actividad_economica, val);
                    if (inferido) {
                      set("sector", inferido.sector);
                      set("perfil_empresa", inferido.perfil);
                    }
                  }
                }}
                placeholder="Nombre de la empresa"
                className={fieldInput}
              />
            </Field>
            <Field icon={<Tag size={14}/>} label="Actividad Económica (SUNAT)">
              <input
                value={form.actividad_economica}
                onChange={e => {
                  const val = e.target.value;
                  set("actividad_economica", val);
                  if (val.trim().length > 5) {
                    const inferido = inferirSectorPerfil(val, form.empresa);
                    if (inferido) {
                      set("sector", inferido.sector);
                      set("perfil_empresa", inferido.perfil);
                    }
                  }
                }}
                placeholder="Ej: CONSTRUCCIÓN DE EDIFICIOS"
                className={fieldInput}
              />
            </Field>

            {/* Sector y Perfil */}
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">SECTOR</label>
              <select
                value={form.sector}
                onChange={e => { set("sector", e.target.value); set("perfil_empresa", ""); }}
                className={selectClass}
              >
                <option value="">Sin especificar</option>
                {SECTORES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">PERFIL DE EMPRESA</label>
              <select
                value={form.perfil_empresa}
                onChange={e => {
                  const perfil = e.target.value;
                  set("perfil_empresa", perfil);
                  const { prioridad: p } = calcularScoring({ sector: form.sector, perfil, cantidad_trabajadores: form.cantidad_trabajadores, tamano_empresa: form.tamano_empresa, web_activa: form.web_activa, estado_web: form.estado_web, redes: redesSociales });
                  set("prioridad", p); setPrioridadAuto(true);
                }}
                className={selectClass}
                disabled={!form.sector}
              >
                <option value="">{form.sector ? "Selecciona perfil" : "Primero elige el sector"}</option>
                {(PERFILES_POR_SECTOR[form.sector] ?? []).map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Cantidad de trabajadores + tamaño auto + plan sugerido */}
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">NRO. DE TRABAJADORES</label>
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-1.5 focus-within:border-brand transition-colors group">
                <span className="text-yellow-500 group-focus-within:text-brand transition-colors shrink-0">
                  <Users size={14} />
                </span>
                <input
                  type="number" min={1} max={9999}
                  value={form.cantidad_trabajadores}
                  onChange={e => {
                    const val = e.target.value;
                    set("cantidad_trabajadores", val);
                    const n = parseInt(val);
                    if (!isNaN(n) && n > 0) {
                      const t = n <= 10 ? "1_10" : n <= 50 ? "11_50" : n <= 200 ? "51_200" : n <= 500 ? "201_500" : "mas_500";
                      set("tamano_empresa", t);
                      const { prioridad: p } = calcularScoring({ sector: form.sector, perfil: form.perfil_empresa, cantidad_trabajadores: val, tamano_empresa: form.tamano_empresa, web_activa: form.web_activa, estado_web: form.estado_web, redes: redesSociales });
                      set("prioridad", p); setPrioridadAuto(true);
                    }
                  }}
                  placeholder="Ej: 12"
                  className={fieldInput}
                />
              </div>
              {form.cantidad_trabajadores && (() => {
                const plan = calcularPlanSugerido(parseInt(form.cantidad_trabajadores));
                return plan ? (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700">
                    <Sparkles size={11} className={plan.color} />
                    <span className={`text-[10px] font-semibold ${plan.color}`}>{plan.nombre}</span>
                    <span className="text-[10px] text-zinc-500 ml-auto">{plan.rango}</span>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Redes sociales multi-select */}
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1.5">
                <span className="flex items-center gap-1"><Share2 size={11} className="text-yellow-500" /> REDES SOCIALES ACTIVAS</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {REDES_OPCIONES.map(r => {
                  const activa = redesSociales.includes(r.value);
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        if (r.value === "ninguna") {
                          setRedesSociales(activa ? [] : ["ninguna"]);
                        } else {
                          setRedesSociales(prev => {
                            const sin = prev.filter(x => x !== "ninguna");
                            return activa ? sin.filter(x => x !== r.value) : [...sin, r.value];
                          });
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                        activa
                          ? "bg-brand border-brand text-zinc-900"
                          : "bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-brand/50"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

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
                  const { prioridad: p } = calcularScoring({ sector: form.sector, perfil: form.perfil_empresa, cantidad_trabajadores: form.cantidad_trabajadores, tamano_empresa: form.tamano_empresa, web_activa: form.web_activa, estado_web: form.estado_web, redes: redesSociales });
                  set("prioridad", p); setPrioridadAuto(true);
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
                    const { prioridad: p } = calcularScoring({ sector: form.sector, perfil: form.perfil_empresa, cantidad_trabajadores: form.cantidad_trabajadores, tamano_empresa: form.tamano_empresa, web_activa: form.web_activa, estado_web: val, redes: redesSociales });
                    set("prioridad", p); setPrioridadAuto(true);
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-zinc-400 font-medium">
                  PRIORIDAD <span className="text-brand">*</span>
                </label>
                {prioridadAuto && (() => {
                  const { score } = calcularScoring({ sector: form.sector, perfil: form.perfil_empresa, cantidad_trabajadores: form.cantidad_trabajadores, tamano_empresa: form.tamano_empresa, web_activa: form.web_activa, estado_web: form.estado_web, redes: redesSociales });
                  return <span className="text-[9px] text-brand font-bold uppercase tracking-wider">auto · {score} pts</span>;
                })()}
              </div>
              <select
                value={form.prioridad}
                onChange={e => { set("prioridad", e.target.value); setPrioridadAuto(false); }}
                className={selectClass}
              >
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