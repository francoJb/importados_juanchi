Read [](file:///c%3A/Users/Franco/Desktop/sophia/backend/controllers/clientesController.js)

Read [](file:///c%3A/Users/Franco/Desktop/sophia/backend/controllers/productosController.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/Franco/Desktop/sophia/backend/controllers/proveedoresController.js)

Read [](file:///c%3A/Users/Franco/Desktop/sophia/backend/controllers/ventasController.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/Franco/Desktop/sophia/backend/middlewares/authMiddleware.js)

## PLAN DETALLADO: Convertir a SaaS con Multi-Tenant (Empresa_ID)

---

## 📋 FASE 1: BASE DE DATOS

### 1.1 Crear backup
```sql
-- Desde terminal MySQL o tu cliente favorito
mysqldump -u tu_usuario -p tu_base_de_datos > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 1.2 Borrar y recrear tablas con `empresa_id`

**Tablas a recrear (en este orden debido a relaciones):**

1. **`categorias`** - Agregar `empresa_id`
   ```sql
   DROP TABLE IF EXISTS categorias;
   CREATE TABLE categorias (
       id INT AUTO_INCREMENT PRIMARY KEY,
       empresa_id INT NOT NULL,
       nombre VARCHAR(100) NOT NULL,
       estado TINYINT(1) DEFAULT 1,
       fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
       UNIQUE KEY unique_categoria_empresa (empresa_id, nombre),
       FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
   );
   ```

2. **`proveedores`** - Agregar `empresa_id`
   ```sql
   DROP TABLE IF EXISTS proveedores;
   CREATE TABLE proveedores (
       id INT AUTO_INCREMENT PRIMARY KEY,
       empresa_id INT NOT NULL,
       nombre VARCHAR(150) NOT NULL,
       cuit VARCHAR(50),
       arca_categoria VARCHAR(100),
       banco_cuenta VARCHAR(150),
       telefono VARCHAR(50),
       direccion VARCHAR(255),
       email VARCHAR(100),
       observaciones TEXT,
       estado TINYINT(1) DEFAULT 1,
       fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
       UNIQUE KEY unique_proveedor_empresa (empresa_id, nombre),
       FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
   );
   ```

3. **`productos`** - Agregar `empresa_id`
   ```sql
   DROP TABLE IF EXISTS detalle_ventas;
   DROP TABLE IF EXISTS ventas;
   DROP TABLE IF EXISTS cuenta_corriente;
   DROP TABLE IF EXISTS clientes;
   DROP TABLE IF EXISTS productos;
   
   CREATE TABLE productos (
       id INT AUTO_INCREMENT PRIMARY KEY,
       empresa_id INT NOT NULL,
       sku VARCHAR(50) NOT NULL,
       descripcion VARCHAR(255) NOT NULL,
       marca VARCHAR(100),
       modelo VARCHAR(100),
       categoria_id INT,
       proveedor VARCHAR(100),
       proveedor_id INT,
       costo DECIMAL(12,2),
       precio_neto DECIMAL(12,2),
       iva DECIMAL(5,2),
       control_stock TINYINT(1) DEFAULT 1,
       stock INT DEFAULT 0,
       stock_minimo INT DEFAULT 0,
       estado TINYINT(1) DEFAULT 1,
       UNIQUE KEY unique_sku_empresa (empresa_id, sku),
       FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
       FOREIGN KEY (categoria_id) REFERENCES categorias(id),
       FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
   );
   ```

4. **`clientes`** - Agregar `empresa_id`
   ```sql
   CREATE TABLE clientes (
       id INT AUTO_INCREMENT PRIMARY KEY,
       empresa_id INT NOT NULL,
       nombre VARCHAR(100) NOT NULL,
       apellido VARCHAR(100) NOT NULL,
       telefono VARCHAR(50),
       direccion VARCHAR(255),
       dni VARCHAR(20),
       cuit VARCHAR(20),
       arca ENUM('Consumidor Final', 'IVA Responsable Inscripto', 'Responsable Monotributo', 'Exento'),
       email VARCHAR(100),
       habilitar_cc TINYINT(1) DEFAULT 0,
       fecha_alta DATE DEFAULT CURRENT_DATE,
       estado TINYINT(1) DEFAULT 1,
       UNIQUE KEY unique_dni_empresa (empresa_id, dni),
       UNIQUE KEY unique_cuit_empresa (empresa_id, cuit),
       FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
   );
   ```

5. **`ventas`** - Agregar `empresa_id`
   ```sql
   CREATE TABLE ventas (
       id INT AUTO_INCREMENT PRIMARY KEY,
       empresa_id INT NOT NULL,
       cliente_id INT NULL,
       fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
       total DECIMAL(12, 2) NOT NULL,
       metodo_pago ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'QR', 'Cuenta Corriente') NOT NULL,
       estado_pago ENUM('Pagado', 'Pendiente', 'Parcial') DEFAULT 'Pagado',
       saldo_pendiente DECIMAL(12, 2) DEFAULT 0.00,
       observaciones TEXT,
       FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
       FOREIGN KEY (cliente_id) REFERENCES clientes(id)
   );
   ```

6. **`detalle_ventas`** - Agregar `empresa_id`
   ```sql
   CREATE TABLE detalle_ventas (
       id INT AUTO_INCREMENT PRIMARY KEY,
       empresa_id INT NOT NULL,
       venta_id INT NOT NULL,
       producto_id INT NOT NULL,
       cantidad INT NOT NULL,
       precio_unitario DECIMAL(12, 2) NOT NULL,
       FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
       FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
       FOREIGN KEY (producto_id) REFERENCES productos(id)
   );
   ```

7. **`cuenta_corriente`** - Agregar `empresa_id`
   ```sql
   CREATE TABLE cuenta_corriente (
       id INT AUTO_INCREMENT PRIMARY KEY,
       empresa_id INT NOT NULL,
       cliente_id INT NOT NULL,
       venta_id INT NULL,
       fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
       descripcion VARCHAR(255),
       observaciones TEXT NULL,
       debe DECIMAL(12, 2) DEFAULT 0.00,
       haber DECIMAL(12, 2) DEFAULT 0.00,
       saldo_acumulado DECIMAL(12, 2),
       FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
       FOREIGN KEY (cliente_id) REFERENCES clientes(id),
       FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
   );
   ```

**Notas:**
- `usuarios` y `empresas` mantienen su estructura (no tocar)
- Los UNIQUE con `empresa_id` permiten que cada empresa tenga su propio `SKU`, `dni`, `cuit`, etc.
- Las FK aseguran referencia e integridad

---

## 📋 FASE 2: MIDDLEWARE

### 2.1 Modificar authMiddleware.js
**Archivo:** authMiddleware.js

**Cambio:** El middleware ya está parcialmente bien, pero debes extender para exponer `empresaId`.

**Función a reemplazar:**
```javascript
// Anterior:
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token requerido." });
    }

    const partes = authHeader.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({ error: "Formato de token inválido." });
    }

    const token = partes[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido o vencido." });
    }
}

