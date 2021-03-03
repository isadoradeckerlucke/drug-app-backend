const express = require("express");
const User = require("../models/user");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const loginSchema = require("../schemas/login.json");
const signupSchema = require("../schemas/signup.json");
const updateSchema = require("../schemas/update.json");
const Drug = require("../models/drug");
const router = express.Router({ mergeParams: true });

router.get("/:username", async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async function (req, res, next) {
  /** login route */
  try {
    const validator = jsonschema.validate(req.body, loginSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new ExpressError("invalid data", 400);
    }

    const { username, password } = req.body;
    const user = await User.login(username, password);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

router.post("/signup", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, signupSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new ExpressError("invalid data", 400);
    }

    const newUser = await User.signup({ ...req.body });
    if (newUser.username) {
      return res.status(201).json({ newUser });
    } else {
      return res.json(newUser);
    }
  } catch (err) {
    return next(err);
  }
});

router.patch("/:username", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, updateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new ExpressError("invalid data", 400);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:username", async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

router.post("/:username/drugs/:med_name", async function (req, res, next) {
  try {
    const med_name = req.params.med_name;
    const rxcui = await Drug.convertToRXCUI(med_name);
    // make sure we get an rxcui, if not return the noneFound message and don't pass it on to the saveDrug user fxn
    if (typeof rxcui === "string") {
      await User.saveDrug(req.params.username, med_name);
      return res.json({ saved: med_name });
    } else {
      return res.json(rxcui);
    }
  } catch (err) {
    return next(err);
  }
});

router.delete("/:username/drugs/:med_name", async function (req, res, next) {
  try {
    await User.unsaveDrug(req.params.username, req.params.med_name);
    return res.json({ unsaved: req.params.med_name });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
