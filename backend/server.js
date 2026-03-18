const express = require("express");
const cors = require("cors");
// Importamos la conexión que ya configuramos en la Mejora 2
const db = require("./database/db"); 

const clientesRoutes = require("./routes/clientesRoutes");
const productosRoutes = require("./routes/productosRoutes");
const ventasRoutes = require("./routes/ventasRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Servir archivos estáticos (Para que se vea tu HTML y CSS)
app.use(express.static("frontend")); // Si tu HTML está en una carpeta 'frontend'
// Si tu index.html está en la raíz, usá: app.use(express.static("./"));

// 2. Usar las rutas modulares (Esto limpia tu server.js)
app.use("/clientes", clientesRoutes);
app.use("/productos", productosRoutes);
app.use("/ventas", ventasRoutes);


// Nota: Ya no necesitás los app.post("/clientes") acá, 
// porque ya deberían estar dentro de ./routes/clientesRoutes.js

// Esto le dice a Express que la carpeta raíz tiene tus archivos HTML, JS y CSS
app.use(express.static("./")); 

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});
