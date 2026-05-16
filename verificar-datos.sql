-- Verificar datos en tablas principales del CRM Zincel
-- Ejecutar: psql -U [usuario] -d [base_datos] -f verificar-datos.sql

\echo '==================== VERIFICACIÓN DE DATOS ===================='

\echo ''
\echo '📞 LLAMADAS:'
SELECT COUNT(*) as total_llamadas FROM llamadas;
SELECT COUNT(*) FILTER (WHERE contestada = true) as contestadas FROM llamadas;
SELECT COUNT(*) FILTER (WHERE contestada = false) as no_contestadas FROM llamadas;

\echo ''
\echo '📅 REUNIONES:'
SELECT COUNT(*) as total_reuniones FROM reuniones;
SELECT COUNT(*) FILTER (WHERE estado = 'programada') as programadas FROM reuniones;
SELECT COUNT(*) FILTER (WHERE estado = 'realizada') as realizadas FROM reuniones;
SELECT COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas FROM reuniones;

\echo ''
\echo '👥 PROSPECTOS:'
SELECT COUNT(*) as total_prospectos FROM prospectos;
SELECT COUNT(*) FILTER (WHERE estado_lead = 'interesado') as interesados FROM prospectos;

\echo ''
\echo '📄 BROCHURES:'
SELECT COUNT(*) as total_brochures FROM brochures;

\echo ''
\echo '💰 INGRESOS:'
SELECT COUNT(*) as total_ingresos FROM ingresos;
SELECT COALESCE(SUM(monto), 0) as total_monto FROM ingresos;

\echo ''
\echo '==================== FIN VERIFICACIÓN ===================='
