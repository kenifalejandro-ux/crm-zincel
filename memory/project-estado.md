---
name: project-estado
description: Estado general del CRM Zincel — qué está implementado y qué falta
metadata:
  type: project
---

## Estado actual: Operativo al 100% (mayo 2026)

El CRM Zincel está completo a nivel operativo. Todas las funcionalidades principales han sido implementadas y verificadas.

**Módulos operativos:**
- Prospectos — gestión completa, filtros, paginación
- Pipeline Kanban — drag & drop, undo toast, actualización optimista, cards colapsables con color por etapa
- Propuestas — CRUD, estados, motivo de cierre perdido, auto-ingreso al cerrar ganada
- Llamadas — registro, heatmap, estadísticas por período
- Reuniones — agendado, estados
- Brochures — envío y seguimiento
- Finanzas — ingresos, egresos, préstamos, tipo de cambio USD/PEN
- Dashboard — métricas, actividad, fases ciclo de venta, tasa conversión
- Inteligencia — abandono pipeline, tiempo primera respuesta, forecast ponderado, conversión funnel, rechazos duales
- Tareas, Plantillas, Métricas, Mi Perfil, Configuración

**Detalles técnicos clave:**
- Pipeline cards: etapas nuevo/contactado/interesado = tarjeta simple (click abre detalle); propuesta_enviada/negociacion/cerrado_ganado/perdido = tarjeta colapsable con borde de color y servicio contratado
- `servicio_propuesta` se obtiene via subquery en `getPipelineService()` desde la propuesta activa más reciente
- `sincronizarEtapaPorPropuestas()` mueve el card a "perdido" cuando todas las propuestas son cerrada_perdida/vencida
- Campo `motivo_cierre_perdido` en tabla `propuestas` (migración aplicada manualmente como postgres superuser)

**Why:** El CRM fue construido desde cero para Zincel Ideas como herramienta interna de gestión comercial.
**How to apply:** Nuevas solicitudes son mejoras/refinamientos sobre una base estable, no construcción desde cero.
