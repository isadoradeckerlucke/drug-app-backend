const ExpressError = require("./expressError");

function sqlPartialUpdate(data, js) {
  const keys = Object.keys(data);
  if (keys.length === 0) throw new ExpressError("no data", 400);
  const cols = keys.map(
    (colName, idx) => `"${js[colName] || colName}"=$${idx + 1}`
  );
  return {
    setCols: cols.join(", "),
    values: Object.values(data),
  };
}
module.exports = { sqlPartialUpdate };
