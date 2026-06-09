import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { validate } from "../../middleware/validate";
import { BenchmarkSchema } from "../../schemas/benchmarks.schema";
import {
  listarBenchmarksService,
  getBenchmarkPorSectorService,
  getBenchmarkPorEmpresaService,
  crearBenchmarkService,
  actualizarBenchmarkService,
  eliminarBenchmarkService,
  updateEmpresaSectorService,
} from "../../services/benchmarks.service";

export const benchmarksRouter = Router();
benchmarksRouter.use(authMiddleware);

benchmarksRouter.get("/", async (req, res) => {
  try {
    const data = await listarBenchmarksService();
    res.json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

benchmarksRouter.get("/empresa/:empresa", async (req, res) => {
  try {
    const data = await getBenchmarkPorEmpresaService(req.params.empresa);
    res.json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

benchmarksRouter.get("/sector/:sector", async (req, res) => {
  try {
    const data = await getBenchmarkPorSectorService(req.params.sector);
    res.json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

benchmarksRouter.post("/", validate(BenchmarkSchema), async (req, res) => {
  try {
    const data = await crearBenchmarkService(req.validatedBody as any);
    res.status(201).json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

benchmarksRouter.put("/empresa-sector", async (req, res) => {
  try {
    const { empresa, sector } = req.body;
    if (!empresa) return res.status(400).json({ ok: false, message: "empresa requerida" });
    await updateEmpresaSectorService(empresa, sector ?? "");
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

benchmarksRouter.put("/:id", async (req, res) => {
  try {
    const data = await actualizarBenchmarkService(req.params.id, req.body);
    res.json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

benchmarksRouter.delete("/:id", async (req, res) => {
  try {
    await eliminarBenchmarkService(req.params.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});
