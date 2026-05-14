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
        // 2. TABLA DE CATEGORIAS
        await db.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                empresa_id INT NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                estado TINYINT(1) DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_categoria_empresa (empresa_id, nombre),
                FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
            );
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
                role ENUM('admin','user') DEFAULT 'user',
                estado TINYINT(1) DEFAULT 1,
                fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_usuario (usuario),
                CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
            )
        `);
        // 7. TABLA DE VENTAS
        await db.query(`
            CREATE TABLE IF NOT EXISTS ventas (
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
        `);
        // 8. TABLA DE DETALLE_VENTAS
        await db.query(`
            CREATE TABLE IF NOT EXISTS detalle_ventas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                venta_id INT NOT NULL,
                producto_id INT NOT NULL,
                cantidad INT NOT NULL,
                precio_unitario DECIMAL(12, 2) NOT NULL,
                CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
                CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
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
                saldo_acumulado DECIMAL(12, 2),
                FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id),
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
            );
        `);
        console.log("✅ MySQL está listo y con TODAS las tablas (Ventas y Cta Cte incluidas).");
    } catch (error) {
        console.error("❌ Error al conectar o crear tablas:", error.message);
    }
};

configurarTablas();

module.exports = db;