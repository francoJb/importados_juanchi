-- Agregar columna anulada a la tabla ventas
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS anulada TINYINT(1) DEFAULT 0 AFTER estado;

-- Agregar columnas de borrado lógico a la tabla clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER estado;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_by INT NULL AFTER deleted_at;