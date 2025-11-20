/******************************************************************************************************
 * Data Analyzer
 * Chris Biedermann
 * V1.0
 * November 2025
 *
 *
 *******************************************************************************************************/
// Docker or Development mode
console.log("[DA] Starting up...");
var mode = process.env.NODE_MODE;
console.log("[DA] mode: %s", mode);

// Library for MongoDB
var mongoose = require("../components/node_modules/mongoose");
const fs = require("fs");
const path = require("path");
const DataAnalyzerUtils = require("./dataAnalyzerUtils");
const BalanceSheetFetcher = require("./BalanceSheetFetcher");

// URL of MongoDB server
var db = process.env.MONGO_URI;
console.log("[DA] Mongo URI: ", db);

// File paths for account names and COA
const ACCOUNT_NAMES_PATH =
  process.env.ACCOUNT_NAMES_PATH ||
  path.join(__dirname, "../components/data/account_names.json");
const COA_PATH =
  process.env.COA_PATH || path.join(__dirname, "../components/data/coa.json");

console.log(
  "[DA] Setting up file paths...",
  process.env.ACCOUNT_NAMES_PATH,
  process.env.COA_PATH
);

//Models
const PSdata = require("../components/models/PSdata");

//Data Gateway
const DataGateway = require("../components/helpers/DataGateway");
const gateway = new DataGateway();

//CSV Ingestor
const PsCsvIngestor = require("./psCsvIngestor");
const psCsvIngestor = new PsCsvIngestor({ gateway });
const balanceSheetFetcher = new BalanceSheetFetcher();

// Test function to check loading data from database
async function check_load_database() {
  var items = await gateway.PSdata_ReadAll();
  console.log(`[DA] TESTING!!! Receive items: ${items.length}`);
}

//Start Mongoose and connect to MongoDB
async function startMongoose() {
  return mongoose
    .connect(db, {
      serverSelectionTimeoutMS: 1000,
    })
    .then(() => {
      console.log("[DA] Connected to MongoDB");
    })
    .catch((err) => {
      console.log(
        "[DA] Error:  Unable to connect to MongDB - make sure Mongo Docker is running"
      );
      process.exit();
    });
}

/****************************************************************************
 * Main Function
 ****************************************************************************/
async function main() {
  await startMongoose();
  //uncomment to ingest CSV data
  //await psCsvIngestor.ingestPsTransactionsFromCsv();
  //

  // Run test processing function
  await check_load_database();

  // Write account names file and report missing/unknown accounts
  await DataAnalyzerUtils.writeAccountNamesFile(PSdata, ACCOUNT_NAMES_PATH);
  DataAnalyzerUtils.reportMissingAccounts(ACCOUNT_NAMES_PATH, COA_PATH);
  DataAnalyzerUtils.reportUnknownCoaAccounts(ACCOUNT_NAMES_PATH, COA_PATH);

  //const asOfDate = new Date("2024-12-31");
  const asOfDate = new Date(); // set to today's date if you want current date
  console.log("[DA] As of Date: %s", asOfDate.toISOString());

  // Build Balance Sheet Report
  const balanceSheetReport = await balanceSheetFetcher.buildBalanceSheetReport(
    COA_PATH,
    ACCOUNT_NAMES_PATH,
    asOfDate,
    true
  );
  console.log("[DA] Balance Sheet report generated.");
}

main();
