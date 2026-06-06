export interface MetaCuenta {
  id:              string;
  empresa:         string;
  ad_account_id:   string;
  activo:          boolean;
  notas?:          string;
  sector?:         string | null;
  creado_en:       string;
  actualizado_en?: string;
}

export interface MetaCuentaForm {
  empresa:       string;
  ad_account_id: string;
  access_token:  string;
  activo:        boolean;
  notas:         string;
}
