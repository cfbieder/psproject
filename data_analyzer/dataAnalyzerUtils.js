/******************************************************************************************************
 * Data Analyzer Utilities
 * Chris Biedermann
 * V1.0
 * November 2025
 * Primaryly calls
 * (1)  for checking integrity between account names and COA files
 *      reportMissingAccounts({filePath for account names}, {filePath for COA}), reportUnknownCoaAccounts({filePath for account names}, {filePath for COA})
 * (2)  for writing unique account names from the psModel to a JSON file
 *      writeAccountNamesFile({psModel}, {outputPath})
 * (3)  helper function for reading and parsing a JSON file from the given path
 *      readJson({filePath})
 * (4)  helper function for getting a USD currency formatter
 *      getUsdCurrencyFormatter()
 *******************************************************************************************************/

const fs = require("fs");

// USD Currency Formatter
const usdCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Utility class for checking integrity between account names and COA files
class DataAnalyzerUtils {
  // Writes unique account names from the psModel to a JSON file
  static async writeAccountNamesFile(psModel, outputPath) {
    if (!psModel || typeof psModel.distinct !== "function") {
      throw new TypeError("psModel with a distinct function is required");
    }

    const names = await psModel.distinct("Account").exec();
    console.log("[DA] Count Unique Account Names: %d", names.length);

    const accounts = {};
    for (let i = 0; i < names.length; i += 1) {
      const name = names[i];
      if (typeof name === "string" && name.length > 0) {
        accounts[name] = "";
      }
    }

    fs.writeFileSync(outputPath, JSON.stringify(accounts, null, 2) + "\n");
    console.log("[DA] Account names saved to %s", outputPath);
  }

  // Reads and parses a JSON file from the given path
  static readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // Helper function that recursively collects unique strings from a nested structure
  static collectCoaStrings(root, includeFn) {
    if (!root) {
      return new Set();
    }

    const shouldInclude =
      typeof includeFn === "function" ? includeFn : () => true;
    const results = new Set();
    const stack = [root];

    while (stack.length) {
      const value = stack.pop();

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed && shouldInclude(trimmed)) {
          results.add(trimmed);
        }
        continue;
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
          stack.push(value[i]);
        }
        continue;
      }

      if (value && typeof value === "object") {
        for (const child of Object.values(value)) {
          stack.push(child);
        }
      }
    }

    return results;
  }

  // Reports account names that are missing from the COA file
  static reportMissingAccounts(accountNamesPath, coaPath) {
    const accountNamesData = this.readJson(accountNamesPath);
    const coaData = this.readJson(coaPath);
    const coaAccounts = this.collectCoaStrings(coaData);

    const missing = [];
    for (const name of Object.keys(accountNamesData)) {
      if (name && !coaAccounts.has(name)) {
        missing.push(name);
      }
    }

    if (missing.length) {
      console.warn(
        "[DA] Accounts missing from COA (%d): %s",
        missing.length,
        missing.join(", ")
      );
    } else {
      console.log("[DA] All account names exist in the COA file");
    }
  }

  // Reports COA accounts that are unknown in the account names file
  static reportUnknownCoaAccounts(accountNamesPath, coaPath) {
    const accountNamesData = this.readJson(accountNamesPath);
    const knownAccounts = new Set(
      Object.keys(accountNamesData).filter(
        (name) => typeof name === "string" && name.length > 0
      )
    );
    const coaData = this.readJson(coaPath);
    const balanceSheetEntry =
      Array.isArray(coaData) &&
      coaData.find(
        (item) =>
          item &&
          typeof item === "object" &&
          Object.prototype.hasOwnProperty.call(item, "Balance Sheet Accounts")
      );

    if (!balanceSheetEntry) {
      console.warn("[DA] Balance Sheet Accounts not found in COA file");
      return;
    }

    const balanceSheetData = balanceSheetEntry["Balance Sheet Accounts"];
    const unknownAccounts = this.collectCoaStrings(
      balanceSheetData,
      (name) => !knownAccounts.has(name)
    );

    if (unknownAccounts.size) {
      console.warn(
        "[DA] Accounts in COA but missing from account_names (%d): %s",
        unknownAccounts.size,
        Array.from(unknownAccounts).join(", ")
      );
    } else {
      console.log("[DA] All COA accounts exist in account_names.json");
    }
  }

  static getUsdCurrencyFormatter() {
    return usdCurrencyFormatter;
  }
}

module.exports = DataAnalyzerUtils;
