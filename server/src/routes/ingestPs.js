const express = require("express");
const fs = require("node:fs/promises");
const path = require("path");
const DataGateway = require("../../../components/helpers/DataGateway");
const PsCsvIngestor = require("../services/psCsvIngestor");
const DataAnalyzerUtils = require("../services/dataAnalyzerUtils");
const BalanceSheetFetcher = require("../services/reporting/balanceSheetFetcher");
const PSdata = require("../../../components/models/PSdata");

const router = express.Router();
const gateway = new DataGateway();
const psCsvIngestor = new PsCsvIngestor({ gateway });
const balanceSheetFetcher = new BalanceSheetFetcher();
const csvFilePath = path.resolve(
  __dirname,
  "../../../components/data/ps-transactions.csv"
);
const categoryNamesPath = path.resolve(
  __dirname,
  "../../../components/data/category_names.json"
);
const csvBodyParser = express.text({
  type: ["text/csv", "text/plain", "application/octet-stream"],
  limit: "10mb",
});

// Ingest PS transactions from CSV into MongoDB
router.post("/ingest-ps", async (req, res) => {
  try {
    const ingestResult = await psCsvIngestor.ingestPsTransactionsFromCsv();
    await PSdata.db
      .collection("appdata")
      .updateOne({}, { $set: { lastIngest: new Date() } }, { upsert: true });
    const insertedCount =
      Number.isFinite(ingestResult?.insertedCount) &&
      ingestResult?.insertedCount >= 0
        ? ingestResult.insertedCount
        : Number.isFinite(ingestResult)
        ? ingestResult
        : 0;
    const skippedCount =
      Number.isFinite(ingestResult?.skippedCount) &&
      ingestResult?.skippedCount >= 0
        ? ingestResult.skippedCount
        : 0;
    const updatedCount =
      Number.isFinite(ingestResult?.updatedCount) &&
      ingestResult?.updatedCount >= 0
        ? ingestResult.updatedCount
        : 0;
    return res.json({
      insertedCount,
      skippedCount,
      updatedCount,
    });
  } catch (error) {
    console.error("[INGEST-PS] Failed to ingest PS transactions:", error);
    return res.status(500).json({
      error: "Failed to ingest PS transactions into MongoDB",
    });
  }
});

// Clear all PS records from MongoDB
router.post("/ingest-ps/clearall", async (req, res) => {
  try {
    await psCsvIngestor.clearAllRecords();
    return res.json({ cleared: true });
  } catch (error) {
    console.error("[INGEST-PS] Failed to clear PS records:", error);
    return res.status(500).json({
      error: "Failed to clear PS records in MongoDB",
    });
  }
});

// Upload PS CSV file to server
router.post("/upload-ps", csvBodyParser, async (req, res) => {
  const payload = req.body;
  if (!payload) {
    return res.status(400).json({ error: "CSV payload is required" });
  }

  try {
    await fs.writeFile(csvFilePath, payload, "utf8");
    return res.json({
      message: "Payroll file saved to components/data/ps-transactions.csv",
      size: Buffer.byteLength(payload, "utf8"),
    });
  } catch (error) {
    console.error("[UPLOAD-PS] Failed to write CSV:", error);
    res.status(500).json({ error: "Unable to save payroll file" });
  }
});

const analyzePsHandler = async (req, res) => {
  try {
    const accountNamesPath = balanceSheetFetcher.accountNamesPath;
    const coaPath = balanceSheetFetcher.coaPath;
    console.log(
      "[ANALYZE-PS] Using account/coa paths:",
      accountNamesPath,
      coaPath
    );

    // Write account names file and report missing/unknown accounts

    await DataAnalyzerUtils.writeAccountNamesFile(PSdata, accountNamesPath);

    const accountNamesData = DataAnalyzerUtils.readJson(accountNamesPath);
    const accountNames = Object.keys(accountNamesData).filter(
      (name) => typeof name === "string" && name.length > 0
    );
    const coaData = DataAnalyzerUtils.readJson(coaPath);
    const coaAccounts = DataAnalyzerUtils.collectCoaStrings(coaData);
    const misAcct = DataAnalyzerUtils.reportMissingAccounts(
      accountNamesPath,
      coaPath
    );
    console.log("[DA] Missing Accounts: ", misAcct);
    const missCOAact = DataAnalyzerUtils.reportUnknownCoaAccounts(
      accountNamesPath,
      coaPath
    );
    console.log("[DA] Unknown COA Accounts: ", missCOAact);
    await DataAnalyzerUtils.writeCategoryNamesFile(PSdata, categoryNamesPath);
    const misCat = DataAnalyzerUtils.reportMissingCategories(
      categoryNamesPath,
      coaPath
    );
    console.log("[DA] Missing Categories: ", misCat);
    const missCOACat = DataAnalyzerUtils.reportUnknownCoaCategories(
      categoryNamesPath,
      coaPath
    );
    console.log("[DA] Unknown COA Categories: ", missCOACat);
    return res.json({
      misAcct,
      missCOAact,
      misCat,
      missCOACat,
    });
  } catch (error) {
    console.error("[ANALYZE-PS] Failed to analyze PS data:", error);
    return res
      .status(500)
      .json({ error: "Failed to analyze PS data. See server logs." });
  }
};

router.post("/analyze-ps", analyzePsHandler);
router.get("/analyze-ps", analyzePsHandler);

router.get("/getappdata", async (req, res) => {
  try {
    const appdata = await PSdata.db.collection("appdata").find({}).toArray();
    return res.json(appdata);
  } catch (error) {
    console.error("[GET-APPDATA] Failed to fetch appdata:", error);
    return res.status(500).json({
      error: "Failed to fetch appdata from MongoDB",
    });
  }
});

module.exports = router;
