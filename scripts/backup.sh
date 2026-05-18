#!/bin/bash
# ── Backup automático de PostgreSQL ─────────────────────────────────────────
# Uso: ./scripts/backup.sh
# Programar con cron: crontab -e → 0 20 * * * /home/kenif/CRM-Zincel/scripts/backup.sh

# ── Configuración ────────────────────────────────────────────────────────────
DB_USER="zincel_user"
DB_NAME="zincel_rp"
DB_HOST="localhost"
DB_PORT="5432"
export PGPASSWORD="123456"

# Carpeta destino — cámbiala a tu carpeta de Google Drive / OneDrive si la tienes
# Ejemplos:
#   BACKUP_DIR="$HOME/Google Drive/CRM Backups"
#   BACKUP_DIR="$HOME/OneDrive/CRM Backups"
BACKUP_DIR="$HOME/crm_backups"

# Cuántos backups conservar (borra los más antiguos)
KEEP_DAYS=30

# ── Crear carpeta si no existe ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Nombre del archivo con fecha y hora ─────────────────────────────────────
FECHA=$(date +"%Y-%m-%d_%H-%M")
ARCHIVO="$BACKUP_DIR/zincel_crm_$FECHA.backup"

# ── Hacer el backup ──────────────────────────────────────────────────────────
pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -F c \
  -f "$ARCHIVO" \
  "$DB_NAME"

# ── Resultado ────────────────────────────────────────────────────────────────
if [ $? -eq 0 ]; then
  echo "✓ Backup guardado: $ARCHIVO"
else
  echo "✗ Error al crear el backup"
  exit 1
fi

# ── Borrar backups más antiguos de $KEEP_DAYS días ──────────────────────────
find "$BACKUP_DIR" -name "zincel_crm_*.backup" -mtime +$KEEP_DAYS -delete
echo "✓ Backups antiguos limpiados (>${KEEP_DAYS} días)"

# ── Subir a Google Drive con rclone (requiere tener rclone configurado) ──────
# Si no tienes rclone configurado, comenta las siguientes 3 líneas con #
if command -v rclone &>/dev/null; then
  rclone copy "$ARCHIVO" "gdrive:CRM Backups/" && echo "✓ Subido a Google Drive: CRM Backups/"
fi

# ── Mostrar todos los backups actuales ───────────────────────────────────────
echo ""
echo "Backups disponibles:"
ls -lh "$BACKUP_DIR"/zincel_crm_*.backup 2>/dev/null
