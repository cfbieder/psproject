const express = require("express");
const BalanceSheetFetcher = require("../services/reporting/balanceSheetFetcher");

const router = express.Router();
const balanceSheetFetcher = new BalanceSheetFetcher();

router.get("/", async (req, res) => {
  const asOfDateString = req.query?.asOfDate;
  if (!asOfDateString) {
    return res.status(400).json({
      error: "Missing required query parameter 'asOfDate'",
    });
  }

  const asOfDate = new Date(asOfDateString);
  if (Number.isNaN(asOfDate.getTime())) {
    return res.status(400).json({
      error: "Invalid 'asOfDate' query parameter; expected a valid date",
    });
  }

  console.log("As of date for balance report:", asOfDate);
  try {
    const report = await balanceSheetFetcher.buildBalanceSheetReport(
      asOfDate,
      false
    );
    res.json(report);
  } catch (error) {
    console.error("Failed to build balance sheet report:", error);
    res.status(500).json({
      error: "Failed to build balance sheet report",
    });
  }
});

module.exports = router;
