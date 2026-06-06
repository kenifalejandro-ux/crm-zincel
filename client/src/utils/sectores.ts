export const SECTORES = [
  { value: "construccion",            label: "Construcción" },
  { value: "arquitectura_ingenieria", label: "Arquitectura e Ingeniería" },
  { value: "manufactura_industria",   label: "Manufactura / Industria" },
  { value: "comercio_retail",         label: "Comercio / Retail" },
  { value: "comercio_mayorista",      label: "Comercio Mayorista" },
  { value: "salud",                   label: "Salud" },
  { value: "educacion",               label: "Educación" },
  { value: "gastronomia_turismo",     label: "Gastronomía / Turismo" },
  { value: "servicios_profesionales", label: "Servicios Profesionales" },
  { value: "tecnologia",              label: "Tecnología / TI" },
  { value: "transporte_logistica",    label: "Transporte / Logística" },
  { value: "inmobiliaria",            label: "Inmobiliaria" },
  { value: "agroindustria",           label: "Agroindustria / Agro" },
  { value: "mineria_energia",         label: "Minería / Energía" },
  { value: "seguridad",               label: "Seguridad / CCTV" },
  { value: "otro",                    label: "Otro" },
] as const;

export type SectorValue = typeof SECTORES[number]["value"];

export function sectorLabel(value: string): string {
  return SECTORES.find((s) => s.value === value)?.label ?? value;
}
