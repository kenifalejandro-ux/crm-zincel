/** src/server/shared/listeners/scoreListener.ts
 *
 *  Suscribe eventos del CRM y recalcula el score del lead afectado
 *  en tiempo real — sin bloquear el response al cliente.
 */

import { eventBus, CRM_EVENTS } from "../events/eventBus";
import { recalcularScoreProspecto } from "../../services/prospecto.service";
import { logger } from "../../config/logger";

export function initScoreListener() {
  eventBus.subscribe(CRM_EVENTS.LLAMADA_REGISTRADA, ({ prospecto_id }: { prospecto_id: string }) => {
    recalcularScoreProspecto(prospecto_id)
      .then(() => logger.debug({ prospecto_id }, "Score recalculado tras llamada"))
      .catch(() => {});
  });

  eventBus.subscribe(CRM_EVENTS.PROSPECTO_UPDATED, ({ id }: { id: string }) => {
    recalcularScoreProspecto(id)
      .then(() => logger.debug({ id }, "Score recalculado tras actualización"))
      .catch(() => {});
  });

  eventBus.subscribe(CRM_EVENTS.BROCHURE_ENVIADO, ({ prospecto_id }: { prospecto_id: string }) => {
    recalcularScoreProspecto(prospecto_id)
      .then(() => logger.debug({ prospecto_id }, "Score recalculado tras brochure"))
      .catch(() => {});
  });

  logger.info("Score listener iniciado");
}
