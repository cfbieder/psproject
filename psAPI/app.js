const {
  processTransactions,
  logTransactionFileCounts,
} = require("../server/src/services/retrieval/refreshPSAPI");

processTransactions()
  .then(() => console.log(logTransactionFileCounts()))
  .catch((err) => console.error(err));