// Nuevo:
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token requerido." });
    }

    const partes = authHeader.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({ error: "Formato de token inválido." });
    }

    const token = partes[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // Agregar para que los controladores puedan usar estos valores
        req.empresaId = decoded.empresaId;
        req.usuarioId = decoded.usuarioId;
        req.role = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido o vencido." });
    }
}
```

### 2.2 Crear nuevo middleware de validación de tenant
**Crear archivo:** `backend/middlewares/tenantMiddleware.js`

```javascript
// Validar que la empresa_id del token coincida con la consulta
function verificarTenant(req, res, next) {
    if (!req.empresaId) {
        return res.status(401).json({ error: "Empresa no identificada en token." });
    }

    // Los controladores usan req.empresaId para filtrar datos
    next();
}

module.exports = verificarTenant;
```

---

## 📋 FASE 3: CONTROLADORES

### 3.1 productosController.js

**Funciones a MODIFICAR:**

#### a) `obtenerOCrearCategoria` - Agregar `empresa_id`
```javascript
// ANTES:
async function obtenerOCrearCategoria(nombreCategoria) {
    if (!nombreCategoria?.trim()) return null;
    const nombreNormalizado = nombreCategoria.trim().toUpperCase();
    const [existing] = await db.query("SELECT id FROM categorias WHERE nombre = ? AND estado = 1", [nombreNormalizado]);
    if (existing.length > 0) {
        return existing[0].id;
    }
    const [result] = await db.query("INSERT INTO categorias (nombre, estado) VALUES (?, 1)", [nombreNormalizado]);
    return result.insertId;
}

