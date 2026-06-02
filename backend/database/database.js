const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// ==========================================
// CARGA DE VARIABLES DE ENTORNO
// ==========================================
// Cargar el archivo .env correcto según el entorno
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.local';
const envPath = path.resolve(__dirname, '../../', envFile);
dotenv.config({ path: envPath });

// Fallback a .env si el archivo específico no existe
if (!fs.existsSync(envPath)) {
  dotenv.config();
}

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Falta variable de entorno: ${key}`);
    process.exit(1);
  }
}

const caPath = process.env.DB_SSL_CA_PATH || path.join(__dirname, '../../isrgrootx1.pem');
let caCert = null;
if (fs.existsSync(caPath)) {
    caCert = fs.readFileSync(caPath, 'utf8');
}

// Configuramos la conexión
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'importados',
    port: Number(process.env.DB_PORT) || 4000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Usar SSL si el certificado existe o si la variable de entorno lo habilita
const sslEnabled = caCert || process.env.DB_SSL_MODE === 'require';
if (sslEnabled) {
    dbConfig.ssl = {
        ca: caCert || undefined,
        minVersion: 'TLSv1.2',
        rejectUnauthorized: !!caCert
    };
}

const db = mysql.createPool(dbConfig);

async function columnExists(table, column) {
    const [rows] = await db.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
    return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
    if (await columnExists(table, column)) {
        return;
    }
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function renameColumnIfNeeded(table, oldColumn, newColumn, definition) {
    const hasOld = await columnExists(table, oldColumn);
    const hasNew = await columnExists(table, newColumn);

    if (hasOld && !hasNew) {
        await db.query(`ALTER TABLE ${table} CHANGE ${oldColumn} ${newColumn} ${definition}`);
    }
}

async function obtenerEmpresaOperativaDefault() {
    const [jrimportRows] = await db.query("SELECT id FROM empresas WHERE nombre = 'Jrimport' LIMIT 1");
    if (jrimportRows.length > 0) {
        return jrimportRows[0].id;
    }

    const [tenantRows] = await db.query(`
        SELECT e.id
        FROM empresas e
        LEFT JOIN usuarios u ON u.empresa_id = e.id
        WHERE e.estado = 1 AND e.nombre <> 'eldaGestion' AND (u.role IS NULL OR u.role <> 'platform_admin')
        ORDER BY e.id
        LIMIT 1
    `);
    if (tenantRows.length > 0) {
        return tenantRows[0].id;
    }

    const [companyRows] = await db.query('SELECT id FROM empresas WHERE estado = 1 ORDER BY id LIMIT 1');
    if (companyRows.length > 0) {
        return companyRows[0].id;
    }

    throw new Error('No hay empresas activas para migrar datos operativos.');
}

async function asegurarColumnasMultiempresa() {
    const empresaOperativaId = await obtenerEmpresaOperativaDefault();

    await addColumnIfMissing('clientes', 'empresa_id', 'INT NULL');
    await db.query('UPDATE clientes SET empresa_id = ? WHERE empresa_id IS NULL', [empresaOperativaId]);

    await addColumnIfMissing('categorias', 'empresa_id', 'INT NULL');
    await db.query('UPDATE categorias SET empresa_id = ? WHERE empresa_id IS NULL', [empresaOperativaId]);

    await renameColumnIfNeeded('proveedores', 'categoria_arca', 'arca_categoria', 'VARCHAR(100)');
    await renameColumnIfNeeded('proveedores', 'cuenta_bancaria', 'banco_cuenta', 'VARCHAR(150)');
    await addColumnIfMissing('proveedores', 'empresa_id', 'INT NULL');
    await db.query('UPDATE proveedores SET empresa_id = ? WHERE empresa_id IS NULL', [empresaOperativaId]);

    await addColumnIfMissing('productos', 'empresa_id', 'INT NULL');
    await addColumnIfMissing('productos', 'categoria_id', 'INT NULL');
    await addColumnIfMissing('productos', 'proveedor_id', 'INT NULL');
    await db.query('UPDATE productos SET empresa_id = ? WHERE empresa_id IS NULL', [empresaOperativaId]);

    await addColumnIfMissing('ventas', 'empresa_id', 'INT NULL');
    await addColumnIfMissing('ventas', 'estado', 'TINYINT(1) DEFAULT 1');
    await db.query('UPDATE ventas SET empresa_id = ? WHERE empresa_id IS NULL', [empresaOperativaId]);
    await db.query('UPDATE ventas SET estado = 1 WHERE estado IS NULL');

    await addColumnIfMissing('detalle_ventas', 'empresa_id', 'INT NULL');
    await db.query(`
        UPDATE detalle_ventas d
        INNER JOIN ventas v ON v.id = d.venta_id
        SET d.empresa_id = v.empresa_id
        WHERE d.empresa_id IS NULL
    `);
    await db.query('UPDATE detalle_ventas SET empresa_id = ? WHERE empresa_id IS NULL', [empresaOperativaId]);

    await addColumnIfMissing('cuenta_corriente', 'empresa_id', 'INT NULL');
    await db.query(`
        UPDATE cuenta_corriente cc
        INNER JOIN clientes c ON c.id = cc.cliente_id
        SET cc.empresa_id = c.empresa_id
        WHERE cc.empresa_id IS NULL
    `);
    await db.query('UPDATE cuenta_corriente SET empresa_id = ? WHERE empresa_id IS NULL', [empresaOperativaId]);
}

async function asegurarEsquemaCuotas() {
    await db.query(`
        ALTER TABLE ventas
        MODIFY metodo_pago ENUM('Efectivo','Transferencia','Tarjeta','QR','Cuenta Corriente','Cuotas') NOT NULL
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS venta_cuotas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            empresa_id INT NOT NULL,
            venta_id INT NOT NULL,
            cliente_id INT NOT NULL,
            numero_cuota INT NOT NULL,
            fecha_vencimiento DATE NOT NULL,
            monto DECIMAL(12,2) NOT NULL,
            saldo_pendiente DECIMAL(12,2) NOT NULL,
            estado ENUM('Pendiente','Pagada','Parcial') DEFAULT 'Pendiente',
            recibo_id INT NULL,
            fecha_pago DATETIME NULL,
            observaciones TEXT,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_cuota_venta (empresa_id, venta_id, numero_cuota)
        )
    `);
}

// Esta función crea las tablas automáticamente si no existen
const configurarTablas = async () => {
    try {
        console.log("⏳ Verificando tablas en MySQL...");
        
        // 1. TABLA DE EMPRESAS
        await db.query(`
            CREATE TABLE IF NOT EXISTS empresas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) UNIQUE NOT NULL,
                razon_social VARCHAR(255),
                cuit VARCHAR(50) UNIQUE,
                domicilio VARCHAR(255),
                email VARCHAR(100),
                telefono VARCHAR(50),
                website VARCHAR(150),
                condicion_iva VARCHAR(100),
                estado TINYINT(1) DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // 3. TABLA DE PROVEEDORES
        await db.query(`
            CREATE TABLE IF NOT EXISTS proveedores (
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
        `);

        // 4. TABLA DE PRODUCTOS
        await db.query(`
            CREATE TABLE IF NOT EXISTS productos (
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
        `);

        // 5. TABLA DE CLIENTES
        await db.query(`
            CREATE TABLE IF NOT EXISTS clientes (
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
        `);
        
        // 6. TABLA DE USUARIOS
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                empresa_id INT NOT NULL,
                nombre VARCHAR(100),
                apellido VARCHAR(100),
                usuario VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('platform_admin','tenant_admin','user') DEFAULT 'user',
                estado TINYINT(1) DEFAULT 1,
                fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_usuario (usuario),
                CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            ALTER TABLE usuarios
            MODIFY role ENUM('admin','platform_admin','tenant_admin','user') DEFAULT 'user'
        `);

        await db.query(`
            UPDATE usuarios
            SET role = 'platform_admin'
            WHERE role = 'admin'
        `);

        await db.query(`
            ALTER TABLE usuarios
            MODIFY role ENUM('platform_admin','tenant_admin','user') DEFAULT 'user'
        `);

        // 7. TABLA DE VENTAS
        await db.query(`
            CREATE TABLE IF NOT EXISTS ventas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            empresa_id INT NOT NULL,
            cliente_id INT NULL,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            total DECIMAL(12, 2) NOT NULL,
            metodo_pago ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'QR', 'Cuenta Corriente', 'Cuotas') NOT NULL,
            estado_pago ENUM('Pagado', 'Pendiente', 'Parcial') DEFAULT 'Pagado',
            saldo_pendiente DECIMAL(12, 2) DEFAULT 0.00,
            observaciones TEXT,
            estado TINYINT(1) DEFAULT 1,
            FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        );
        `);
        // 8. TABLA DE DETALLE_VENTAS
        await db.query(`
            CREATE TABLE IF NOT EXISTS detalle_ventas (
                empresa_id INT NOT NULL,
                id INT AUTO_INCREMENT PRIMARY KEY,
                venta_id INT NOT NULL,
                producto_id INT NOT NULL,
                cantidad INT NOT NULL,
                precio_unitario DECIMAL(12, 2) NOT NULL,
                CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
                CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
                FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE           
            )
        `);
        // 9. TABLA DE CUENTA_CORRIENTE
        await db.query(`
            CREATE TABLE IF NOT EXISTS cuenta_corriente  (
                id INT AUTO_INCREMENT PRIMARY KEY,
                empresa_id INT NOT NULL,
                cliente_id INT NOT NULL,
                venta_id INT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                descripcion VARCHAR(255),
                observaciones TEXT NULL,
                debe DECIMAL(12, 2) DEFAULT 0.00,
                haber DECIMAL(12, 2) DEFAULT 0.00,
                estado TINYINT DEFAULT 1,
                saldo_acumulado DECIMAL(12, 2),
                FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id),
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
            );
        `);
        await addColumnIfMissing('cuenta_corriente', 'estado', 'TINYINT DEFAULT 1');
        await asegurarColumnasMultiempresa();
        await asegurarEsquemaCuotas();
        console.log("✅ MySQL está listo y con TODAS las tablas (Ventas y Cta Cte incluidas).");
    } catch (error) {
        console.error("❌ Error al conectar o crear tablas:", error.message);
    }
};

const dbReady = configurarTablas();
db.ready = dbReady;

module.exports = db;
