// backend/server.js
const express = require('express');
const cors = require('cors'); // Necesario para que el frontend pueda hablar con el backend
const app = express();
const productosRoutes = require('./routes/productosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
app.use(cors()); // Permite peticiones desde el frontend (React)
app.use(express.json());// Permite leer datos en formato JSON en el cuerpo de la petición
app.use('/api/ventas', ventasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);


// Iniciar servidor
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});