// DESPUÉS:
async function obtenerOCrearCategoria(nombreCategoria, empresaId) {
    if (!nombreCategoria?.trim()) return null;
    const nombreNormalizado = nombreCategoria.trim().toUpperCase();
    const [existing] = await db.query("SELECT id FROM categorias WHERE empresa_id = ? AND nombre = ? AND estado = 1", [empresaId, nombreNormalizado]);
    if (existing.length > 0) {
        return existing[0].id;
    }
    const [result] = await db.query("INSERT INTO categorias (empresa_id, nombre, estado) VALUES (?, ?, 1)", [empresaId, nombreNormalizado]);
    return result.insertId;
}
```

#### b) `obtenerOCrearProveedor` - Agregar `empresa_id`
```javascript
// ANTES:
async function obtenerOCrearProveedor(nombreProveedor) {
    if (!nombreProveedor?.trim()) return null;
    const nombreNormalizado = nombreProveedor.trim().toUpperCase();
    const [existing] = await db.query("SELECT id FROM proveedores WHERE nombre = ? AND estado = 1", [nombreNormalizado]);
    if (existing.length > 0) {
        return existing[0].id;
    }
    const [result] = await db.query(`INSERT INTO proveedores (nombre, estado) VALUES (?, 1)`, [nombreNormalizado]);
    return result.insertId;
}

