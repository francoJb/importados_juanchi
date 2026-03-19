const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientesController"); 
const {
  obtenerClientes,
  crearCliente
} = require("../controllers/clientesController");
router.get("/", obtenerClientes);
router.post("/", crearCliente);
router.put("/:id/cobrar", clientesController.registrarCobro);
module.exports = router;
