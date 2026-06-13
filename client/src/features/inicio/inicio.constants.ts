/** client/src/features/inicio/inicio.constants.ts
 *  Etiquetas y colores de etapa del pipeline, reutilizados por toda la página.
 */
// Etapas REALES del pipeline (coinciden con PipelinePage / getPipeline)
export const ETAPA_LABEL: Record<string, string> = {
  volver_a_llamar:      "Volver a llamar",
  solicita_informacion: "Solicita información",
  interesado:           "Interesado",
  propuesta_enviada:    "Propuesta enviada",
  negociacion:          "Negociación",
  cerrado_ganado:       "Cerrado",
  perdido:              "Perdido",
};

export const ETAPA_COLOR: Record<string, string> = {
  volver_a_llamar:      "#fbbf24",  // ámbar
  solicita_informacion: "#3b82f6",  // azul
  interesado:           "#06b6d4",  // cyan
  propuesta_enviada:    "#a855f7",  // violeta
  negociacion:          "#ec4899",  // rosa
  cerrado_ganado:       "#34d399",  // verde
  perdido:              "#f87171",  // rojo
};

// Orden del embudo (para barra de progreso del LeadDrawer)
export const ETAPAS_ORDEN = [
  "volver_a_llamar", "solicita_informacion", "interesado", "propuesta_enviada", "negociacion", "cerrado_ganado",
] as const;

// Etapas que entran al donut "por etapa" — embudo completo + terminales
export const ETAPAS_DONUT = [
  "volver_a_llamar", "solicita_informacion", "interesado", "propuesta_enviada", "negociacion", "cerrado_ganado", "perdido",
] as const;

export const fmtSoles = (v: number): string =>
  "S/ " + v.toLocaleString("es-PE", { maximumFractionDigits: 0 });

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

export function fechaLarga(d = new Date()): string {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function saludo(d = new Date()): string {
  const h = d.getHours();
  if (h >= 5 && h < 12)  return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}
