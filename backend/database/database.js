const mysql = require('mysql2/promise');

// Configuramos la conexión
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '200324115', // ¡No te olvides de poner tu clave!
    database: 'sophia',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Esta función crea las tablas automáticamente si no existen
const configurarTablas = async () => {
    try {
        console.log("⏳ Verificando tablas en MySQL...");
        
        // Tabla de Productos
        await db.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sku VARCHAR(50),
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

        // Tabla de Clientes
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

        console.log("✅ MySQL está listo y con las tablas creadas.");
    } catch (error) {
        console.error("❌ Error al conectar o crear tablas:", error.message);
    }
};

configurarTablas();

module.exports = db;