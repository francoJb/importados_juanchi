// backend/server.js
const express = require('express');
const cors = require('cors'); // Necesario para que el frontend pueda hablar con el backend
const app = express();
const productosRoutes = require('./routes/productosRoutes');

app.use(cors()); // Permite peticiones desde el frontend (React)
app.use(express.json());// Permite leer datos en formato JSON en el cuerpo de la petición

// RUTAS
app.use('/api/productos', productosRoutes);


// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});