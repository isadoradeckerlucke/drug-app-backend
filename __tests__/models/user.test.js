const request = require("supertest");
const bcrypt = require("bcrypt");

const db = require("../../db.js");
const { BCRYPT_WORK_FACTOR } = require("../../config");
const app = require("../../app");
const User = require("../../models/user");
const ExpressError = require("../../helpers/expressError.js");

beforeAll(async function () {
  await db.query("DELETE FROM users cascade");
  await db.query("DELETE FROM drugs cascade");
  await db.query("DELETE FROM users_drugs_relation cascade");

  await db.query(
    `
  INSERT INTO users (username, password, email) 
  VALUES 
    ('testuser1', $1, 'testuser1@gmail.com'), 
    ('testuser2', $2, 'testuser2@gmail.com')`,
    [
      await bcrypt.hash("testuser1password", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("testuser2password", BCRYPT_WORK_FACTOR),
    ]
  );

  await db.query(`
  INSERT INTO drugs (med_name, rxcui) VALUES ('adderall', 84815), ('xanax', 202363)`);

  await db.query(`
    INSERT INTO users_drugs_relation (med_name, username) VALUES ('adderall', 'testuser1'), ('xanax', 'testuser2')
  `);
});

beforeEach(async function () {
  await db.query("BEGIN");
});

afterEach(async function () {
  await db.query("ROLLBACK");
});

afterAll(async function () {
  await db.end();
});

describe("sign up user", function () {
  it("can successfully sign up a user", async function () {
    let res = await User.signup({
      username: "testusername",
      password: "testpassword",
      email: "testemail@test.com",
    });
    expect(res.username).toEqual("testusername");
  });

  it("returns expected output when invalid input is given", async function () {
    let res = await User.signup({
      username: "testuser1",
      password: "testpassword",
      email: "testemail@test.com",
    });
    expect(res.invalid).toEqual("Username testuser1 already exists");
  });
});

describe("log in existing user", function () {
  it("can successfully log in existing user", async function () {
    let res = await User.login("testuser1", "testuser1password");
    expect(res.username).toEqual("testuser1");
    expect(res.email).toEqual("testuser1@gmail.com");
  });

  it("catches incorrect credentials", async function () {
    let res = await User.login("testuser2", "wrongpassword");
    expect(res.invalid).toEqual("invalid username / password");
  });
});

describe("save drug to user", function () {
  it("can successfully save drug to existing user", async function () {
    await User.saveDrug("testuser1", "xanax");
    let res = await db.query(
      `SELECT username FROM users_drugs_relation WHERE med_name = $1`,
      ["xanax"]
    );
    expect(res.rowCount).toEqual(2);
  });

  it("catches fake username", async function () {
    try {
      await User.saveDrug("fakename", "xanax");
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
    }
  });
});

describe("unsave drug from user", function () {
  it("can successfully remove saved drug from existing user", async function () {
    await User.unsaveDrug("testuser2", "xanax");
    let res = await db.query(
      `SELECT username FROM users_drugs_relation WHERE med_name = $1`,
      ["xanax"]
    );
    expect(res.rowCount).toEqual(0);
  });

  it("catches med name not saved", async function () {
    try {
      await User.unsaveDrug("testuser1", "fakedrug");
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
    }
  });
});

describe("get info on user", function () {
  it("can successfully get info on existing user", async function () {
    let res = await User.get("testuser2");
    expect(res.username).toBe("testuser2");
    expect(res.email).toBe("testuser2@gmail.com");
    expect(res.savedDrugs[0]).toBe("xanax");
  });

  it("catches fake user", async function () {
    try {
      await User.get("fakeuser");
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
    }
  });
});
