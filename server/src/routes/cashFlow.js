const express = require("express");
const CashFlowFetcher = require("../../../data_analyzer/cashFLowFetcher");

const router = express.Router();
const cashFlowFetcher = new CashFlowFetcher();

router.get("/", async (req, res) => {
  const { fromDate, toDate, transfers, includeUnrealizedGL } = req.query ?? {};

  if (!fromDate || !toDate) {
    return res.status(400).json({
      error: "Missing required query parameters 'fromDate' and 'toDate'",
    });
  }

  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({
      error: "Invalid 'fromDate' or 'toDate'; expected valid dates",
    });
  }

  const transferMode =
    transfers === "include" || transfers === "only" ? transfers : "exclude";

  try {
    const report = await cashFlowFetcher.buildCashFlowReport({
      fromDate: start,
      toDate: end,
      transfers: transferMode,
      includeUnrealizedGL: includeUnrealizedGL === "true",
    });
    res.json(report);
  } catch (error) {
    console.error("Failed to build cash flow report:", error);
    res.status(500).json({
      error: "Failed to build cash flow report",
    });
  }
});

module.exports = router;
