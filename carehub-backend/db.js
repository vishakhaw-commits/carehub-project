const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456789",   // your MySQL password if you set one
  database: "carehub_vishakha" ,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;