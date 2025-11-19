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

// URL of MongoDB server
var db = process.env.MONGO_URI;
console.log("[DA] Mongo URI: ", db);

//Data file paths
const ACCOUNT_NAMES_PATH = path.join(
  __dirname,
  "../components/data/account_names.json"
);
const COA_PATH = path.join(__dirname, "../components/data/coa.json");

//Models
const PSdata = require("../components/models/PSdata");

//Data Gateway
const DataGateway = require("../components/helpers/DataGateway");
const gateway = new DataGateway();

//CSV Ingestor
const PsCsvIngestor = require("./psCsvIngestor");
const psCsvIngestor = new PsCsvIngestor({ gateway });

//Mock function used for testing
async function process_incoming_test() {
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

async function main() {
  await startMongoose();
  //await psCsvIngestor.ingestPsTransactionsFromCsv();
  await process_incoming_test();
  await DataAnalyzerUtils.writeAccountNamesFile(PSdata, ACCOUNT_NAMES_PATH);
  DataAnalyzerUtils.reportMissingAccounts(ACCOUNT_NAMES_PATH, COA_PATH);
  DataAnalyzerUtils.reportUnknownCoaAccounts(ACCOUNT_NAMES_PATH, COA_PATH);
  getAccountRecordWithHighestId({ Account: "Fidelity Cash Mgt" }).then(
    (record) => {
      const formattedBalance = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(record.ClosingBalance);
      console.log(
        "[DA] Balance of %s ID for %s: ",
        formattedBalance,
        record.Account
      );
    }
  );
}

main();

//Function to get the record with the highest numeric ID for a given account
async function getAccountRecordWithHighestId(accountFilter) {
  const accountName =
    typeof accountFilter === "string"
      ? accountFilter.trim()
      : accountFilter && typeof accountFilter.Account === "string"
      ? accountFilter.Account.trim()
      : "";

  if (!accountName) {
    throw new Error(
      "Account is required to find the record with the highest ID."
    );
  }

  const [record] = await PSdata.aggregate([
    { $match: { Account: accountName } },
    {
      $addFields: {
        __numericId: {
          $convert: {
            input: "$ID",
            to: "double",
            onError: Number.MIN_SAFE_INTEGER,
            onNull: Number.MIN_SAFE_INTEGER,
          },
        },
      },
    },
    { $sort: { __numericId: -1 } },
    { $limit: 1 },
    { $project: { __numericId: 0 } },
  ]).exec();

  return record || null;
}
