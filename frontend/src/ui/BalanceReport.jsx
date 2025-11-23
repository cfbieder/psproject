const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Formats a number as USD currency, handling negative values with parentheses
const formatCurrency = (value) => {
  const amount = value ?? 0;
  return amount < 0
    ? `(${currencyFormatter.format(Math.abs(amount))})`
    : currencyFormatter.format(amount);
};

// Builds a map of account paths to their total USD values for quick lookup
const buildAccountValueMap = (accounts, path = [], map = new Map()) => {
  if (!Array.isArray(accounts)) {
    return map;
  }

  for (const account of accounts) {
    const key = [...path, account.name].join(">");
    map.set(key, account.totalUSD);
    if (Array.isArray(account.children) && account.children.length > 0) {
      buildAccountValueMap(account.children, [...path, account.name], map);
    }
  }

  return map;
};

const renderAccountRows = (
  accounts,
  level = 0,
  path = [],
  comparisonMaps = []
) => {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return [];
  }

  return accounts.flatMap((account) => {
    const hasChildren =
      Array.isArray(account.children) && account.children.length > 0;
    const pathKey = [...path, account.name].join(">");
    const comparisonValues = comparisonMaps.map(
      (map) => map?.get(pathKey) ?? 0
    );
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
        {comparisonValues.map((value, index) => (
          <td
            key={`${pathKey}-comparison-${index}`}
            className={`balance-report-table__value ${
              value < 0 ? "balance-report-table__value--negative" : ""
            }`}
          >
            {formatCurrency(value)}
          </td>
        ))}
      </tr>
    );

    const childrenRows = hasChildren
      ? renderAccountRows(
          account.children,
          level + 1,
          [...path, account.name],
          comparisonMaps
        )
      : [];

    return hasChildren ? [row, ...childrenRows] : [row];
  });
};

export default function BalanceReport({
  balanceReports,
  periodDates,
  periodCount,
}) {
  const activeReports = Array.isArray(balanceReports)
    ? balanceReports.slice(0, Math.min(periodCount ?? 1, 3))
    : [];
  const baseReport = activeReports[0];
  const hasReport = Array.isArray(baseReport) && baseReport.length > 0;
  const comparisonMaps = activeReports
    .slice(1)
    .map((report) => buildAccountValueMap(report));
  const periodLabels = activeReports.map(
    (_, index) => periodDates?.[index] ?? `Period ${index + 1}`
  );

  return (
    <section className="balance-content">
      <h1 className="page__title">Balance Overview</h1>
      {hasReport ? (
        <div className="balance-report">
          <div className="balance-report__header">
            <h2 className="balance-report__title">Balance Sheet</h2>
            <span className="balance-report__date">
              As of {periodLabels[0]}
              {periodLabels.length > 1
                ? ` vs ${periodLabels.slice(1).join(" vs ")}`
                : ""}
            </span>
          </div>
          <table className="balance-report-table">
            <colgroup>
              <col style={{ width: "75%" }} />
              <col />
              {periodLabels.slice(1).map((_, index) => (
                <col key={`period-col-${index + 2}`} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th>Account</th>
                <th>{`Amount (${periodLabels[0] ?? "Period 1"})`}</th>
                {periodLabels.slice(1).map((label, index) => (
                  <th
                    key={`period-header-${index + 2}`}
                  >{`Amount (${label})`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderAccountRows(baseReport, 0, [], comparisonMaps)}
            </tbody>
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
