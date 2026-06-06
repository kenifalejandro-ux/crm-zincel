import { z } from "zod";

export const BenchmarkSchema = z.object({
  sector:         z.string().min(1),
  ctr_excelente:  z.number().nullable().optional(),
  ctr_aceptable:  z.number().nullable().optional(),
  cpc_excelente:  z.number().nullable().optional(),
  cpc_aceptable:  z.number().nullable().optional(),
  cpm_excelente:  z.number().nullable().optional(),
  cpm_aceptable:  z.number().nullable().optional(),
  cpl_excelente:  z.number().nullable().optional(),
  cpl_aceptable:  z.number().nullable().optional(),
  cpa_excelente:  z.number().nullable().optional(),
  cpa_aceptable:  z.number().nullable().optional(),
  roas_excelente: z.number().nullable().optional(),
  roas_aceptable: z.number().nullable().optional(),
  roi_excelente:  z.number().nullable().optional(),
  roi_aceptable:  z.number().nullable().optional(),
  fuente:         z.string().nullable().optional(),
});

export type BenchmarkInput = z.infer<typeof BenchmarkSchema>;
