/**client/src/utils/normalizar.ts */

export function normalizarEmpresa(nombre: string) {
  return nombre
    ?.toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[.,]/g, "");
}