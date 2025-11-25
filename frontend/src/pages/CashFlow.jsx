import { useMemo, useState } from "react";
import NavigationMenu from "../components/NavigationMenu.jsx";
import Rest from "../js/rest.js";
import "./PageLayout.css";
import "../ui/BalanceDateSelector.css";

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

// Recursively collect paths of collapsible nodes
const collectCollapsiblePaths = (nodes, path = [], set = new Set()) => {
  if (!Array.isArray(nodes)) return set;
  for (const node of nodes) {
    if (node && Array.isArray(node.children) && node.children.length > 0) {
      const key = [...path, node.name].join(">");
      set.add(key);
      collectCollapsiblePaths(node.children, [...path, node.name], set);
    }
  }
  return set;
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

// Add "Net cash flow" category if not present
const addNetCashFlowCategory = (nodes) => {
  if (!Array.isArray(nodes)) {
    return [];
  }

  let incomeTotal = 0;
  let expenseTotal = 0;
  let hasNetCashFlow = false;

  const result = nodes.map((node) => {
    if (!node || typeof node !== "object") {
      return node;
    }

    const name = typeof node.name === "string" ? node.name : "";
    const normalized = name.toLowerCase();

    if (normalized === "income") {
      incomeTotal = typeof node.total === "number" ? node.total : 0;
    } else if (normalized === "expense" || normalized === "expenses") {
      expenseTotal = typeof node.total === "number" ? node.total : 0;
    } else if (normalized === "net cash flow") {
      hasNetCashFlow = true;
    }

    return node;
  });

  if (hasNetCashFlow) {
    return result;
  }

  return [
    ...result,
    { name: "Net cash flow", total: incomeTotal + expenseTotal },
  ];
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
const CashFlowReport = ({
  reports,
  periodLabels,
  collapsedPaths,
  onTogglePath,
}) => {
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
};
// Main Cash Flow Page Component
export default function CashFlow() {
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getMonthStart = () => {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    return firstOfMonth.toISOString().split("T")[0];
  };

  const [fromDates, setFromDates] = useState(() => {
    const start = getMonthStart();
    return [start, start, start];
  });
  const [toDates, setToDates] = useState(() => {
    const today = getToday();
    return [today, today, today];
  });
  const [periodCount, setPeriodCount] = useState(1);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState(new Set());
  const [includeUnrealizedGL, setIncludeUnrealizedGL] = useState(false);
  const [transfers, setTransfers] = useState("exclude");

  const handleFromDateChange = (index, value) => {
    setFromDates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleToDateChange = (index, value) => {
    setToDates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleGenerateReport = async () => {
    setError("");
    setIsLoading(true);
    try {
      const clampedPeriodCount = Math.min(Math.max(periodCount ?? 1, 1), 3);
      const activePeriods = Array.from({ length: clampedPeriodCount }).map(
        (_, index) => ({
          fromDate: fromDates[index],
          toDate: toDates[index],
        })
      );
      const data = await Promise.all(
        activePeriods.map(({ fromDate, toDate }) =>
          Rest.fetchCashFlowReport({
            fromDate,
            toDate,
            transfers,
            includeUnrealizedGL,
          })
        )
      );
      setReports(data.map(addNetCashFlowCategory));
      setCollapsedPaths(new Set());
    } catch (err) {
      console.error("Failed to fetch cash flow report:", err);
      setError(err?.message ?? "Failed to fetch cash flow report");
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePath = (pathKey) => {
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
      }
      return next;
    });
  };

  const collapsiblePaths = useMemo(
    () => collectCollapsiblePaths(reports?.[0]),
    [reports]
  );
  const isFullyCollapsed =
    collapsiblePaths.size > 0 && collapsedPaths.size === collapsiblePaths.size;
  const activePeriodCount = Math.min(Math.max(periodCount ?? 1, 1), 3);
  const periodLabels = Array.from({ length: activePeriodCount }).map(
    (_, index) => {
      const fromDate = fromDates[index] ?? "";
      const toDate = toDates[index] ?? "";
      return fromDate && toDate
        ? `${fromDate} to ${toDate}`
        : `Period ${index + 1}`;
    }
  );

  const handleToggleCollapseAll = () => {
    if (collapsiblePaths.size === 0) return;
    setCollapsedPaths((prev) => {
      if (prev.size === collapsiblePaths.size) {
        return new Set();
      }
      return new Set(collapsiblePaths);
    });
  };

  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main balance-grid">
        <div className="balance-layout-wrapper">
          <CashFlowReport
            reports={reports}
            periodLabels={periodLabels}
            collapsedPaths={collapsedPaths}
            onTogglePath={handleTogglePath}
          />
        </div>
        <div className="balance-layout-holder">
          <div className="balance-layout">
            <aside className="balance-panel">
              <div className="balance-date-picker">
                <label
                  htmlFor="cashflow-period-count"
                  className="balance-date-picker__label"
                >
                  Number of Periods
                </label>
                <select
                  id="cashflow-period-count"
                  className="balance-date-picker__input"
                  value={activePeriodCount}
                  onChange={(event) =>
                    setPeriodCount(Number(event.target.value))
                  }
                >
                  {[1, 2, 3].map((count) => (
                    <option key={`cashflow-period-count-${count}`} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
                {Array.from({ length: activePeriodCount }).map((_, index) => {
                  const periodLabel = index + 1;
                  return (
                    <div key={`cashflow-period-${periodLabel}`}>
                      <label
                        htmlFor={`cashflow-from-date-${periodLabel}`}
                        className="balance-date-picker__label"
                      >
                        {`From Date Period ${periodLabel}`}
                      </label>
                      <input
                        id={`cashflow-from-date-${periodLabel}`}
                        type="date"
                        className="balance-date-picker__input"
                        value={fromDates[index] ?? ""}
                        onChange={(event) =>
                          handleFromDateChange(index, event.target.value)
                        }
                      />
                      <label
                        htmlFor={`cashflow-to-date-${periodLabel}`}
                        className="balance-date-picker__label"
                      >
                        {`To Date Period ${periodLabel}`}
                      </label>
                      <input
                        id={`cashflow-to-date-${periodLabel}`}
                        type="date"
                        className="balance-date-picker__input"
                        value={toDates[index] ?? ""}
                        onChange={(event) =>
                          handleToDateChange(index, event.target.value)
                        }
                      />
                    </div>
                  );
                })}
                <label
                  htmlFor="cashflow-include-unrealized"
                  className="balance-date-picker__label"
                >
                  Include Unrealized?
                </label>
                <input
                  id="cashflow-include-unrealized"
                  type="checkbox"
                  className="balance-date-picker__input"
                  checked={includeUnrealizedGL}
                  onChange={(event) =>
                    setIncludeUnrealizedGL(event.target.checked)
                  }
                />
                <label
                  htmlFor="cashflow-transfers"
                  className="balance-date-picker__label"
                >
                  Transfers
                </label>
                <select
                  id="cashflow-transfers"
                  className="balance-date-picker__input"
                  value={transfers}
                  onChange={(event) => setTransfers(event.target.value)}
                >
                  <option value="include">Include</option>
                  <option value="exclude">Exclude</option>
                  <option value="only">Only</option>
                </select>
              </div>
              <button
                className="generate-report-button"
                type="button"
                onClick={handleGenerateReport}
                disabled={isLoading}
              >
                {isLoading ? "Generating..." : "Generate Report"}
              </button>
              <button
                className="generate-report-button"
                type="button"
                onClick={handleToggleCollapseAll}
                disabled={isLoading || collapsiblePaths.size === 0}
              >
                {isFullyCollapsed ? "Expand All" : "Collapse All"}
              </button>
              {error && (
                <p
                  className="balance-report-empty"
                  style={{
                    margin: 0,
                    color: "#fecdd3",
                    fontWeight: 600,
                  }}
                >
                  {error}
                </p>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
