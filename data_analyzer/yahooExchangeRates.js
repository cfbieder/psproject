/******************************************************************************************************
 * Yahoo Exchange Rate Fetcher
 * Chris Biedermann
 * V1.0
 * November 2025
 * Primary Functions:
 *  - getExchangeRate(baseCurrency, quoteCurrency, asOfDate)
 *  - getExchangeRateDetails({ baseCurrency, quoteCurrency, date })
 * Description:
 *  This module fetches historical exchange rates from Yahoo Finance.
 *
 * Usage:
 *  const yahooExchangeRates = require('./yahooExchangeRates');
 *  const rate = await yahooExchangeRates.getExchangeRate('USD', 'EUR', '2023-01-01');
 *
 *
 *
 * Functions:
 *
 * - getExchangeRate(baseCurrency, quoteCurrency, asOfDate):
 *    Fetches the exchange rate between two currencies on a specific date.
 *   Parameters:
 *    - baseCurrency (string): The base currency code (e.g., 'USD').
 *
 *  - quoteCurrency (string): The quote currency code (e.g., 'EUR').
 *   - asOfDate (string|Date): The date for which to fetch the exchange rate.
 *  Returns:
 *   - (number|null): The exchange rate or null if not found.
 * Errors:
 *  - Returns null if the exchange rate cannot be fetched.
 *
 *
 * - getExchangeRateDetails({ baseCurrency, quoteCurrency, date }):
 *   Fetches detailed exchange rate information.
 *  Parameters:
 *   - baseCurrency (string): The base currency code (default 'USD').
 *  - quoteCurrency (string): The quote currency code (default 'EUR').
 *  - date (string|Date): The date for which to fetch the exchange rate (default current date).
 * Returns:
 *  - (object): An object containing symbol, baseCurrency, quoteCurrency, date, and rate.
 * Errors:
 *  - Throws errors for invalid parameters or if no data is found.
 *
 *******************************************************************************************************/

const https = require("https");

const DAY_IN_SECONDS = 24 * 60 * 60;

function buildSymbol(baseCurrency, quoteCurrency) {
  if (!baseCurrency || !quoteCurrency) {
    throw new Error("Both baseCurrency and quoteCurrency are required.");
  }
  return `${baseCurrency}${quoteCurrency}`.toUpperCase() + "=X";
}

function buildDateRange(date) {
  const target =
    date instanceof Date ? date : date ? new Date(date) : new Date();
  if (Number.isNaN(target.getTime())) {
    throw new Error("Invalid date provided.");
  }
  const utcStart = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate()
  );
  const period1 = Math.floor(utcStart / 1000);
  const period2 = period1 + DAY_IN_SECONDS;
  return { period1, period2 };
}

const DEFAULT_USER_AGENT =
  "DataAnalyzer/1.0 (https://github.com/cfbieder/bookdb)";

function fetchJson(url) {
  const headers = {
    "User-Agent":
      process.env.YAHOO_API_USER_AGENT ||
      process.env.HTTP_USER_AGENT ||
      DEFAULT_USER_AGENT,
  };
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Yahoo API request failed with ${res.statusCode}`));
          res.resume();
          return;
        }
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchExchangeRateDetails({
  baseCurrency = "USD",
  quoteCurrency = "EUR",
  date = new Date(),
} = {}) {
  const symbol = buildSymbol(baseCurrency, quoteCurrency);
  const { period1, period2 } = buildDateRange(date);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${period1}&period2=${period2}`;
  const response = await fetchJson(url);
  const result = response?.chart?.result?.[0];
  if (!result) {
    throw new Error("No results returned from Yahoo API.");
  }
  const close = result.indicators?.quote?.[0]?.close?.[0];
  if (typeof close !== "number" || Number.isNaN(close)) {
    throw new Error("No exchange rate found for the requested date.");
  }
  return {
    symbol,
    baseCurrency: baseCurrency.toUpperCase(),
    quoteCurrency: quoteCurrency.toUpperCase(),
    date: new Date(result.timestamp?.[0] * 1000 || date),
    rate: close,
  };
}

async function getExchangeRate(baseCurrency, quoteCurrency, asOfDate) {
  const exchangeOptions = { date: asOfDate };
  if (baseCurrency) {
    exchangeOptions.baseCurrency = baseCurrency;
  }
  if (quoteCurrency) {
    exchangeOptions.quoteCurrency = quoteCurrency;
  }
  try {
    const exchangeRate = await fetchExchangeRateDetails(exchangeOptions);
    return typeof exchangeRate.rate === "number" ? exchangeRate.rate : null;
  } catch (err) {
    return null;
  }
}

module.exports = {
  getExchangeRate,
  getExchangeRateDetails: fetchExchangeRateDetails,
};
