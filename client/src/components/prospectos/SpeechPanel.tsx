/** client/src/components/prospectos/SpeechPanel.tsx */
import { BookOpen, GripHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Prospecto } from "../../types/prospecto.types";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoPunto = "ventas" | "imagen" | "atraccion";

interface SpeechPunto { tipo: TipoPunto; texto: string }
interface SpeechSector { emoji: string; tipoPagina: string; puntos: SpeechPunto[] }

const TIPO_CONFIG: Record<TipoPunto, { label: string; icon: string; badge: string; dot: string }> = {
  ventas:    { label: "Ventas",               icon: "💰", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "text-emerald-500" },
  imagen:    { label: "Imagen institucional", icon: "🏛", badge: "bg-blue-100 text-blue-700 border-blue-200",          dot: "text-blue-500"    },
  atraccion: { label: "Atracción",            icon: "🎯", badge: "bg-amber-100 text-amber-700 border-amber-200",       dot: "text-amber-500"   },
};

// ── Datos por sector ──────────────────────────────────────────────────────────
const SPEECH_SECTOR: Record<string, SpeechSector> = {
  construccion: {
    emoji: "🏗️", tipoPagina: "Página Web Institucional y de Proyectos",
    puntos: [
      { tipo: "ventas",    texto: "Convertir el portafolio de obras en una herramienta de cierre: clientes que ven evidencia técnica y fotográfica toman decisiones de contratación más rápido." },
      { tipo: "imagen",    texto: "Fortalecer la posición en licitaciones públicas y privadas con una presencia digital que funcione como carta de presentación formal ante cualquier convocatoria." },
      { tipo: "atraccion", texto: "Aparecer ante gerentes y jefes de proyecto que buscan contratistas en Google y hoy contratan a quienes tienen mayor visibilidad digital." },
    ],
  },
  arquitectura_ingenieria: {
    emoji: "📐", tipoPagina: "Página Web Institucional y de Proyectos",
    puntos: [
      { tipo: "ventas",    texto: "Convertir el portafolio de proyectos en un instrumento de captación: renders, planos y memorias técnicas que acortan el ciclo de decisión del cliente." },
      { tipo: "imagen",    texto: "Posicionarse ante desarrolladores, municipalidades y empresas que evalúan consultores por su solidez técnica, estética y presencia institucional." },
      { tipo: "atraccion", texto: "Captar proyectos de clientes que buscan estudios de arquitectura o ingeniería en línea y hoy eligen a quienes tienen mejor presencia digital." },
    ],
  },
  manufactura_industria: {
    emoji: "🏭", tipoPagina: "Catálogo Industrial Corporativo",
    puntos: [
      { tipo: "ventas",    texto: "Acelerar el ciclo comercial con compradores corporativos que evalúan capacidad instalada, líneas de producción y certificaciones antes de firmar un contrato." },
      { tipo: "imagen",    texto: "Proyectar escala y solidez industrial en procesos de homologación, auditorías de proveedor y negociaciones B2B de alto valor." },
      { tipo: "atraccion", texto: "Captar empresas que buscan proveedores industriales en línea y hoy no encuentran su empresa por falta de presencia digital activa." },
    ],
  },
  comercio_retail: {
    emoji: "🛍️", tipoPagina: "Plataforma de Comercio Electrónico",
    puntos: [
      { tipo: "ventas",    texto: "Vender los 365 días, las 24 horas, con un canal propio que no paga comisiones de marketplace y genera ingresos directos sin intermediarios." },
      { tipo: "imagen",    texto: "Construir una marca confiable y reconocible que diferencie el negocio de la competencia informal y genere fidelización a largo plazo." },
      { tipo: "atraccion", texto: "Captar compradores que hoy buscan sus productos en Google y terminan comprando a la competencia que sí tiene presencia digital activa." },
    ],
  },
  comercio_mayorista: {
    emoji: "📦", tipoPagina: "Portal Mayorista y Catálogo B2B",
    puntos: [
      { tipo: "ventas",    texto: "Habilitar cotizaciones y pedidos al por mayor directamente desde la web, reduciendo tiempos de respuesta y cerrando más negocios por canal digital." },
      { tipo: "imagen",    texto: "Proyectar formalidad y respaldo institucional ante compradores corporativos que evalúan a sus proveedores por solidez y estructura empresarial." },
      { tipo: "atraccion", texto: "Captar distribuidores y clientes frecuentes que buscan proveedores mayoristas en línea y hoy no encuentran su empresa por falta de presencia." },
    ],
  },
  salud: {
    emoji: "🩺", tipoPagina: "Plataforma Médica Institucional",
    puntos: [
      { tipo: "ventas",    texto: "Convertir la búsqueda digital en consultas agendadas: pacientes que encuentran al equipo médico y especialidades en línea deciden atenderse allí con menos fricción." },
      { tipo: "imagen",    texto: "Proyectar la trayectoria, especialidades y respaldo del equipo médico para generar confianza antes del primer contacto presencial." },
      { tipo: "atraccion", texto: "Captar pacientes que buscan especialistas en Google y hoy eligen otras clínicas o consultorios con mayor visibilidad digital." },
    ],
  },
  educacion: {
    emoji: "🎓", tipoPagina: "Portal Educativo Institucional",
    puntos: [
      { tipo: "ventas",    texto: "Convertir visitas digitales en matrículas: postulantes que conocen la oferta académica, infraestructura y logros institucionales en línea deciden más rápido." },
      { tipo: "imagen",    texto: "Proyectar la solidez pedagógica, infraestructura y plana docente ante padres de familia que evalúan varias opciones antes de elegir." },
      { tipo: "atraccion", texto: "Posicionarse en búsquedas locales y captar prospectos que hoy eligen otras instituciones con mayor presencia y credibilidad digital." },
    ],
  },
  gastronomia_turismo: {
    emoji: "🏨", tipoPagina: "Página Web de Reservas y Hospitalidad",
    puntos: [
      { tipo: "ventas",    texto: "Generar reservas directas desde la web, eliminando comisiones de OTAs y mejorando el margen por cada habitación, mesa o servicio vendido." },
      { tipo: "imagen",    texto: "Proyectar la propuesta de valor, ambientes y nivel de servicio para posicionarse como referente en su categoría ante viajeros exigentes." },
      { tipo: "atraccion", texto: "Captar turistas y visitantes que comparan opciones en línea y hoy eligen establecimientos con mejor presencia y galería visual digital." },
    ],
  },
  servicios_profesionales: {
    emoji: "⚖️", tipoPagina: "Página Web Corporativa de Servicios Profesionales",
    puntos: [
      { tipo: "ventas",    texto: "Acortar el ciclo comercial con clientes corporativos que investigan el estudio antes de contactar: casos de éxito y metodología bien presentados generan decisiones más rápidas." },
      { tipo: "imagen",    texto: "Posicionar a los socios como referentes en sus especialidades, construyendo autoridad y credibilidad ante clientes de alto valor y tomadores de decisión." },
      { tipo: "atraccion", texto: "Captar empresas que buscan asesoría especializada en Google y hoy contratan a la competencia con mayor visibilidad digital." },
    ],
  },
  tecnologia: {
    emoji: "💻", tipoPagina: "Página Web Corporativa y de Soluciones TI",
    puntos: [
      { tipo: "ventas",    texto: "Acortar el ciclo de ventas B2B con prospectos que investigan soluciones en línea: una propuesta de valor clara y casos de éxito convierten más rápido." },
      { tipo: "imagen",    texto: "Proyectar credibilidad técnica y empresarial ante tomadores de decisión que evalúan proveedores TI por solidez, certificaciones y vigencia digital." },
      { tipo: "atraccion", texto: "Captar empresas que buscan proveedores tecnológicos en Google y hoy contratan a quienes tienen mayor presencia y posicionamiento digital." },
    ],
  },
  transporte_logistica: {
    emoji: "🚚", tipoPagina: "Página Web Corporativa y de Servicios Logísticos",
    puntos: [
      { tipo: "ventas",    texto: "Captar contratos de flete y logística con empresas que buscan operadores formales y cierran acuerdos con proveedores que demuestran capacidad operativa en línea." },
      { tipo: "imagen",    texto: "Diferenciarse de operadores informales proyectando estructura, flota, rutas y respaldo institucional ante clientes corporativos que exigen formalidad." },
      { tipo: "atraccion", texto: "Aparecer ante empresas que buscan operadores logísticos en Google y hoy contratan a quienes tienen mejor visibilidad y presencia digital activa." },
    ],
  },
  inmobiliaria: {
    emoji: "🏠", tipoPagina: "Página Web Inmobiliaria y de Proyectos",
    puntos: [
      { tipo: "ventas",    texto: "Cerrar más unidades con una vitrina digital propia que muestre proyectos, avance de obra, precios y disponibilidad en tiempo real sin depender de portales." },
      { tipo: "imagen",    texto: "Proyectar solidez institucional ante inversionistas, bancos y socios estratégicos que evalúan la trayectoria y respaldo de la empresa antes de comprometer capital." },
      { tipo: "atraccion", texto: "Captar leads calificados de compradores e inversionistas directamente, sin pagar comisiones a portales de terceros por cada contacto generado." },
    ],
  },
  agroindustria: {
    emoji: "🍊", tipoPagina: "Página Web Corporativa y de Agroexportación",
    puntos: [
      { tipo: "ventas",    texto: "Acelerar negociaciones de exportación presentando volúmenes, variedades y certificaciones de calidad que dan confianza inmediata a compradores internacionales." },
      { tipo: "imagen",    texto: "Proyectar solidez y seriedad empresarial en mercados internacionales donde la presencia digital es un indicador clave en la evaluación de proveedores." },
      { tipo: "atraccion", texto: "Captar importadores y socios comerciales B2B que buscan proveedores agroindustriales confiables y evalúan su presencia digital antes de negociar." },
    ],
  },
  mineria_energia: {
    emoji: "⛏️", tipoPagina: "Página Web Corporativa del Sector Minería y Energía",
    puntos: [
      { tipo: "ventas",    texto: "Facilitar procesos de due diligence y homologación con información técnica, certificaciones y cartera de proyectos centralizada y accesible en línea." },
      { tipo: "imagen",    texto: "Proyectar cumplimiento de estándares sectoriales, solidez y trayectoria ante inversionistas, socios estratégicos y entidades reguladoras." },
      { tipo: "atraccion", texto: "Captar contratos de alto valor con empresas que evalúan proveedores minero-energéticos por su respaldo institucional y presencia digital formal." },
    ],
  },
  seguridad: {
    emoji: "🛡️", tipoPagina: "Página Web Corporativa de Seguridad",
    puntos: [
      { tipo: "ventas",    texto: "Cerrar contratos de vigilancia y monitoreo con empresas que investigan proveedores antes de firmar y valoran la formalidad respaldada por presencia digital." },
      { tipo: "imagen",    texto: "Proyectar profesionalismo, confianza y solidez institucional en un sector donde la credibilidad define la diferencia entre ganar o perder una licitación." },
      { tipo: "atraccion", texto: "Captar empresas e instituciones que buscan servicios de seguridad en línea y hoy contratan a quienes tienen mayor visibilidad y presencia formal." },
    ],
  },
  otro: {
    emoji: "🏢", tipoPagina: "Página Web Institucional",
    puntos: [
      { tipo: "ventas",    texto: "Generar más consultas, cotizaciones y cierres de clientes que buscan sus servicios en línea y hoy no los encuentran por falta de presencia digital activa." },
      { tipo: "imagen",    texto: "Proyectar formalidad y solidez empresarial ante clientes corporativos que evalúan a sus proveedores por su respaldo y presencia institucional." },
      { tipo: "atraccion", texto: "Captar nuevos clientes que buscan proveedores en Google y hoy eligen a la competencia que sí tiene una presencia web clara y profesional." },
    ],
  },
};

