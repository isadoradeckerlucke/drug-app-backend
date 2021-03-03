/** Express app for jobly. */

const express = require("express");

const ExpressError = require("./helpers/expressError");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const path = require("path");
var bodyParser = require("body-parser");
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

// app.use(express.static(path.join(__dirname, "frontend/build")));

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

const drugRoutes = require("./routes/drugs");
const userRoutes = require("./routes/users");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "DELETE, POST, GET, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/interactions", drugRoutes);
app.use("/users", userRoutes);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "frontend/build")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
//   });
// }

// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "frontend", "public", "index.html"));
// });
app.use(express.static("public"));
/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  console.error(err.stack);

  return res.json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
