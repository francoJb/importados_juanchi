const express = require("express");
const router = express.Router();
const db = require("../database/db.js");


// GUARDAR VENTA
router.post("/", (req,res)=>{
  const {cliente,total,carrito} = req.body;
  db.run(
    "INSERT INTO ventas(cliente,total) VALUES(?,?)",
    [cliente,total],
    function(err){
      if(err) return res.status(500).json(err);
      const ventaId = this.lastID;
      carrito.forEach(p => {
        db.run(
          `INSERT INTO detalle_venta
           (venta_id,producto,precio,cantidad)
           VALUES(?,?,?,?)`,
          [ventaId,p.producto,p.precio,p.cantidad]
        );
      });
      res.json({success:true});
    }
  );
});


// LISTAR VENTAS
router.get("/", (req,res)=>{
  db.all(
    "SELECT * FROM ventas ORDER BY fecha DESC",
    (err,ventas)=>{
      if(err) return res.status(500).json(err);
      res.json(ventas);
    }
  );
});


module.exports = router;