function getSpeech(sector: string | undefined): SpeechSector {
  return SPEECH_SECTOR[sector ?? ""] ?? SPEECH_SECTOR["otro"];
}

function getSaludo(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Buenos días";
  if (h >= 12 && h < 20) return "Buenas tardes";
  return "Buenas noches";
}

// ── Componente ────────────────────────────────────────────────────────────────
interface Props { prospecto: Prospecto; onCerrar: () => void }

export function SpeechPanel({ prospecto, onCerrar }: Props) {
  const speech  = getSpeech(prospecto.sector);
  const saludo  = getSaludo();
  const nombre  = prospecto.nombre_contacto || "—";
  const empresa = prospecto.empresa;

  const [pos, setPos] = useState(() => ({
    x: Math.max(0, window.innerWidth / 2 - 260),
    y: Math.max(0, window.innerHeight / 2 - 320),
  }));
  const drag = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      setPos({
        x: drag.current.origX + e.clientX - drag.current.startX,
        y: drag.current.origY + e.clientY - drag.current.startY,
      });
    };
    const onUp = () => {
      drag.current.active = false;
      setDragging(false);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setDragging(true);
  };

  return (
    <div
      className="fixed z-[70]"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className={`bg-slate-800/60 rounded-2xl shadow-2xl w-[520px] max-h-[88vh] flex flex-col overflow-hidden border border-white/10 ${dragging ? "shadow-3xl ring-2 ring-amber-200" : ""}`}>

        {/* Header — arrastrable */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0 select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={onHeaderMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal size={13} className="text-zinc-300" />
            <BookOpen size={15} className="text-amber-500" />
            <span className="font-bold text-sm text-zinc-200">Speech de llamada</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
              <span>{speech.emoji}</span>
              <span className="text-amber-600 font-semibold">{speech.tipoPagina}</span>
            </div>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={onCerrar}
              className="text-zinc-400 hover:text-zinc-400 transition rounded-md p-0.5 hover:bg-zinc-800 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* 1 · Apertura */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-3">1 · Apertura</p>
            <p className="text-sm font-bold text-zinc-100 leading-relaxed">{saludo}:</p>
            <p className="text-sm text-zinc-200 leading-relaxed mt-1">
              Me comunico con el Señor/a{" "}
              <span className="font-bold text-amber-700">{nombre}</span>{" "}
              de la empresa{" "}
              <span className="font-bold text-amber-700">{empresa}</span>.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[11px] text-zinc-400 whitespace-nowrap font-medium px-1">⏸ Espera respuesta (sí / no)</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* 2 · Si responde sí */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-3">2 · Si responde sí</p>
            <p className="text-sm text-zinc-200 leading-relaxed">
              Mi nombre es{" "}
              <span className="font-semibold text-zinc-100">Kenif Alejandro de Zincel Ideas Globales</span>{" "}
              y le llamo porque quería consultarle si en algún punto han considerado contar con una{" "}
              <span className="font-bold text-green-700">{speech.tipoPagina}</span>.
              Dependiendo de lo que más les interese a ustedes, podría ayudarles a:
            </p>

            {/* Puntos con badge de propósito */}
            <ul className="mt-3 space-y-3">
              {speech.puntos.map((punto, i) => {
                const cfg = TIPO_CONFIG[punto.tipo];
                return (
                  <li key={i} className="flex flex-col gap-1">
                    <span className={`self-start inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                    <p className={`text-sm text-zinc-300 leading-snug pl-1 border-l-2 ${punto.tipo === "ventas" ? "border-emerald-300" : punto.tipo === "imagen" ? "border-blue-300" : "border-amber-300"}`}>
                      {punto.texto}
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* Tip para el vendedor */}
            <p className="mt-4 text-[11px] text-zinc-400 italic border-t border-green-100 pt-3">
              Usa el ángulo que mejor encaje con el perfil de la empresa. Escucha qué les preocupa más y ve a ese punto.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
