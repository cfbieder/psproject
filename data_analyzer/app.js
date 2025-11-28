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
const DataAnalyzerUtils = require("../server/src/services/retrieval/dataAnalyzerUtils");
const BalanceSheetFetcher = require("../server/src/services/reporting/balanceSheetFetcher");
const { dataPaths } = require("../server/src/utils/dataPaths");

// URL of MongoDB server
var db = process.env.MONGO_URI;
console.log("[DA] Mongo URI: ", db);

//Models
const PSdata = require("../components/models/PSdata");

//Data Gateway
const DataGateway = require("../components/helpers/DataGateway");
const gateway = new DataGateway();

//CSV Ingestor
const PsCsvIngestor = require("../server/src/services/retrieval/psCsvIngestor");
const psCsvIngestor = new PsCsvIngestor({ gateway });
const balanceSheetFetcher = new BalanceSheetFetcher();
const accountNamesPath = dataPaths.accountNames;
//const accountNamesPath = balanceSheetFetcher.accountNamesPath;
const coaPath = dataPaths.coa;
//const coaPath = balanceSheetFetcher.coaPath;
const categoryNamesPath = dataPaths.categoryNames;

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

  /* uncomment to test category names and COA reporting
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

  */
  const startDate = new Date("2025-10-01");
  console.log("[DA] As of Date: %s", startDate.toISOString());
  const endDate = new Date("2025-10-31");
  console.log("[DA] End Date: %s", endDate.toISOString());
  const category = "Kasia Spending";
  console.log("[DA] Category: %s", category);

  const formatDate = (date) => {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${month}-${day}-${date.getFullYear()}`;
  };

  const cashFlowFetcher = require("../server/src/services/reporting/cashFLowFetcher");
  const cff = new cashFlowFetcher();
  cff.getCategoryBaseAmountSum(category, startDate, endDate).then((sum) => {
    console.log(
      `[DA] Total BaseAmount for category '${category}' from ${formatDate(
        startDate
      )} to ${formatDate(endDate)}: ${sum}`
    );
  });

  /*
  cff
    .fetchCategoryBalances({
      filename: categoryNamesPath,
      fromDate: startDate,
      toDate: endDate,
    })
    .then((balances) => {
      console.log("[DA] Category Balances:", balances);
    });
    */

  const cashFlowReport = await cff.buildCashFlowReport({
    fromDate: startDate,
    toDate: endDate,
    outputToFile: true,
    transfers: "only",
    includeUnrealizedGL: false,
  });
  console.log(cashFlowReport);
  console.log("[DA] Cash Flow report generated.");
}

main();
