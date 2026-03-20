// backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();
const productosRoutes = require('./routes/productosRoutes');

app.use(cors());
app.use(express.json());

// RUTAS
app.use('/api/productos', productosRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});