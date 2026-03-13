const express = require("express");
const router = express.Router();
const {
  obtenerProductos,
  crearProducto,
  eliminarProducto,
  actualizarProducto
} = require("../controllers/productosController");
router.get("/", obtenerProductos);
router.post("/", crearProducto);
router.delete("/:id", eliminarProducto);
router.put("/:id", actualizarProducto);
module.exports = router;
