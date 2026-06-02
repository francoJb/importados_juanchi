-- Migración: Añadir soft-delete a clientes, proveedores, productos y anulación a ventas
-- Ejecutar con el script backend/scripts/run_migrations.js o manualmente en MySQL

-- CLIENTES
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_by INT NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado TINYINT(1) DEFAULT 1;

-- PROVEEDORES
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS deleted_by INT NULL;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS estado TINYINT(1) DEFAULT 1;

-- PRODUCTOS
ALTER TABLE productos ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS deleted_by INT NULL;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS estado TINYINT(1) DEFAULT 1;

-- VENTAS: anulación en lugar de borrado
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS anulada TINYINT(1) DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT NULL;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS anulado_por INT NULL;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS fecha_anulacion DATETIME NULL;

-- Opcional: índice para consultas rápidas por estado
ALTER TABLE clientes ADD INDEX IF NOT EXISTS idx_clientes_estado (estado);
ALTER TABLE proveedores ADD INDEX IF NOT EXISTS idx_proveedores_estado (estado);
ALTER TABLE productos ADD INDEX IF NOT EXISTS idx_productos_estado (estado);
ALTER TABLE ventas ADD INDEX IF NOT EXISTS idx_ventas_anulada (anulada);

-- Nota: revisá las FK de 'deleted_by' y 'anulado_por' si querés referenciarlas a usuarios
