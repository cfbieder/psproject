const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(value ?? 0);

const renderAccountRows = (accounts, level = 0) => {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return [];
  }

  return accounts.flatMap((account) => {
    const hasChildren =
      Array.isArray(account.children) && account.children.length > 0;
    const row = (
      <tr key={`${account.name}-${level}-${account.totalUSD}`}>
        <td
          className="balance-report-table__name"
          style={{ paddingLeft: `${level * 1.25}rem` }}
        >
          {account.name}
        </td>
        <td
          className={`balance-report-table__value ${
            (account.totalUSD ?? 0) < 0
              ? "balance-report-table__value--negative"
              : ""
          }`}
        >
          {formatCurrency(account.totalUSD)}
        </td>
      </tr>
    );

    const childrenRows = hasChildren
      ? renderAccountRows(account.children, level + 1)
      : [];

    return hasChildren ? [row, ...childrenRows] : [row];
  });
};

export default function BalanceReport({ balanceReport, selectedDate }) {
  const hasReport = Array.isArray(balanceReport) && balanceReport.length > 0;

  return (
    <section className="balance-content">
      <h1 className="page__title">Balance Overview</h1>
      {hasReport ? (
        <div className="balance-report">
          <div className="balance-report__header">
            <h2 className="balance-report__title">Balance Sheet</h2>
            <span className="balance-report__date">
              As of {selectedDate}
            </span>
          </div>
          <table className="balance-report-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Amount (USD)</th>
              </tr>
            </thead>
            <tbody>{renderAccountRows(balanceReport)}</tbody>
          </table>
        </div>
      ) : (
        <p className="balance-report-empty">
          Generate a report to view the balance sheet details.
        </p>
      )}
    </section>
  );
}
