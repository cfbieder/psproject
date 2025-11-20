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
const { toNumber, toDate } = require("../components/helpers/utils");

// PsCsvIngestor class for ingesting PS CSV data into MongoDB
class PsCsvIngestor {
  constructor({ gateway, csvPath }) {
    this.gateway = gateway;
    this.csvPath =
      csvPath ||
      path.resolve(__dirname, "../components/data/ps-transactions.csv");
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
      return;
    }

    const stream = fs.createReadStream(this.csvPath, { encoding: "utf8" });
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    let headers = null;
    let batch = [];
    const batchSize = 1000;
    let insertedCount = 0;

    await this.gateway.PSdata_ClearAll();

    const flushBatch = async () => {
      if (!batch.length) {
        return;
      }
      try {
        const inserted = await this.gateway.PSdata_InsertMany(batch);
        insertedCount += inserted.length || 0;
      } catch (err) {
        console.error("[DA] Failed to insert batch:", err.message);
      }
      batch = [];
    };

    // Read and process CSV lines
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
    // Flush any remaining records in the batch
    await flushBatch();
    console.log("[DA] Inserted %d PS transactions from CSV", insertedCount);
  }
}

module.exports = PsCsvIngestor;
