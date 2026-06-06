import api from "./api";
import type { BenchmarkSector, BenchmarkInput } from "../types/benchmark.types";

export async function listarBenchmarks(): Promise<BenchmarkSector[]> {
  const r = await api.get("/benchmarks");
  return r.data.data;
}

export async function getBenchmarkPorEmpresa(empresa: string): Promise<BenchmarkSector | null> {
  const r = await api.get(`/benchmarks/empresa/${encodeURIComponent(empresa)}`);
  return r.data.data;
}

export async function getBenchmarkPorSector(sector: string): Promise<BenchmarkSector | null> {
  const r = await api.get(`/benchmarks/sector/${encodeURIComponent(sector)}`);
  return r.data.data;
}

export async function crearBenchmark(input: BenchmarkInput): Promise<BenchmarkSector> {
  const r = await api.post("/benchmarks", input);
  return r.data.data;
}

export async function actualizarBenchmark(id: string, input: Partial<BenchmarkInput>): Promise<BenchmarkSector> {
  const r = await api.put(`/benchmarks/${id}`, input);
  return r.data.data;
}

export async function eliminarBenchmark(id: string): Promise<void> {
  await api.delete(`/benchmarks/${id}`);
}

export async function updateEmpresaSector(empresa: string, sector: string): Promise<void> {
  await api.put("/benchmarks/empresa-sector", { empresa, sector });
}
