const express = require("express");
const fs = require("node:fs/promises");
const path = require("path");
const DataGateway = require("../../../components/helpers/DataGateway");
const PsCsvIngestor = require("../../../data_analyzer/psCsvIngestor");

const router = express.Router();
const gateway = new DataGateway();
const psCsvIngestor = new PsCsvIngestor({ gateway });
const csvFilePath = path.resolve(
  __dirname,
  "../../../components/data/ps-transactions.csv"
);
const csvBodyParser = express.text({
  type: ["text/csv", "text/plain", "application/octet-stream"],
  limit: "10mb",
});

// Ingest PS transactions from CSV into MongoDB
router.post("/ingest-ps", async (req, res) => {
  try {
    const insertedCount = await psCsvIngestor.ingestPsTransactionsFromCsv();
    return res.json({
      insertedCount: Number.isFinite(insertedCount) ? insertedCount : 0,
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

module.exports = router;
