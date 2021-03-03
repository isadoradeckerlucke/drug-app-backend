const request = require("supertest");
const db = require("../../db");
const app = require("../../app");

describe("getAllInteractions /search/single/:name", function () {
  it("can successfully search one real drug with high-severity interactions", async function () {
    const res = await request(app).get("/interactions/search/single/adderall");
    expect(res.body.interactions["00"].severity).toEqual("high");
  });

  it("can successfully search one real drug with no high-severity interactions", async function () {
    const res = await request(app).get("/interactions/search/single/ibuprofen");
    expect(res.body.interactions.noneFound).toEqual(
      "There were no high severity interactions with ibuprofen found in our system."
    );
  });

  it("can return the correct message when a user searches a non-existent drug", async function () {
    const res = await request(app).get("/interactions/search/single/hello");
    expect(res.body.interactions.noneFound).toEqual(
      "There is no drug in our system with the name hello."
    );
  });
});

describe("getAllInteractions /search/multiple/:names", function () {
  it("can successfully search multiple real drugs with interactions", async function () {
    const res = await request(app).get(
      "/interactions/search/multiple/adderall+xanax+alcohol"
    );
    expect(res.body.interactions["00"].description).not.toBeNull();
  });

  it("can successfully search multiple real drugs with no interactions", async function () {
    const res = await request(app).get(
      "/interactions/search/multiple/water+ibuprofen"
    );
    expect(res.body.interactions.noneFound).toEqual(
      "There were no interactions found between water & ibuprofen in our system."
    );
  });

  it("can successfully catch drug names that are not in the system", async function () {
    const res = await request(app).get(
      "/interactions/search/multiple/hello+ibuprofen"
    );
    expect(res.body.interactions.noneFound).toEqual(
      "There are no drugs named hello in our system."
    );
  });
});
