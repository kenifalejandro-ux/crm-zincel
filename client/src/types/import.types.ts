/**client/src/types/import.types.ts */

export interface ContactoImportado {
  nombre?: string;
  telefono?: string;
  email?: string;
  cargo?: string;
}

export interface EmpresaImportada {
  empresa: string;
  rubro?: string;
  ciudad?: string;
  pagina_web?: string;
  contactos: ContactoImportado[];
  duplicado: boolean;
}