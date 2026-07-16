/**
 * Migración 2: Añadir columnas faltantes a master_events
 */

-- Añadir columnas faltantes a master_events
ALTER TABLE master_events
ADD COLUMN IF NOT EXISTS source VARCHAR(50);

ALTER TABLE master_events
ADD COLUMN IF NOT EXISTS version VARCHAR(10);

-- Actualizar columnas existentes con defaults
UPDATE master_events SET source = 'TRADING_ENGINE' WHERE source IS NULL;
UPDATE master_events SET version = '1.00' WHERE version IS NULL;
