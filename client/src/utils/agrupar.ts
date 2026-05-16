/**client/src/utils/agrupar.ts */

import { EmpresaImportada } from "../types/import.types";

export function agruparPorEmpresa(rows: any[]): EmpresaImportada[] {
  const mapa: Record<string, EmpresaImportada> = {};

  for (const row of rows) {
    const empresa = row["EMPRESA"] || row["Empresa"];
    if (!empresa) continue;

    const key = empresa.toLowerCase().replace(/\s+/g, "");

    if (!mapa[key]) {
      mapa[key] = {
        empresa,
        rubro: row["RUBRO"],
        ciudad: row["Provincia"],
        pagina_web: row["Pagina web"],
        contactos: [],
        duplicado: false,
      };
    }

    mapa[key].contactos.push({
      nombre: row["Funcionario"] || row["Contacto"],
      telefono: row["Celular"],
      email: row["Email"],
      cargo: row["Cargo"],
    });

    if (mapa[key].contactos.length > 1) {
      mapa[key].duplicado = true;
    }
  }

  return Object.values(mapa);
}