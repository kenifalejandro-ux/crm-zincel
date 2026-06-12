export interface Competidor {
  id:             string;
  empresa:        string;
  plataforma:     "facebook";
  pagina_id:      string;
  nombre:         string;
  url_pagina:     string | null;
  imagen_url:     string | null;
  categoria:      string | null;
  descripcion:    string | null;
  activo:         boolean;
  creado_en:      string;
  // Joins desde snapshot + cálculos
  seguidores:     number | null;
  fan_count:      number | null;
  ultimo_snapshot: string | null;
  crecimiento_7d:  number | null;
  crecimiento_30d: number | null;
}

export interface PageBusqueda {
  pagina_id:   string;
  nombre:      string;
  seguidores:  number;
  fan_count:   number;
  categoria:   string | null;
  descripcion: string | null;
  imagen_url:  string | null;
  url_pagina:  string | null;
}

export interface SnapshotCompetidor {
  fecha:      string;
  seguidores: number;
  fan_count:  number;
}
