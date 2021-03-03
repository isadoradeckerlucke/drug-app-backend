/** Shared config for application; can be req'd many places. */

require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY || "test";

const PORT = +process.env.PORT || 5000;

// database is:
//
// - on Heroku, get from env var DATABASE_URL
// - in testing, 'drug-app-test'
// - else: 'drug-app'

let DB_URI;
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

if (process.env.NODE_ENV === "test") {
  DB_URI = "drug-app-test";
} else {
  DB_URI = process.env.DATABASE_URL || "drug-app";
}

module.exports = {
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
  PORT,
  DB_URI,
};