// DESPUÉS:
async function obtenerOCrearProveedor(nombreProveedor, empresaId) {
    if (!nombreProveedor?.trim()) return null;
    const nombreNormalizado = nombreProveedor.trim().toUpperCase();
    const [existing] = await db.query("SELECT id FROM proveedores WHERE empresa_id = ? AND nombre = ? AND estado = 1", [empresaId, nombreNormalizado]);
    if (existing.length > 0) {
        return existing[0].id;
    }
    const [result] = await db.query(`INSERT INTO proveedores (empresa_id, nombre, estado) VALUES (?, ?, 1)`, [empresaId, nombreNormalizado]);
    return result.insertId;
}
```

#### c) `obtenerProductos` - Filtrar por `empresa_id`
```javascript
// ANTES:
exports.obtenerProductos = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.nombre as categoria, COALESCE(pr.nombre, p.proveedor) as proveedor
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.estado = 1
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DESPUÉS:
exports.obtenerProductos = async (req, res) => {
    try {
        const empresaId = req.empresaId; // Del middleware
        const [rows] = await db.query(`
            SELECT p.*, c.nombre as categoria, COALESCE(pr.nombre, p.proveedor) as proveedor
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id AND c.empresa_id = ?
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id AND pr.empresa_id = ?
            WHERE p.empresa_id = ? AND p.estado = 1
        `, [empresaId, empresaId, empresaId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

#### d) `obtenerCategorias` - Filtrar por `empresa_id`
```javascript
// ANTES:
exports.obtenerCategorias = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, nombre FROM categorias WHERE estado = 1 ORDER BY nombre");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DESPUÉS:
exports.obtenerCategorias = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const [rows] = await db.query("SELECT id, nombre FROM categorias WHERE empresa_id = ? AND estado = 1 ORDER BY nombre", [empresaId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

#### e) `crearProducto` - Agregar `empresa_id` y validar en scope
```javascript
// ANTES:
exports.crearProducto = async (req, res) => {
    const p = req.body;
    if (!p.sku?.trim() || !p.descripcion?.trim()) {
        return res.status(400).json({ error: "SKU y Descripcion son obligatorios" });
    }
    try {
        const checkSql = "SELECT id FROM productos WHERE sku = ? AND estado = 1";
        const [existing] = await db.query(checkSql, [p.sku.trim()]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: `El SKU "${p.sku}" ya esta registrado en otro producto` });
        }
        const categoriaId = await obtenerOCrearCategoria(p.categoria);
        const proveedorId = await obtenerOCrearProveedor(p.proveedor);
        const sql = `INSERT INTO productos (sku, descripcion, marca, modelo, categoria_id, proveedor, proveedor_id, costo, precio_neto, iva, control_stock, stock, stock_minimo, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
        const params = [p.sku.trim(), p.descripcion, p.marca, p.modelo, categoriaId, p.proveedor, proveedorId, p.costo || 0, p.precio_neto || 0, p.iva || 21, p.control_stock ? 1 : 0, p.stock || 0, p.stock_minimo || 0];
        // ... resto del código

// DESPUÉS:
exports.crearProducto = async (req, res) => {
    const p = req.body;
    const empresaId = req.empresaId; // Del middleware
    
    if (!p.sku?.trim() || !p.descripcion?.trim()) {
        return res.status(400).json({ error: "SKU y Descripcion son obligatorios" });
    }
    try {
        const checkSql = "SELECT id FROM productos WHERE empresa_id = ? AND sku = ? AND estado = 1";
        const [existing] = await db.query(checkSql, [empresaId, p.sku.trim()]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: `El SKU "${p.sku}" ya esta registrado en otro producto` });
        }
        const categoriaId = await obtenerOCrearCategoria(p.categoria, empresaId);
        const proveedorId = await obtenerOCrearProveedor(p.proveedor, empresaId);
        const sql = `INSERT INTO productos (empresa_id, sku, descripcion, marca, modelo, categoria_id, proveedor, proveedor_id, costo, precio_neto, iva, control_stock, stock, stock_minimo, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
        const params = [empresaId, p.sku.trim(), p.descripcion, p.marca, p.modelo, categoriaId, p.proveedor, proveedorId, p.costo || 0, p.precio_neto || 0, p.iva || 21, p.control_stock ? 1 : 0, p.stock || 0, p.stock_minimo || 0];
        // ... resto del código
```

#### f) `editarProducto` - Validar por empresa
```javascript
// Necesitas agregar `empresaId` a los WHERE UPDATE existentes
// WHERE id = ? → WHERE id = ? AND empresa_id = ?
```

#### g) `eliminarProducto` - Validar por empresa
```javascript
// Necesitas agregar `empresaId` a los WHERE existentes
// WHERE id = ? → WHERE id = ? AND empresa_id = ?
```

---

### 3.2 clientesController.js

**Funciones a MODIFICAR:**

#### a) `obtenerClientes` - Filtrar por `empresa_id`
```javascript
// ANTES:
exports.obtenerClientes = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM clientes WHERE estado = 1");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DESPUÉS:
exports.obtenerClientes = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const [rows] = await db.query("SELECT * FROM clientes WHERE empresa_id = ? AND estado = 1", [empresaId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

#### b) `crearCliente` - Agregar `empresa_id`
```javascript
// ANTES:
const sql = `INSERT INTO clientes (nombre, apellido, telefono, direccion, dni, cuit, arca, email, habilitar_cc, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;

// DESPUÉS:
const sql = `INSERT INTO clientes (empresa_id, nombre, apellido, telefono, direccion, dni, cuit, arca, email, habilitar_cc, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
const params = [req.empresaId, p.nombre, p.apellido, ...resto];
```

#### c) `editarCliente` - Validar por empresa
```javascript
// ANTES:
const sql = `UPDATE clientes SET nombre=?, apellido=?, ... WHERE id=?`;

// DESPUÉS:
const sql = `UPDATE clientes SET nombre=?, apellido=?, ... WHERE id=? AND empresa_id=?`;
// Agregar empresaId al final de params
```

#### d) `eliminarCliente` - Validar por empresa
```javascript
// ANTES:
const sql = `UPDATE clientes SET estado = 0 WHERE id = ?`;

// DESPUÉS:
const sql = `UPDATE clientes SET estado = 0 WHERE id = ? AND empresa_id = ?`;
```

#### e) `obtenerCuentaCorriente` - Filtrar por empresa
```javascript
// ANTES:
const [rows] = await db.query(`
    SELECT ... FROM cuenta_corriente 
    WHERE cliente_id = ? 
    ORDER BY fecha DESC`, [id]);

// DESPUÉS:
const empresaId = req.empresaId;
const [rows] = await db.query(`
    SELECT ... FROM cuenta_corriente 
    WHERE cliente_id = ? AND empresa_id = ? 
    ORDER BY fecha DESC`, [id, empresaId]);
```

---

### 3.3 proveedoresController.js

**Funciones a MODIFICAR:**

#### a) `obtenerProveedores` - Filtrar por `empresa_id`
```javascript
// ANTES:
exports.obtenerProveedores = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM proveedores WHERE estado = 1 ORDER BY nombre");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DESPUÉS:
exports.obtenerProveedores = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const [rows] = await db.query("SELECT * FROM proveedores WHERE empresa_id = ? AND estado = 1 ORDER BY nombre", [empresaId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

#### b) `crearProveedor` - Agregar `empresa_id`
```javascript
// ANTES:
const [result] = await db.query(
    "INSERT INTO proveedores (nombre, cuit, ...) VALUES (?, ?, ...)",
    [nombre.toUpperCase(), cuit, ...]
);

// DESPUÉS:
const [result] = await db.query(
    "INSERT INTO proveedores (empresa_id, nombre, cuit, ...) VALUES (?, ?, ?, ...)",
    [req.empresaId, nombre.toUpperCase(), cuit, ...]
);
```

#### c) `actualizarProveedor` - Validar por empresa
```javascript
// ANTES:
await db.query(
    "UPDATE proveedores SET nombre = ?, ... WHERE id = ?",
    [..., id]
);

// DESPUÉS:
await db.query(
    "UPDATE proveedores SET nombre = ?, ... WHERE id = ? AND empresa_id = ?",
    [..., id, req.empresaId]
);
```

#### d) `eliminarProveedor` - Validar por empresa
```javascript
// ANTES:
await db.query("UPDATE proveedores SET estado = 0 WHERE id = ?", [id]);

// DESPUÉS:
await db.query("UPDATE proveedores SET estado = 0 WHERE id = ? AND empresa_id = ?", [id, req.empresaId]);
```

---

### 3.4 ventasController.js

**Funciones a MODIFICAR:**

#### a) `crearVenta` - Agregar `empresa_id` en transacción
```javascript
// ANTES:
const [ventaRes] = await connection.query(
    `INSERT INTO ventas (cliente_id, total, metodo_pago, estado_pago, saldo_pendiente, observaciones) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [cliente_id === 0 ? null : cliente_id, total, metodo_pago, estadoPago, saldoPendiente, observaciones]
);

// DESPUÉS:
const empresaId = req.empresaId;
const [ventaRes] = await connection.query(
    `INSERT INTO ventas (empresa_id, cliente_id, total, metodo_pago, estado_pago, saldo_pendiente, observaciones) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [empresaId, cliente_id === 0 ? null : cliente_id, total, metodo_pago, estadoPago, saldoPendiente, observaciones]
);
```

#### b) Cada `connection.query` dentro de `crearVenta` debe filtrar/incluir `empresa_id`:
```javascript
// Para cada INSERT de detalle_ventas:
// ANTES:
await connection.query(
    "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
    [ventaId, item.id, item.cantidad, item.precio]
);

// DESPUÉS:
await connection.query(
    "INSERT INTO detalle_ventas (empresa_id, venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)",
    [empresaId, ventaId, item.id, item.cantidad, item.precio]
);

// Para UPDATE de productos:
// ANTES:
await connection.query(
    "UPDATE productos SET stock = stock - ? WHERE id = ?",
    [item.cantidad, item.id]
);

// DESPUÉS:
await connection.query(
    "UPDATE productos SET stock = stock - ? WHERE id = ? AND empresa_id = ?",
    [item.cantidad, item.id, empresaId]
);

// Para INSERT en cuenta_corriente:
// ANTES:
await connection.query(
    `INSERT INTO cuenta_corriente (cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
    VALUES (?, ?, ?, ?, 0, ?)`,
    [cliente_id, ventaId, descripcion, total, saldoCalculado]
);

// DESPUÉS:
await connection.query(
    `INSERT INTO cuenta_corriente (empresa_id, cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
    VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [empresaId, cliente_id, ventaId, descripcion, total, saldoCalculado]
);
```

#### c) `obtenerVentas` - Filtrar por `empresa_id`
```javascript
// ANTES:
const [rows] = await db.query(`
    SELECT ... FROM ventas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    ORDER BY v.fecha DESC
`);

// DESPUÉS:
const empresaId = req.empresaId;
const [rows] = await db.query(`
    SELECT ... FROM ventas v
    LEFT JOIN clientes c ON v.cliente_id = c.id AND c.empresa_id = ?
    WHERE v.empresa_id = ?
    ORDER BY v.fecha DESC
`, [empresaId, empresaId]);
```

#### d) `obtenerVenta` - Filtrar por `empresa_id`
```javascript
// Cualquier WHERE id = ? debe tener: WHERE id = ? AND empresa_id = ?
```

#### e) `obtenerDetalleVenta` - Filtrar por `empresa_id`
```javascript
// Cualquier SELECT debe agregar: AND empresa_id = ?
```

#### f) `registrarPago` - Filtrar por `empresa_id`
```javascript
// Cualquier UPDATE/INSERT debe agregar empresa_id
```

#### g) `eliminarVenta` - Filtrar por `empresa_id`
```javascript
// ANTES:
const sql = `DELETE FROM ventas WHERE id = ?`;

// DESPUÉS (o mejor, soft delete):
const sql = `UPDATE ventas SET estado_pago = 'Cancelada' WHERE id = ? AND empresa_id = ?`;
```

---

### 3.5 adminController.js

**Funciones a AGREGAR, MODIFICAR o ELIMINAR:**

#### MANTENER Y EXTENDER:
- `listCompanies()` ✅ (sin cambios, lista todas las empresas)
- `createCompany()` ✅ (sin cambios, crea empresa)

#### MODIFICAR:
- `listUsers()` ✅ (sin cambios, listar usuarios es global, es admin)
- `createUser()` ✅ (sin cambios, es admin quien crea)

#### NUEVAS FUNCIONES A AGREGAR:

##### a) `getCompany` - Obtener empresa por ID
```javascript
exports.getCompany = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT id, nombre, razon_social, cuit, domicilio, email, telefono, website, condicion_iva, estado FROM empresas WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo empresa:', error);
        res.status(500).json({ error: 'No se pudo obtener la empresa.' });
    }
};
```

##### b) `updateCompany` - Editar empresa
```javascript
exports.updateCompany = async (req, res) => {
    const { id } = req.params;
    const { nombre, razon_social, cuit, domicilio, email, telefono, website, condicion_iva } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre de la empresa es obligatorio.' });
    }

    try {
        const [result] = await db.query(
            `UPDATE empresas SET nombre=?, razon_social=?, cuit=?, domicilio=?, email=?, telefono=?, website=?, condicion_iva=? WHERE id=?`,
            [nombre.trim(), razon_social || '', cuit || '', domicilio || '', email || '', telefono || '', website || '', condicion_iva || '', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }

        res.json({ success: true, mensaje: 'Empresa actualizada.' });
    } catch (error) {
        console.error('Error actualizando empresa:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ya existe una empresa con ese nombre o CUIT.' });
        }
        res.status(500).json({ error: 'No se pudo actualizar la empresa.' });
    }
};
```

##### c) `deleteCompany` - Borrar empresa (soft delete)
```javascript
exports.deleteCompany = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query(
            `UPDATE empresas SET estado = 0 WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }

        res.json({ success: true, mensaje: 'Empresa desactivada.' });
    } catch (error) {
        console.error('Error desactivando empresa:', error);
        res.status(500).json({ error: 'No se pudo desactivar la empresa.' });
    }
};
```

##### d) `getUsersByCompany` - Obtener usuarios de una empresa
```javascript
exports.getUsersByCompany = async (req, res) => {
    const { empresaId } = req.params;
    
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.usuario, u.nombre, u.apellido, u.role, u.estado, u.empresa_id, u.fecha_alta
            FROM usuarios u
            WHERE u.empresa_id = ?
            ORDER BY u.id DESC
        `, [empresaId]);
        res.json(rows);
    } catch (error) {
        console.error('Error listando usuarios:', error);
        res.status(500).json({ error: 'No se pudieron cargar los usuarios.' });
    }
};
```

##### e) `getUser` - Obtener usuario por ID
```javascript
exports.getUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.usuario, u.nombre, u.apellido, u.role, u.estado, u.empresa_id, e.nombre AS empresa_nombre, u.fecha_alta
            FROM usuarios u
            INNER JOIN empresas e ON u.empresa_id = e.id
            WHERE u.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: 'No se pudo obtener el usuario.' });
    }
};
```

##### f) `updateUser` - Editar usuario
```javascript
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { usuario, password, role, nombre, apellido, estado } = req.body;

    if (!usuario) {
        return res.status(400).json({ error: 'Usuario es obligatorio.' });
    }

    if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Rol inválido.' });
    }

    try {
        let sql, params;
        
        if (password) {
            // Si se proporciona contraseña nueva
            const bcrypt = require('bcryptjs');
            const password_hash = await bcrypt.hash(password, 10);
            sql = `UPDATE usuarios SET usuario=?, password_hash=?, role=?, nombre=?, apellido=?, estado=? WHERE id=?`;
            params = [usuario.trim(), password_hash, role || 'user', nombre || '', apellido || '', estado !== undefined ? estado : 1, id];
        } else {
            // Sin cambio de contraseña
            sql = `UPDATE usuarios SET usuario=?, role=?, nombre=?, apellido=?, estado=? WHERE id=?`;
            params = [usuario.trim(), role || 'user', nombre || '', apellido || '', estado !== undefined ? estado : 1, id];
        }

        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json({ success: true, mensaje: 'Usuario actualizado.' });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario.' });
        }
        res.status(500).json({ error: 'No se pudo actualizar el usuario.' });
    }
};
```

##### g) `deleteUser` - Borrar usuario (soft delete)
```javascript
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query(
            `UPDATE usuarios SET estado = 0 WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json({ success: true, mensaje: 'Usuario desactivado.' });
    } catch (error) {
        console.error('Error desactivando usuario:', error);
        res.status(500).json({ error: 'No se pudo desactivar el usuario.' });
    }
};
```

---

## 📋 FASE 4: RUTAS

### 4.1 Actualizar adminRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, verificarAdmin } = require('../middlewares/adminMiddleware');

// EMPRESAS - CRUD completo
router.get('/companies', verificarToken, verificarAdmin, adminController.listCompanies);
router.post('/companies', verificarToken, verificarAdmin, adminController.createCompany);
router.get('/companies/:id', verificarToken, verificarAdmin, adminController.getCompany);
router.put('/companies/:id', verificarToken, verificarAdmin, adminController.updateCompany);
router.delete('/companies/:id', verificarToken, verificarAdmin, adminController.deleteCompany);

// USUARIOS - CRUD completo
router.get('/users', verificarToken, verificarAdmin, adminController.listUsers);
router.post('/users', verificarToken, verificarAdmin, adminController.createUser);
router.get('/users/:id', verificarToken, verificarAdmin, adminController.getUser);
router.put('/users/:id', verificarToken, verificarAdmin, adminController.updateUser);
router.delete('/users/:id', verificarToken, verificarAdmin, adminController.deleteUser);

// USUARIOS POR EMPRESA
router.get('/companies/:empresaId/users', verificarToken, verificarAdmin, adminController.getUsersByCompany);

module.exports = router;
```

### 4.2 Actualizar todas las rutas para incluir middleware de tenant

**Ejemplo para clientesRoutes.js:**
```javascript
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/', verificarToken, clientesController.obtenerClientes);
router.post('/', verificarToken, clientesController.crearCliente);
router.put('/:id', verificarToken, clientesController.editarCliente);
router.delete('/:id', verificarToken, clientesController.eliminarCliente);
router.get('/:id/cuenta-corriente', verificarToken, clientesController.obtenerCuentaCorriente);

module.exports = router;
```

**Lo mismo aplica a:** productosRoutes.js, proveedoresRoutes.js, ventasRoutes.js

---

## 📋 FASE 5: TESTING

### Casos de prueba

1. **Crear 3 empresas**
   - Empresa A
   - Empresa B
   - Empresa C

2. **Crear usuarios para cada empresa**
   - A: usuario_a1, usuario_a2
   - B: usuario_b1
   - C: usuario_c1, usuario_c2, usuario_c3

3. **Crear datos de negocio**
   - A: 10 productos, 5 clientes, 3 ventas
   - B: 8 productos, 2 clientes, 1 venta
   - C: 15 productos, 10 clientes, 5 ventas

4. **Validar aislamiento**
   - Login con usuario_a1 → debe ver solo datos de A
   - Login con usuario_b1 → debe ver solo datos de B
   - Intentar acceder a producto de C con token de A → debe fallar o retornar lista vacía
   - Editar cliente de A desde usuario de B → debe fallar (401 o validación)

5. **Probar CRUD de empresas y usuarios**
   - Crear empresa
   - Listar empresas
   - Obtener empresa por ID
   - Editar empresa
   - Desactivar empresa
   - Crear usuario
   - Listar usuarios
   - Obtener usuario por ID
   - Editar usuario
   - Desactivar usuario

---

## 📋 RESUMEN DE CAMBIOS

| Componente | Cambio | Nuevas funciones | Funciones a cambiar |
|---|---|---|---|
| **Base de Datos** | Agregar `empresa_id` a 6 tablas | - | - |
| **authMiddleware.js** | Exponer `req.empresaId` | - | `verificarToken()` |
| **tenantMiddleware.js** | CREAR archivo | `verificarTenant()` | - |
| **productosController.js** | Filtrar por empresa en todas las consultas | - | 7 funciones |
| **clientesController.js** | Filtrar por empresa | - | 5 funciones |
| **proveedoresController.js** | Filtrar por empresa | - | 4 funciones |
| **ventasController.js** | Filtrar por empresa + transacciones | - | 7 funciones |
| **adminController.js** | CRUD completo de empresas y usuarios | 7 nuevas | 2 ajustes menores |
| **adminRoutes.js** | Nuevas rutas para CRUD | 8 nuevas rutas | - |
| **Otras rutas** | Agregar middleware de tenant | - | - |

---

Este es el plan detallado. Una vez que lo implementes, todos los datos estarán aislados por empresa y tendrás un CRUD completo en Configuraciones. ¿Empezamos a implementarlo?