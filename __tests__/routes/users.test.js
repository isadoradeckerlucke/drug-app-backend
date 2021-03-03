const request = require("supertest");
const bcrypt = require("bcrypt");
const db = require("../../db");
const app = require("../../app");
const { BCRYPT_WORK_FACTOR } = require("../../config");

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

describe("get user /users/:username", function () {
  it("can successfully get info on a user", async function () {
    const res = await request(app).get("/users/testuser1");
    expect(res.body.user.email).toEqual("testuser1@gmail.com");
    expect(res.body.user.savedDrugs[0]).toEqual("adderall");
  });
  it("catches a fake user", async function () {
    const res = await request(app).get("/users/fakename");
    expect(res.clientError).toBe(true);
  });
});

describe("log in user", function () {
  it("can successfully log in a user", async function () {
    const res = await request(app).post("/users/login").send({
      username: "testuser1",
      password: "testuser1password",
    });
    expect(res.body.user.email).toEqual("testuser1@gmail.com");
    expect(res.body.user.username).toEqual("testuser1");
  });
  it("catches a fake user", async function () {
    const res = await request(app).post("/users/login").send({
      username: "fake",
      password: "fake",
    });
    expect(res.clientError).toBe(true);
  });
});

describe("sign up user", function () {
  it("can successfully sign up a user", async function () {
    const res = await request(app).post("/users/signup").send({
      username: "newtestuser",
      password: "testpasswordhi",
      email: "testemail@gmail.com",
    });
    expect(res.body.newUser.email).toEqual("testemail@gmail.com");
    expect(res.body.newUser.username).toEqual("newtestuser");
  });

  it("catches already existing username", async function () {
    const res = await request(app).post("/users/signup").send({
      username: "testuser1",
      password: "testpasswordhi",
      email: "testemail@gmail.com",
    });
    expect(res.body.invalid).toEqual("Username testuser1 already exists");
  });
});

describe("save drug to user", function () {
  it("can successfully save drug to user", async function () {
    const res = await request(app).post("/users/testuser1/drugs/xanax");
    expect(res.body.saved).toEqual("xanax");
  });

  it("catches fake med name", async function () {
    const res = await request(app).post("/users/testuser1/drugs/fakename");
    expect(res.body.noneFound).toEqual("no drug found");
  });

  it("catches fake username", async function () {
    const res = await request(app).post("/users/fakeuser/drugs/xanax");
    expect(res.body.status).toBe(404);
  });
});

describe("unsave drug to user", function () {
  it("can successfully unsave a drug", async function () {
    const res = await request(app).delete("/users/testuser1/drugs/adderall");
    expect(res.body.unsaved).toEqual("adderall");
  });

  it("catches fake med name", async function () {
    const res = await request(app).delete("/users/testuser1/drugs/fakedrug");
    expect(res.body.status).toBe(404);
  });

  it("catches fake username", async function () {
    const res = await request(app).delete("/users/fakeuser/drugs/adderall");
    expect(res.body.status).toBe(404);
  });
});
