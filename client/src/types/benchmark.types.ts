export interface BenchmarkSector {
  id:             string;
  sector:         string;
  ctr_excelente:  number | null;
  ctr_aceptable:  number | null;
  cpc_excelente:  number | null;
  cpc_aceptable:  number | null;
  cpm_excelente:  number | null;
  cpm_aceptable:  number | null;
  cpl_excelente:  number | null;
  cpl_aceptable:  number | null;
  cpa_excelente:  number | null;
  cpa_aceptable:  number | null;
  roas_excelente: number | null;
  roas_aceptable: number | null;
  roi_excelente:  number | null;
  roi_aceptable:  number | null;
  fuente:         string | null;
  created_at:     string;
}

export type BenchmarkInput = Omit<BenchmarkSector, "id" | "created_at">;
