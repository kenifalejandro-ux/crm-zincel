-- Migración: auto-clasificar sector y perfil_empresa desde actividad_economica
-- Ejecutar: sudo -u postgres psql -d zincel_rp -f /home/kenif/CRM-Zincel/migrar_sector_perfil.sql

UPDATE prospectos
SET
  sector = CASE
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'FERRETERI|MATERIALES DE CONSTRUCC' THEN 'construccion'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'CONSTRUCC|OBRA CIVIL|CONTRATIST|EDIFICACI|HABILITACION URBANA' THEN 'construccion'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'INMOBILI|BIENES RAICES|DESARROLLO INMOB' THEN 'inmobiliaria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ARQUITECTURA' THEN 'arquitectura_ingenieria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'INGENIERIA|CONSULTORIA TEC' THEN 'arquitectura_ingenieria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'MINERIA|EXTRACCION DE|PETROLEO|GAS NATURAL|GENERACION DE ENERGIA|SUMINISTRO DE ELECTRICIDAD' THEN 'mineria_energia'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'AGRICULTUR|GANADERI|ACUICULTUR|CULTIVO DE|AGROINDUST' THEN 'agroindustria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'TALLER|METALMECAN' THEN 'manufactura_industria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'FABRICACI|MANUFACTURA|ELABORACI|PRODUCCION DE' THEN 'manufactura_industria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'LABORATORIO CLINIC|LABORATORIO DE ANALISIS|ANALISIS CLINIC' THEN 'salud'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ODONTOLOG|DENTAL|CONSULTORIO MEDIC' THEN 'salud'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ATENCION.*SALUD|CLINICA|HOSPITAL|CENTRO MEDIC|CENTRO DE SALUD' THEN 'salud'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'FARMACEUT' AND unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'POR MAYOR|DROGUER' THEN 'comercio_mayorista'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'FARMACEUT' AND unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'POR MENOR' THEN 'comercio_retail'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'CAPACITACI' THEN 'educacion'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'PRIMARIA|SECUNDARIA|COLEGIO|ESCUELA BASICA' THEN 'educacion'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ENSENANZA|EDUCACI|INSTITUTO|ACADEMIA' THEN 'educacion'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'HOTEL|HOSPEDAJE|ALOJAMIENTO' THEN 'gastronomia_turismo'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'AGENCIA.*VIAJE|VIAJES.*TURISMO|AGENCIA.*TURISMO' THEN 'gastronomia_turismo'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'RESTAUR|CAFETERI|CEVICHER|PICANTER|SERVICIO DE COMIDA' THEN 'gastronomia_turismo'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'JURIDIC|NOTARI|ESTUDIO DE DERECHO' THEN 'servicios_profesionales'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'CONTABILIDAD|AUDITORIA|CONTADURI' THEN 'servicios_profesionales'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'CONSULTORIA|ASESORIA|GESTION EMPRESARIAL' THEN 'servicios_profesionales'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'PROGRAMACI|SOFTWARE|INFORMATICA|TECNOLOGIA.*INFORMACI|SISTEMAS INFORM' THEN 'tecnologia'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'SEGURIDAD|VIGILANCIA' THEN 'seguridad'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'AGENCIA.*ADUANA|OPERADOR.*ADUANA' THEN 'transporte_logistica'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ALMACENAMIENTO|ALMACEN|DEPOSITO.*MERCANC' THEN 'transporte_logistica'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'TRANSPORTE' THEN 'transporte_logistica'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'IMPORTACI|EXPORTACI|IMPORT.*EXPORT' THEN 'comercio_mayorista'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'POR MAYOR|AL POR MAYOR|DISTRIBUCI' THEN 'comercio_mayorista'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'POR MENOR|AL POR MENOR|COMERCIO ESPECIALI' THEN 'comercio_retail'
    ELSE NULL
  END,

  perfil_empresa = CASE
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'FERRETERI|MATERIALES DE CONSTRUCC' THEN 'ferreteria_materiales'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'CONSTRUCC|OBRA CIVIL|CONTRATIST|EDIFICACI|HABILITACION URBANA' THEN 'construccion'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'INMOBILI|BIENES RAICES|DESARROLLO INMOB' THEN 'inmobiliaria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ARQUITECTURA' THEN 'arquitectura'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'INGENIERIA|CONSULTORIA TEC' THEN 'ingenieria_consultoria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'MINERIA|EXTRACCION DE|PETROLEO|GAS NATURAL|GENERACION DE ENERGIA|SUMINISTRO DE ELECTRICIDAD' THEN 'mineria_energia'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'AGRICULTUR|GANADERI|ACUICULTUR|CULTIVO DE|AGROINDUST' THEN 'agroindustria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'TALLER|METALMECAN' THEN 'taller_industrial'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'FABRICACI|MANUFACTURA|ELABORACI|PRODUCCION DE' THEN 'fabrica_manufactura'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'LABORATORIO CLINIC|LABORATORIO DE ANALISIS|ANALISIS CLINIC' THEN 'laboratorio'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ODONTOLOG|DENTAL|CONSULTORIO MEDIC' THEN 'consultorio_medico'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ATENCION.*SALUD|CLINICA|HOSPITAL|CENTRO MEDIC|CENTRO DE SALUD' THEN 'clinica_hospital'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'FARMACEUT' AND unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'POR MAYOR|DROGUER' THEN 'drogueria_farmaceutica'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'FARMACEUT' AND unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'POR MENOR' THEN 'farmacia_botica'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'CAPACITACI' THEN 'centro_capacitacion'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'PRIMARIA|SECUNDARIA|COLEGIO|ESCUELA BASICA' THEN 'colegio'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ENSENANZA|EDUCACI|INSTITUTO|ACADEMIA' THEN 'instituto_academia'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'HOTEL|HOSPEDAJE|ALOJAMIENTO' THEN 'hotel_hospedaje'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'AGENCIA.*VIAJE|VIAJES.*TURISMO|AGENCIA.*TURISMO' THEN 'agencia_viajes'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'RESTAUR|CAFETERI|CEVICHER|PICANTER|SERVICIO DE COMIDA' THEN 'restaurante'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'JURIDIC|NOTARI|ESTUDIO DE DERECHO' THEN 'estudio_juridico'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'CONTABILIDAD|AUDITORIA|CONTADURI' THEN 'contabilidad_auditoria'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'CONSULTORIA|ASESORIA|GESTION EMPRESARIAL' THEN 'consultoria_empresarial'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'PROGRAMACI|SOFTWARE|INFORMATICA|TECNOLOGIA.*INFORMACI|SISTEMAS INFORM' THEN 'tecnologia_ti'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'SEGURIDAD|VIGILANCIA' THEN 'seguridad_cctv'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'AGENCIA.*ADUANA|OPERADOR.*ADUANA' THEN 'agencia_aduanas'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'ALMACENAMIENTO|ALMACEN|DEPOSITO.*MERCANC' THEN 'almacen_logistica'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'TRANSPORTE' THEN 'empresa_transportes'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'IMPORTACI|EXPORTACI|IMPORT.*EXPORT' THEN 'importadora_exportadora'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'POR MAYOR|AL POR MAYOR|DISTRIBUCI' THEN 'distribuidora_mayorista'
    WHEN unaccent(UPPER(COALESCE(actividad_economica,'') || ' ' || COALESCE(empresa,''))) ~* 'POR MENOR|AL POR MENOR|COMERCIO ESPECIALI' THEN 'tienda_retail'
    ELSE NULL
  END
WHERE actividad_economica IS NOT NULL AND actividad_economica != ''
  AND eliminado = false;

-- Reporte final
SELECT sector, COUNT(*) AS total
FROM prospectos
WHERE eliminado = false AND sector IS NOT NULL
GROUP BY sector ORDER BY total DESC;
