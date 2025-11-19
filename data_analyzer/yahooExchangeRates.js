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
      process.env.YAHOO_API_USER_AGENT || process.env.HTTP_USER_AGENT || DEFAULT_USER_AGENT,
  };
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(`Yahoo API request failed with ${res.statusCode}`)
          );
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

async function getExchangeRate({
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

module.exports = {
  getExchangeRate,
};
