/**src/server/shared/events/eventBus.ts */

import { EventEmitter } from "events";
import { logger } from "../../config/logger";

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }

  publish(evento: string, data: any) {
    logger.debug({ evento, data }, "Evento publicado");
    this.emit(evento, data);
  }

  subscribe(evento: string, handler: (data: any) => void) {
    this.on(evento, handler);
    logger.debug({ evento }, "Suscriptor registrado");
  }

  unsubscribe(evento: string, handler: (data: any) => void) {
    this.off(evento, handler);
  }
}

export const eventBus = new EventBus();

// Eventos del CRM
export const CRM_EVENTS = {
  PROSPECTO_CREADO:    "prospecto:creado",
  PROSPECTO_UPDATED:  "prospecto:actualizado",
  LLAMADA_REGISTRADA: "llamada:registrada",
  REUNION_CREADA:     "reunion:creada",
  REUNION_UPDATED:    "reunion:actualizada",
  INGRESO_CREADO:     "ingreso:creado",
  BROCHURE_ENVIADO:   "brochure:enviado",
} as const;