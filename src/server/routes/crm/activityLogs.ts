/** src/server/routes/crm/activityLogs.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { obtenerTimelineService } from "../../services/activityLog.service";

export const activityLogsRouter = Router();

activityLogsRouter.use(authMiddleware);

// GET /api/crm/activity-logs/:prospectoId
activityLogsRouter.get("/:prospectoId", async (req, res) => {
  try {
    const data = await obtenerTimelineService(req.params.prospectoId);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
