const db = require("../db");
const ExpressError = require("../helpers/expressError");
const axios = require("axios");
const BASE_URL = `https://rxnav.nlm.nih.gov/REST/`;

class Drug {
  // drug class with methods for finding drug interactions

  static async convertToRXCUI(drugName) {
    //   try to get from database, if it's not in there get from api and add to database
    // try {
    let res = await axios.get(
      `${BASE_URL}rxcui.json?name=${drugName}&allsrc=1&search=2`
    );
    if (!res.data.idGroup.rxnormId) {
      return { noneFound: "no drug found" };
    }
    let rxcui = res.data.idGroup.rxnormId[0];

    // insert drug into database if it wasn't there yet
    let officialName = res.data.idGroup.name;
    const checkDrugInDB = await db.query(
      `SELECT rxcui FROM drugs WHERE med_name = $1`,
      [drugName]
    );
    if (checkDrugInDB.rowCount === 0) {
      await db.query(`INSERT INTO drugs (med_name, rxcui) VALUES ($1, $2)`, [
        drugName,
        rxcui,
      ]);
    }

    return rxcui;
    // } catch (err) {
    //   console.log(
    //     "the following error occurred while attempting to convert name to rxcui code",
    //     err
    //   );
    // }
  }

  static createInteractionObj(interactions) {
    let interactionsObj = {};
    for (let i = 0; i < interactions.length; i++) {
      let interactionPairs = interactions[i].interactionPair;
      let comment = interactions[i].comment;
      for (let j = 0; j < interactionPairs.length; j++) {
        let interaction = interactionPairs[j];
        interactionsObj[`${i}${j}`] = {
          description: `${interaction.description}`,
          name1: `${interaction.interactionConcept[0].minConceptItem.name}`,
          name2: `${interaction.interactionConcept[1].minConceptItem.name}`,
          severity: `${interaction.severity}`,
          comment: `${comment}`,
        };
      }
    }
    return interactionsObj;
  }

  static async findAllInteractions(rxcui) {
    // try {
    let url = `${BASE_URL}interaction/interaction.json?rxcui=${rxcui}&sources=ONCHigh`;

    let res = await axios.get(url);
    if (!res.data.interactionTypeGroup) {
      return { noneFound: "no interactions found" };
    }
    let interactions = res.data.interactionTypeGroup[0].interactionType;

    let interactionsObj = this.createInteractionObj(interactions);

    return interactionsObj;
    // } catch (err) {
    //   console.log(
    //     "the following error occurred while attempting to find all interactions with one rxcui code",
    //     err
    //   );
    // }
  }

  static async findInteractionsBetweenMultiple(rxcuiArray) {
    let url = `${BASE_URL}interaction/list.json?rxcuis=`;
    for (let rxcui of rxcuiArray) {
      url += `${rxcui}+`;
    }

    let finalURL = url.slice(0, -1);

    // try {
    let res = await axios.get(finalURL);

    if (!res.data.fullInteractionTypeGroup) {
      return { noneFound: "no interactions found" };
    }

    let interactions = res.data.fullInteractionTypeGroup[0].fullInteractionType;

    let interactionsObj = this.createInteractionObj(interactions);

    return interactionsObj;
    // } catch (err) {
    //   console.log(
    //     "the following error occurred while attempting to find interactions between multiple medications",
    //     err
    //   );
    // }
  }
}

module.exports = Drug;
