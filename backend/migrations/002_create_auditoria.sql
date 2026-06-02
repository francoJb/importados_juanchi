-- Migración: Crear tabla auditoria para registrar acciones críticas
CREATE TABLE IF NOT EXISTS auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  usuario_id INT NULL,
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT NULL,
  descripcion TEXT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_empresa (empresa_id),
  INDEX idx_auditoria_entidad (entidad, entidad_id)
);
