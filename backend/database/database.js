require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Falta variable de entorno: ${key}`);
    process.exit(1);
  }
}

const caPath = process.env.DB_SSL_CA_PATH || path.join(__dirname, '../../isrgrootx1.pem');
const caCert = fs.readFileSync(caPath, 'utf8');

// Configuramos la conexión
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'importados',
    port:Number(process.env.DB_PORT) || 4000,
    ssl: {
        ca: caCert,
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Esta función crea las tablas automáticamente si no existen
const configurarTablas = async () => {
    try {
        console.log("⏳ Verificando tablas en MySQL...");
        // 1. TABLA DE PRODUCTOS (Tu estructura original)
        await db.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sku VARCHAR(50) UNIQUE,
                descripcion VARCHAR(255) NOT NULL,
                marca VARCHAR(100),
                modelo VARCHAR(100),
                categoria VARCHAR(100),
                proveedor VARCHAR(100),
                costo DECIMAL(12,2),
                precio_neto DECIMAL(12,2),
                iva DECIMAL(5,2),
                control_stock TINYINT(1) DEFAULT 1,
                stock INT DEFAULT 0,
                stock_minimo INT DEFAULT 0,
                estado TINYINT(1) DEFAULT 1
            )
        `);
        // 2. TABLA DE CLIENTES (Tu estructura original)
        await db.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                telefono VARCHAR(50),
                direccion VARCHAR(255),
                dni VARCHAR(20) UNIQUE NOT NULL,
                cuit VARCHAR(20) UNIQUE,
                arca ENUM('Consumidor Final', 'IVA Responsable Inscripto', 'Responsable Monotributo', 'Exento'),
                email VARCHAR(100),
                fecha_alta DATE DEFAULT (CURRENT_DATE),
                estado TINYINT(1) DEFAULT 1
            )
        `);
        // 3. TABLA DE VENTAS (Agregada)
        await db.query(`
            CREATE TABLE IF NOT EXISTS ventas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                total DECIMAL(12, 2) NOT NULL,
                metodo_pago ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'QR', 'Cuenta Corriente') NOT NULL,
                estado_pago ENUM('Pagado', 'Pendiente', 'Parcial') DEFAULT 'Pagado',
                saldo_pendiente DECIMAL(12, 2) DEFAULT 0.00,
                observaciones TEXT,
                CONSTRAINT fk_venta_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
            )
        `);
        // 4. TABLA DE DETALLE_VENTAS (Agregada)
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
        // 5. TABLA DE CUENTA_CORRIENTE (Agregada)
        await db.query(`
            CREATE TABLE IF NOT EXISTS cuenta_corriente (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                venta_id INT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                descripcion VARCHAR(255),
                observaciones TEXT NULL,
                debe DECIMAL(12, 2) DEFAULT 0.00,
                haber DECIMAL(12, 2) DEFAULT 0.00,
                saldo_acumulado DECIMAL(12, 2),
                CONSTRAINT fk_cc_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
                CONSTRAINT fk_cc_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
            )
        `);
        console.log("✅ MySQL está listo y con TODAS las tablas (Ventas y Cta Cte incluidas).");
    } catch (error) {
        console.error("❌ Error al conectar o crear tablas:", error.message);
    }
};

configurarTablas();

module.exports = db;