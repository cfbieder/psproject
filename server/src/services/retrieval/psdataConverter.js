const pocketsmith = require("./pocketsmith");

// Convert an array of PocketSmith transactions from api to PSdata records
async function convertTransactionsToPSdata(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const psDataRecords = await Promise.all(
    transactions.map(mapTransactionToPsData)
  );
  const resolvedRecords = await resolveParentCategoryTitles(psDataRecords);
  console.log(`Prepared ${psDataRecords.length} PSdata records from file`);
  return resolvedRecords;
}

async function resolveParentCategoryTitles(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return records;
  }

  const numericIds = [];
  for (const record of records) {
    const value = record?.ParentCategories;
    if (value === undefined || value === null) {
      continue;
    }

    const numericValue =
      typeof value === "number"
        ? value
        : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

    if (Number.isFinite(numericValue)) {
      numericIds.push(numericValue);
    }
  }

  if (numericIds.length === 0) {
    return records;
  }

  const titlesById = new Map();
  await Promise.all(
    Array.from(new Set(numericIds)).map(async (id) => {
      try {
        const { data } = await pocketsmith.getCategoriesId({ id });
        if (data?.title) {
          titlesById.set(id, String(data.title));
        }
      } catch (err) {
        console.error(err);
      }
    })
  );

  for (const record of records) {
    const id = Number(record?.ParentCategories);
    if (!Number.isFinite(id)) {
      continue;
    }

    const title = titlesById.get(id);
    record.ParentCategories = title || String(record.ParentCategories);
  }

  return records;
}

function mapTransactionToPsData(transaction) {
  const parsedDate = transaction?.date ? new Date(transaction.date) : undefined;

  const record = {
    Date:
      parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime())
        ? parsedDate
        : undefined,
    Description1: transaction?.payee || undefined,
    Description2: transaction?.original_payee || undefined,
    Amount: transaction?.amount,
    Currency:
      transaction?.transaction_account?.currency_code?.toUpperCase() ||
      undefined,
    BaseAmount: transaction?.amount_in_base_currency,
    BaseCurrency: "USD",
    TransactionType: transaction?.type,
    Account: transaction?.transaction_account?.name,
    ClosingBalance: transaction?.closing_balance,
    Category: transaction?.category?.title,
    ParentCategories: transaction?.category?.parent_id,
    Labels: Array.isArray(transaction?.labels)
      ? transaction.labels.join(",")
      : undefined,
    Memo: transaction?.memo || undefined,
    Note: transaction?.note || undefined,
    ID: transaction?.id ? String(transaction.id) : undefined,
    Bank: transaction?.transaction_account?.institution?.title,
  };

  Object.keys(record).forEach((key) => {
    if (record[key] === undefined || record[key] === null) {
      delete record[key];
    }
  });
  return record;
}

module.exports = {
  convertTransactionsToPSdata,
  mapTransactionToPsData,
  resolveParentCategoryTitles,
};
