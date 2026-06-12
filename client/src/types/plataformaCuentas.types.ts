export type PlataformaAPI = "meta" | "tiktok" | "google";

export interface PlataformaCuenta {
  id:               string;
  empresa:          string;
  plataforma:       PlataformaAPI;
  account_id:       string;
  activo:           boolean;
  notas?:           string;
  token_vence_en?:  string | null;
  ultimo_sync?:     string | null;
  sync_error?:      string | null;
  sync_automatico?: boolean | null;
  creado_en:        string;
  actualizado_en?:  string;
}

export interface PlataformaCuentaForm {
  empresa:        string;
  plataforma:     PlataformaAPI;
  account_id:     string;
  access_token:   string;
  activo:         boolean;
  notas:          string;
  token_vence_en: string;
}
