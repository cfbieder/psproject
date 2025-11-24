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
const DataAnalyzerUtils = require("./dataAnalyzerUtils");
const BalanceSheetFetcher = require("./BalanceSheetFetcher");

// Default path for account names JSON file
const DEFAULT_ACCOUNT_NAMES_PATH =
  process.env.ACCOUNT_NAMES_PATH ||
  path.join(__dirname, "../components/data/account_names.json");

// Default path for category names JSON file
const DEFAULT_CATEGORY_NAMES_PATH =
  process.env.CATEGORY_NAMES_PATH ||
  path.join(__dirname, "../components/data/category _names.json");

// Default path for COA JSON file
const DEFAULT_COA_PATH =
  process.env.COA_PATH || path.join(__dirname, "../components/data/coa.json");

// URL of MongoDB server
var db = process.env.MONGO_URI;
console.log("[DA] Mongo URI: ", db);

//Models
const PSdata = require("../components/models/PSdata");

//Data Gateway
const DataGateway = require("../components/helpers/DataGateway");
const gateway = new DataGateway();

//CSV Ingestor
const PsCsvIngestor = require("./psCsvIngestor");
const psCsvIngestor = new PsCsvIngestor({ gateway });
const balanceSheetFetcher = new BalanceSheetFetcher();
const accountNamesPath = DEFAULT_ACCOUNT_NAMES_PATH;
//const accountNamesPath = balanceSheetFetcher.accountNamesPath;
const coaPath = DEFAULT_COA_PATH;
//const coaPath = balanceSheetFetcher.coaPath;
const categoryNamesPath = DEFAULT_CATEGORY_NAMES_PATH;

console.log("[DA] Using account/coa paths:", accountNamesPath, coaPath);

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

  /* uncomment to ingest CSV data
  await psCsvIngestor.ingestPsTransactionsFromCsv();
  await check_load_database();
  */

  /* uncomment to test account names and COA reporting
  // Write account names file and report missing/unknown accounts
  await DataAnalyzerUtils.writeAccountNamesFile(PSdata, accountNamesPath);
  misAcct = DataAnalyzerUtils.reportMissingAccounts(accountNamesPath, coaPath);
  console.log("[DA] Missing Accounts: ", misAcct);
  missCOAAcct = DataAnalyzerUtils.reportUnknownCoaAccounts(
    accountNamesPath,
    coaPath
  );
  console.log("[DA] Unknown COA Accounts: ", missCOAAcct);
  */

  /* uncomment to test balance sheet fetching
  const asOfDate = new Date("2025-11-01");
  //const asOfDate = new Date(); // set to today's date if you want current date

  const balance = await balanceSheetFetcher.getAccountBalanceAsOf(
    "PKO - Deposits",
    asOfDate
  );
  console.log("[DA] Account Balances %s:", balance["PKO - Deposits"]);

  console.log("[DA] As of Date: %s", asOfDate.toISOString());

  // Build Balance Sheet Report
  const balanceSheetReport = await balanceSheetFetcher.buildBalanceSheetReport(
    asOfDate,
    true
  );
  console.log("[DA] Balance Sheet report generated.");
  */
  //
  await DataAnalyzerUtils.writeCategoryNamesFile(PSdata, categoryNamesPath);
  missCat = DataAnalyzerUtils.reportMissingCategories(
    categoryNamesPath,
    coaPath
  );
  console.log("[DA] Missing Categories: ", missCat);
  missCOACat = DataAnalyzerUtils.reportUnknownCoaCategories(
    categoryNamesPath,
    coaPath
  );
  console.log("[DA] Unknown COA Categories: ", missCOACat);
}

main();
