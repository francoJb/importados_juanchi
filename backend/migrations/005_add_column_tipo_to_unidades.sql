ALTER TABLE vehiculos_unidades ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) NOT NULL AFTER estado;
ALTER TABLE vehiculos_unidades ADD COLUMN IF NOT EXISTS venta_detalle_id INT(10) NULL AFTER producto_id;