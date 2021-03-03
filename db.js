/** Database setup for drug interaction application. */

const { Client } = require("pg");
const { DB_URI } = require("./config");

const db = new Client({
  connectionString: DB_URI,
  ssl: process.env.DATABASE_URL ? true : false,
});

db.connect();

module.exports = db;
