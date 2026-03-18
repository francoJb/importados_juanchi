const db = require("../database/db");

exports.obtenerCategorias = (req, res) => {
    db.all("SELECT * FROM categorias", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
};

exports.crearCategoria = (req, res) => {
    const { nombre } = req.body;
    db.run("INSERT INTO categorias (nombre) VALUES (?)", [nombre], function(err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID });
    });
};
