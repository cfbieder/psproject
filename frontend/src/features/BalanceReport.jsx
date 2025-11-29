import { useEffect, useRef, useState } from "react";

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
  comparisonMaps = [],
  collapsedPaths = new Set(),
  onToggle = () => {}
) => {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return [];
  }

  return accounts.flatMap((account) => {
    const hasChildren =
      Array.isArray(account.children) && account.children.length > 0;
    const pathKey = [...path, account.name].join(">");
    const isCollapsed = collapsedPaths.has(pathKey);
    const comparisonValues = comparisonMaps.map(
      (map) => map?.get(pathKey) ?? 0
    );
    const row = (
      <tr key={`${account.name}-${level}-${account.totalUSD}`}>
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
                ? `${isCollapsed ? "Expand" : "Collapse"} ${account.name}`
                : undefined
            }
          >
            {hasChildren ? (isCollapsed ? "+" : "−") : "\u00a0"}
          </button>
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

    const childrenRows =
      hasChildren && !isCollapsed
        ? renderAccountRows(
            account.children,
            level + 1,
            [...path, account.name],
            comparisonMaps,
            collapsedPaths,
            onToggle
          )
        : [];

    return hasChildren ? [row, ...childrenRows] : [row];
  });
};

export default function BalanceReport({
  balanceReports,
  periodDates,
  periodCount,
  collapsedPaths = new Set(),
  onTogglePath = () => {},
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
  const [categoryColumnWidth, setCategoryColumnWidth] = useState(260);
  const tableRef = useRef(null);
  const dragCleanup = useRef(() => {});

  useEffect(() => {
    return () => {
      dragCleanup.current();
    };
  }, []);

  const startResizingCategory = (event) => {
    event.preventDefault();
    const tableRect = tableRef.current?.getBoundingClientRect();
    if (!tableRect) {
      return;
    }

    const minWidth = 160;
    const maxWidth = 520;

    const updateWidth = (clientX) => {
      const rect = tableRef.current?.getBoundingClientRect() ?? tableRect;
      if (!rect || rect.width <= 0) {
        return;
      }
      const relativeX = Math.min(Math.max(0, clientX - rect.left), rect.width);
      const clamped = Math.min(maxWidth, Math.max(minWidth, relativeX));
      setCategoryColumnWidth(clamped);
    };

    const handlePointerMove = (moveEvent) => {
      updateWidth(moveEvent.clientX);
    };

    const stopResizing = () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseup", stopResizing);
      dragCleanup.current = () => {};
    };

    dragCleanup.current = stopResizing;

    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", stopResizing);
    updateWidth(event.clientX);
  };

  return (
    <section className="balance-content">
      {hasReport ? (
        <div className="balance-report">
          <div className="balance-report__table-wrapper">
            <table className="balance-report-table" ref={tableRef}>
              <caption className="balance-report-table__caption">
                <div className="balance-report-table__caption-row"></div>
              </caption>
              <colgroup>
                <col style={{ width: `${categoryColumnWidth}px` }} />
                <col />
                {periodLabels.slice(1).map((_, index) => (
                  <col key={`period-col-${index + 2}`} />
                ))}
              </colgroup>
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 11,
                  background: "var(--surface-muted)",
                }}
              >
                <tr>
                  <th
                    className="balance-report-table__category"
                    style={{
                      position: "sticky",
                      top: 0,
                      left: 0,
                      zIndex: 12,
                      background: "#dbe7ff",
                    }}
                  >
                    <span>Account</span>
                    <span
                      className="balance-report-table__column-resizer"
                      role="presentation"
                      onMouseDown={startResizingCategory}
                    />
                  </th>
                  <th>{periodLabels[0] ?? "Period 1"}</th>
                  {periodLabels.slice(1).map((label, index) => (
                    <th key={`period-header-${index + 2}`}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderAccountRows(
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
        </div>
      ) : (
        <p className="balance-report-empty">
          Generate a report to view the balance sheet details.
        </p>
      )}
    </section>
  );
}
