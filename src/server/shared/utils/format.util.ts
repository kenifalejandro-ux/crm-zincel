/**src/server/shared/utils/format.utils.ts */

export function formatearMoneda(monto: number, moneda = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style:    "currency",
    currency: moneda,
  }).format(monto);
}

export function formatearNumero(n: number): string {
  return new Intl.NumberFormat("es-PE").format(n);
}

export function capitalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .split(" ")
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

export function limpiarTexto(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}

export function truncarTexto(texto: string, limite = 100): string {
  if (texto.length <= limite) return texto;
  return texto.slice(0, limite).trimEnd() + "...";
}

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function labelEstadoLead(estado: string): string {
  const labels: Record<string, string> = {
    interesado:       "Interesado",
    no_interesado:    "No interesado",
    no_contesta:      "No contesta",
    volver_a_llamar:    "Volver a llamar",
    ocupado_en_reunion: "Ocupado / En reunión",
    prometio_llamar:    "Prometió llamar",
    buzon_de_voz:       "Buzón de voz",
    fuera_de_servicio:"Fuera de servicio",
    numero_equivocado:"Número equivocado",
    ya_tiene_proveedor:"Ya tiene proveedor",
    no_habido:          "No habido",
    baja_de_oficio:     "Baja de oficio",
    suspension_temporal:"Suspensión temporal",
  };
  return labels[estado] ?? estado;
}

export function labelCanal(canal: string): string {
  const labels: Record<string, string> = {
    llamada:   "Llamada",
    whatsapp:  "WhatsApp",
    correo:    "Correo",
    linkedin:  "LinkedIn",
    instagram: "Instagram",
    facebook:  "Facebook",
  };
  return labels[canal] ?? canal;
}