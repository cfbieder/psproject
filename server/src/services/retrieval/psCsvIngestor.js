/******************************************************************************************************
 * PocketSmith CSV Ingestor
 * Chris Biedermann
 * V1.0
 * November 2025
 * Primaryly calls
 *   (1)Ingest PS transactions from CSV file into MongoDB
 *      -psCsvIngestor.ingestPsTransactionsFromCsv()
 *   (2) Helpers to parse CSV lines and build PSdata records
 *******************************************************************************************************/

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { toNumber, toDate } = require("../../../../components/helpers/utils");
const PSdata = require("../../../../components/models/PSdata");
const {
  dataPaths,
  resolveDataPath,
  ensureComponentsDataDir,
} = require("../../utils/dataPaths");

// PsCsvIngestor class for ingesting PS CSV data into MongoDB
class PsCsvIngestor {
  constructor({ gateway, csvPath }) {
    this.gateway = gateway;
    ensureComponentsDataDir();
    this.csvPath = csvPath
      ? resolveDataPath(csvPath, "ps-transactions.csv")
      : dataPaths.psTransactions;
  }

  // Simple CSV line parser handling quoted fields
  parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }
      current += ch;
    }
    values.push(current);
    return values;
  }

  // Clear all PSdata records from MongoDB
  async clearAllRecords() {
    try {
      console.log("[DA] Clearing existing PS data...");
      ret = await this.gateway.PSdata_ClearAll();
      console.log("[DA] Cleared existing PS data." + ret);
    } catch (err) {
      console.warn(
        "[DA] Skipping PS data clear because it failed:",
        err.message
      );
    }
  }

  // Build PSdata record from CSV row
  buildPsRecord(row) {
    const record = {};
    const date = toDate(row.Date);
    if (date) record.Date = date;
    if (row.Merchant) record.Description1 = row.Merchant;
    if (row["Merchant Changed From"])
      record.Description2 = row["Merchant Changed From"];
    const amount = toNumber(row.Amount);
    if (amount !== undefined) record.Amount = amount;
    if (row.Currency) record.Currency = row.Currency;
    const baseAmount = toNumber(row["Amount in base currency"]);
    if (baseAmount !== undefined) record.BaseAmount = baseAmount;
    if (row["Base currency"]) record.BaseCurrency = row["Base currency"];
    if (row["Transaction Type"])
      record.TransactionType = row["Transaction Type"];
    if (row.Account) record.Account = row.Account;
    const closingBalance = toNumber(row["Closing Balance"]);
    if (closingBalance !== undefined) record.ClosingBalance = closingBalance;
    if (row.Category) record.Category = row.Category;
    if (row["Parent Categories"])
      record.ParentCategories = row["Parent Categories"];
    if (row.Labels) record.Labels = row.Labels;
    if (row.Memo) record.Memo = row.Memo;
    if (row.Note) record.Note = row.Note;
    if (row.ID) record.ID = row.ID;
    if (row.Bank) record.Bank = row.Bank;
    return Object.keys(record).length ? record : null;
  }

  // MAIN FUNCTION to call
  // Ingest PS transactions from CSV file into MongoDB
  async ingestPsTransactionsFromCsv() {
    if (!fs.existsSync(this.csvPath)) {
      console.warn("[DA] CSV file not found:", this.csvPath);
      return 0;
    }

    const stream = fs.createReadStream(this.csvPath, { encoding: "utf8" });
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    const streamClosePromise = new Promise((resolve) => {
      if (stream.closed || stream.destroyed) {
        resolve();
        return;
      }
      stream.once("close", resolve);
    });

    let headers = null;
    let batch = [];
    const batchSize = 1000;
    let addedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    console.log("[DA] Ingesting PS transactions from CSV:", this.csvPath);
    const flushBatch = async () => {
      if (!batch.length) {
        console.log("[DA] No records to insert in batch.");
        return;
      }
      try {
        console.log("[DA] Processing batch of", batch.length, "records");
        const ids = [];
        for (const record of batch) {
          if (record.ID) {
            ids.push(record.ID);
          }
        }
        const uniqueIds = Array.from(new Set(ids));
        const existingDocs = uniqueIds.length
          ? await PSdata.find({ ID: { $in: uniqueIds } }).lean()
          : [];
        const existingMap = new Map(
          existingDocs.map((doc) => [doc.ID, doc])
        );
        const operations = [];
        const pendingInserts = new Map();
        let batchAdded = 0;
        let batchUpdated = 0;
        let batchSkipped = 0;
        const isDifferent = (existing, incoming) => {
          for (const key of Object.keys(incoming)) {
            const existingVal = existing[key];
            const incomingVal = incoming[key];
            const left =
              existingVal instanceof Date ? existingVal.getTime() : existingVal;
            const right =
              incomingVal instanceof Date ? incomingVal.getTime() : incomingVal;
            if (left !== right) {
              return true;
            }
          }
          return false;
        };
        for (const record of batch) {
          if (record.ID) {
            const existing = existingMap.get(record.ID);
            if (existing) {
              if (!existing._id) {
                const pendingIndex = pendingInserts.get(record.ID);
                if (
                  pendingIndex !== undefined &&
                  isDifferent(existing, record)
                ) {
                  operations[pendingIndex].insertOne.document = record;
                  existingMap.set(record.ID, record);
                }
                batchSkipped++;
                continue;
              }
              if (isDifferent(existing, record)) {
                operations.push({
                  updateOne: {
                    filter: { _id: existing._id },
                    update: { $set: record },
                  },
                });
                existingMap.set(record.ID, Object.assign({}, existing, record));
                batchUpdated++;
              } else {
                batchSkipped++;
              }
              continue;
            }
            existingMap.set(record.ID, record);
            pendingInserts.set(record.ID, operations.length);
          }
          operations.push({ insertOne: { document: record } });
          batchAdded++;
        }
        if (operations.length) {
          await PSdata.bulkWrite(operations, { ordered: false });
        }
        addedCount += batchAdded;
        updatedCount += batchUpdated;
        skippedCount += batchSkipped;
      } catch (err) {
        console.error("[DA] Failed to insert batch:", err.message);
      }
      batch = [];
    };
    console.log("[DA] Reading CSV file line by line...");
    try {
      for await (const rawLine of rl) {
        const line = rawLine.replace(/\r$/, "");
        if (!line.trim()) {
          continue;
        }
        const values = this.parseCsvLine(line);
        if (!headers) {
          headers = values;
          continue;
        }
        if (values.length < headers.length) {
          continue;
        }
        const row = {};
        for (let i = 0; i < headers.length; i++) {
          row[headers[i]] = values[i] ? values[i].trim() : "";
        }
        const record = this.buildPsRecord(row);
        if (!record) {
          continue;
        }
        batch.push(record);
        if (batch.length >= batchSize) {
          await flushBatch();
        }
      }
      await flushBatch();
    } finally {
      rl.close();
      await streamClosePromise;
      console.log("[DA] CSV file stream closed.");
      const isStreamClosed = stream.closed || stream.destroyed;
      if (!isStreamClosed) {
        console.warn(
          "[DA] CSV file stream may not have closed cleanly:",
          this.csvPath
        );
      }
    }
    console.log(
      "[DA] Added %d, Updated %d, Skipped %d PS transactions from CSV",
      addedCount,
      updatedCount,
      skippedCount
    );
    return {
      insertedCount: addedCount,
      updatedCount,
      skippedCount,
    };
  }
}

module.exports = PsCsvIngestor;
