-- 1. Agrega las 5 nuevas columnas de manera segura permitiendo nulos (NULL)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS vehiculo_tipo VARCHAR(10) NULL AFTER control_stock;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS vehiculo_anio INT NULL AFTER vehiculo_tipo;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS vehiculo_chasis VARCHAR(50) NULL AFTER vehiculo_anio;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS vehiculo_motor VARCHAR(50) NULL AFTER vehiculo_chasis;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS vehiculo_color VARCHAR(30) NULL AFTER vehiculo_motor;