const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error conectando a la base de datos", err);
  } else {
    console.log("Conectado a SQLite");
  }
});
module.exports = db;


