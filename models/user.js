const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../helpers/expressError");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const { sqlPartialUpdate } = require("../helpers/sqlPartialUpdate");

class User {
  static async login(username, password) {
    /** authenticate user with username and password. if user isn't found or pwd is wrong throw unauthenticated error */
    const result = await db.query(
      `SELECT username, email, password FROM users WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      } else {
        return { invalid: "invalid username / password" };
      }
    }
  }

  static async signup({ username, password, email }) {
    /** register a new user */
    const checkForDuplicate = await db.query(
      `SELECT username FROM users WHERE username = $1`,
      [username]
    );

    if (checkForDuplicate.rows[0]) {
      return { invalid: `Username ${username} already exists` };
    }

    const hashedPwd = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING username, email`,
      [username, hashedPwd, email]
    );

    const user = result.rows[0];

    return user;
  }

  static async update(username, data) {
    /**partially update a user */
    try {
      if (data.password) {
        data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
      }

      const { setCols, values } = sqlPartialUpdate(data, {
        username: "username",
        email: "email",
      });
      const usernameVarIdx = "$" + (values.length + 1);

      const querySql = `UPDATE users SET ${setCols} WHERE username = ${usernameVarIdx} RETURNING username, email`;
      const result = await db.query(querySql, [...values, username]);
      const user = result.rows[0];
      if (!user)
        throw new ExpressError(
          `there is no user with username ${username}`,
          404
        );
      delete user.password;
      return user;
    } catch (err) {
      console.log(err);
    }
  }

  static async remove(username) {
    /**delete a user */
    try {
      let result = await db.query(
        `DELETE FROM users WHERE username = $1 RETURNING username`,
        [username]
      );
      const user = result.rows[0];
      if (!user)
        throw new ExpressError(
          `there is no user with username ${username}`,
          404
        );
    } catch (err) {
      console.log(err);
    }
  }

  static async get(username) {
    try {
      const userRes = await db.query(
        `SELECT username, email FROM users WHERE username = $1`,
        [username]
      );
      const user = userRes.rows[0];

      if (!user)
        throw new ExpressError(
          `there is no user with username ${username}`,
          404
        );

      const userSavedDrugs = await db.query(
        `SELECT ud.med_name FROM users_drugs_relation AS ud WHERE ud.username = $1`,
        [username]
      );

      user.savedDrugs = userSavedDrugs.rows.map((ud) => ud.med_name);
      return user;
    } catch (err) {
      console.log(err);
    }
  }

  static async saveDrug(username, med_name) {
    try {
      const preCheckUsers = await db.query(
        `SELECT username FROM users WHERE username = $1`,
        [username]
      );
      const user = preCheckUsers.rows[0];
      if (!user)
        throw new ExpressError(
          `there is no user with username ${username} in the database`,
          404
        );

      await db.query(
        `INSERT INTO users_drugs_relation (med_name, username) VALUES ($1, $2)`,
        [med_name, username]
      );
    } catch (err) {
      console.log(err);
    }
  }

  static async unsaveDrug(username, med_name) {
    /** unsave a drug */
    try {
      let result = await db.query(
        `DELETE FROM users_drugs_relation WHERE med_name = $1 AND username = $2 RETURNING med_name`,
        [med_name, username]
      );
      const medName = result.rows[0];
      if (!medName)
        throw new ExpressError(
          `there is no drug ${medName} saved for ${username}`,
          404
        );
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = User;
