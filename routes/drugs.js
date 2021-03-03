const express = require("express");
const Drug = require("../models/drug");
const router = express.Router({ mergeParams: true });

router.get("/search/single/:name", async function (req, res, next) {
  /** get all high-severity interactions with one drug */
  try {
    const rxcui = await Drug.convertToRXCUI(req.params.name);
    if (rxcui.noneFound) {
      return res.json({
        interactions: {
          noneFound: `There is no drug in our system with the name ${req.params.name}.`,
        },
      });
    }
    const interactions = await Drug.findAllInteractions(rxcui);
    if (interactions.noneFound) {
      return res.json({
        interactions: {
          noneFound: `There were no high severity interactions with ${req.params.name} found in our system.`,
        },
      });
    }
    return res.json({ interactions });
  } catch (err) {
    return next(err);
  }
});

router.get("/search/multiple/:names", async function (req, res, next) {
  /** get interactions between multiple drugs specifically */
  try {
    const nameArray = req.params.names.split("+");
    const rxcuiArray = [];
    let nameStr = "";
    let rxcuiErrors = "";
    for (let name of nameArray) {
      nameStr += `${name} & `;
      let rxcui = await Drug.convertToRXCUI(name);
      if (rxcui.noneFound) {
        rxcuiErrors += `${name}, `;
      }
      rxcuiArray.push(rxcui);
    }

    if (rxcuiErrors !== "") {
      return res.json({
        interactions: {
          noneFound: `There are no drugs named ${rxcuiErrors.slice(
            0,
            -2
          )} in our system.`,
        },
      });
    }
    const interactions = await Drug.findInteractionsBetweenMultiple(rxcuiArray);
    if (interactions.noneFound) {
      return res.json({
        interactions: {
          noneFound: `There were no interactions found between ${nameStr.slice(
            0,
            -3
          )} in our system.`,
        },
      });
    }
    return res.json({ interactions });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
