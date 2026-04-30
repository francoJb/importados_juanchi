// backend/server.js
const cors = require('cors');
const express = require('express');
const app = express();

const allowedOrigins = [
  'https://elda-gestion.pages.dev',          // producción
  'https://elda-gestion-staging.pages.dev'             // staging (reemplazar)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (curl, health checks, uptime checks)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const productosRoutes = require('./routes/productosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const ventasRoutes = require('./routes/ventasRoutes');

app.use(express.json());
app.use('/api/ventas', ventasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});