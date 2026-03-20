// backend/server.js
const express = require('express');
const cors = require('cors'); // Necesario para que el frontend pueda hablar con el backend
const app = express();
const productosRoutes = require('./routes/productosRoutes');

app.use(cors()); // Permite peticiones desde el frontend (React)
app.use(express.json());// Permite leer datos en formato JSON en el cuerpo de la petición

// RUTAS
app.use('/api/productos', productosRoutes);


// --- RUTA DE LOGIN PARA SOPHIA (ESTILO COSMOS) ---
app.post('/api/login', (req, res) => {
  // 1. Recibimos los datos del frontend
  const { empresa, usuario, password } = req.body;

  console.log(`📡 Intento de login en Sophia: Empresa: ${empresa}, Usuario: ${usuario}`);

  // 2. [AQUÍ IRÍA LA LÓGICA REAL DE BASE DE DATOS]
  // Por ahora, simulamos un login exitoso para probar la interfaz.
  
  // Una validación súper básica de ejemplo (borrar luego)
  if (empresa && usuario === 'admin' && password === 'sophia123') {
    return res.status(200).json({
      success: true,
      message: '¡Bienvenido al Cosmos de Sophia!',
      token: 'un-token-jwt-simulado-para-el-futuro', // Aquí devolverías un JWT real
      user: {
        id: 1,
        nombre: 'Administrador Global',
        empresa: empresa
      }
    });
  } else {
    // Si las credenciales simuladas fallan
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas en el sistema Sophia.'
    });
  }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});