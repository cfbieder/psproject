// Utility to format currency values
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Format currency with parentheses for negative values
const formatCurrency = (value) => {
  const amount = value ?? 0;
  return amount < 0
    ? `(${currencyFormatter.format(Math.abs(amount))})`
    : currencyFormatter.format(amount);
};

const buildCashFlowValueMap = (nodes, path = [], map = new Map()) => {
  if (!Array.isArray(nodes)) {
    return map;
  }

  for (const node of nodes) {
    const key = [...path, node.name].join(">");
    map.set(key, node.total ?? 0);
    if (Array.isArray(node.children) && node.children.length > 0) {
      buildCashFlowValueMap(node.children, [...path, node.name], map);
    }
  }

  return map;
};

// Render cash flow report rows recursively
const renderCashFlowRows = (
  nodes,
  level = 0,
  path = [],
  comparisonMaps = [],
  collapsedPaths = new Set(),
  onToggle = () => {}
) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  return nodes.flatMap((node) => {
    const hasChildren =
      Array.isArray(node.children) && node.children.length > 0;
    const pathKey = [...path, node.name].join(">");
    const isCollapsed = collapsedPaths.has(pathKey);
    const comparisonValues = comparisonMaps.map(
      (map) => map?.get(pathKey) ?? 0
    );
    const row = (
      <tr key={pathKey}>
        <td
          className="balance-report-table__name"
          style={{ paddingLeft: `${level * 1.25}rem` }}
        >
          <button
            type="button"
            onClick={() => onToggle(pathKey)}
            disabled={!hasChildren}
            style={{
              marginRight: "0.5rem",
              background: "none",
              border: "none",
              cursor: hasChildren ? "pointer" : "default",
              padding: 0,
              fontSize: "0.9rem",
            }}
            aria-label={
              hasChildren
                ? `${isCollapsed ? "Expand" : "Collapse"} ${node.name}`
                : undefined
            }
          >
            {hasChildren ? (isCollapsed ? "+" : "−") : "\u00a0"}
          </button>
          {node.name}
        </td>
        <td
          className={`balance-report-table__value ${
            (node.total ?? 0) < 0 ? "balance-report-table__value--negative" : ""
          }`}
        >
          {formatCurrency(node.total ?? 0)}
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

    const childrenRows =
      hasChildren && !isCollapsed
        ? renderCashFlowRows(
            node.children,
            level + 1,
            [...path, node.name],
            comparisonMaps,
            collapsedPaths,
            onToggle
          )
        : [];

    return hasChildren ? [row, ...childrenRows] : [row];
  });
};

// Cash Flow Report Component
export default function CashFlowReport({
  reports,
  periodLabels,
  collapsedPaths,
  onTogglePath,
}) {
  const activeReports = Array.isArray(reports)
    ? reports.slice(0, Math.min(periodLabels?.length ?? 1, 3))
    : [];
  const baseReport = activeReports[0];
  const hasReport = Array.isArray(baseReport) && baseReport.length > 0;
  const comparisonMaps = activeReports
    .slice(1)
    .map((report) => buildCashFlowValueMap(report));
  const activeLabels = Array.isArray(periodLabels)
    ? periodLabels.slice(0, activeReports.length)
    : [];

  return (
    <section className="balance-content">
      <h1 className="page__title">Cash Flow Overview</h1>
      {hasReport ? (
        <div className="balance-report">
          <div className="balance-report__header">
            <h2 className="balance-report__title">Cash Flow Summary</h2>
            <span className="balance-report__date">
              {activeLabels[0]
                ? `For ${activeLabels[0]}`
                : "For selected period"}
              {activeLabels.length > 1
                ? ` vs ${activeLabels.slice(1).join(" vs ")}`
                : ""}
            </span>
          </div>
          <table className="balance-report-table">
            <colgroup>
              <col style={{ width: "75%" }} />
              <col />
              {activeLabels.slice(1).map((_, index) => (
                <col key={`cashflow-period-col-${index + 2}`} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th>Category</th>
                <th>{`Amount (${activeLabels[0] ?? "Period 1"})`}</th>
                {activeLabels.slice(1).map((label, index) => (
                  <th
                    key={`cashflow-period-header-${index + 2}`}
                  >{`Amount (${label})`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderCashFlowRows(
                baseReport,
                0,
                [],
                comparisonMaps,
                collapsedPaths,
                onTogglePath
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="balance-report-empty">
          Generate a report to view the cash flow details.
        </p>
      )}
    </section>
  );
}
