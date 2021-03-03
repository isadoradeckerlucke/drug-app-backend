const request = require("supertest");
const db = require("../../db");
const app = require("../../app");
const Drug = require("../../models/drug");

describe("convert to rxcui", function () {
  it("can successfully convert drug name to rxcui", async function () {
    let res = await Drug.convertToRXCUI("adderall");
    expect(res).toEqual("84815");
  });

  it("returns expected output when given drug name is not in system", async function () {
    let res = await Drug.convertToRXCUI("hello");
    expect(res.noneFound).toEqual("no drug found");
  });
});

describe("find all interactions single drug", function () {
  it("can successfully return high severity interactions with a single drug", async function () {
    let res = await Drug.findAllInteractions("84815");
    expect(res["00"].severity).toEqual("high");
  });

  it("returns expected output when there are no high severity interactions with a single drug", async function () {
    let res = await Drug.findAllInteractions("5640");
    expect(res.noneFound).toEqual("no interactions found");
  });
});

describe("find all interactions multiple drugs", function () {
  it("can successfully return all interactions between multiple drugs", async function () {
    let res = await Drug.findInteractionsBetweenMultiple(["5640", "448"]);
    expect(res["00"].description).not.toBeNull();
  });

  it("returns expected output when there are no interactions between multiple drugs", async function () {
    let res = await Drug.findInteractionsBetweenMultiple(["5640", "11295"]);
    expect(res.noneFound).toEqual("no interactions found");
  });
});
