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
const yahooExchangeRates = require("./yahooExchangeRates");

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

  //const asOfDate = new Date("2024-12-31");
  const asOfDate = new Date(); // set to today's date if you want current date
  console.log("[DA] As of Date: %s", asOfDate.toISOString());
  const exchangeOptions = { date: asOfDate };
  const baseCurrency =
    process.env.EXCHANGE_BASE_CURRENCY || process.env.BASE_CURRENCY;
  const quoteCurrency =
    process.env.EXCHANGE_QUOTE_CURRENCY || process.env.QUOTE_CURRENCY;
  if (baseCurrency) {
    exchangeOptions.baseCurrency = baseCurrency;
  }
  if (quoteCurrency) {
    exchangeOptions.quoteCurrency = quoteCurrency;
  }
  try {
    const exchangeRate = await yahooExchangeRates.getExchangeRate(
      exchangeOptions
    );
    console.log(
      "[DA] %s/%s rate on %s: %d",
      exchangeRate.baseCurrency,
      exchangeRate.quoteCurrency,
      exchangeRate.date.toISOString(),
      exchangeRate.rate
    );
  } catch (err) {
    console.error(
      "[DA] Unable to fetch exchange rate for %s: %s",
      asOfDate.toISOString(),
      err.message
    );
  }
  const accountFileContents = await fs.promises.readFile(
    ACCOUNT_NAMES_PATH,
    "utf8"
  );
  const parsedAccounts = JSON.parse(accountFileContents);
  const accountNames = Array.isArray(parsedAccounts)
    ? parsedAccounts
    : Object.keys(parsedAccounts);

  await Promise.all(
    accountNames.map((accountName) =>
      logAccountBalanceAsOf(accountName, asOfDate)
    )
  );
}

async function logAccountBalanceAsOf(accountName, asOfDate) {
  const record = await getAccountRecordWithHighestId({
    Account: accountName,
    Date: asOfDate,
  });

  if (!record) {
    console.log("[DA] No records found for %s", accountName);
    return;
  }

  const currency =
    typeof record.Currency === "string" && record.Currency.trim()
      ? record.Currency.trim().toUpperCase()
      : "USD";
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(record.ClosingBalance);

  console.log(
    "[DA] Balance of %s ID for %s: ",
    formattedBalance,
    record.Account
  );
}

main();

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

  const rawDate =
    accountFilter &&
    typeof accountFilter === "object" &&
    (accountFilter.Date ||
      accountFilter.date ||
      accountFilter.AsOfDate ||
      accountFilter.asOfDate);
  let asOfDate = null;
  if (rawDate) {
    asOfDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
    if (Number.isNaN(asOfDate.getTime())) {
      throw new Error("Invalid date provided.");
    }
  } else {
    asOfDate = new Date();
  }

  const matchStage = { Account: accountName };
  if (asOfDate) {
    matchStage.Date = { $lte: asOfDate };
  }

  const record = await PSdata.findOne(matchStage)
    .sort({ Date: -1, _id: -1 })
    .lean()
    .exec();

  return record || null;
}
