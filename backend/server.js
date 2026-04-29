// backend/server.js
const cors = require('cors'); // Necesario para que el frontend pueda hablar con el backend
const express = require('express');
const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (health checks, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


const productosRoutes = require('./routes/productosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
app.use(express.json());// Permite leer datos en formato JSON en el cuerpo de la petición
app.use('/api/ventas', ventasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);



const allowedOrigins = [
  'https://elda-gestion.pages.dev'
];



app.options('*', cors());


// Iniciar servidor
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});