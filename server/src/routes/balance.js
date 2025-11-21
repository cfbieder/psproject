const express = require("express");
const path = require("path");

const router = express.Router();

const reportPath = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "components",
  "reports",
  "balance_sheet_report.json"
);

let cachedReport;

function loadBalanceReport() {
  if (cachedReport) {
    return cachedReport;
  }

  try {
    cachedReport = require(reportPath);
  } catch (err) {
    console.error("[fin-server] failed to load balance report:", err);
    cachedReport = null;
  }

  return cachedReport;
}

router.get("/", (req, res) => {
  const report = loadBalanceReport();
  if (!report) {
    return res.status(503).json({
      error: "Balance report unavailable",
      status: 503,
    });
  }

  res.json(report);
});

module.exports = router;
