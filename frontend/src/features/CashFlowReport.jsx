import { useEffect, useRef, useState } from "react";

// todo: allow double click on numerical cell which loads a new pop up table with transactions that make up that number
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
    ? reports.slice(
        0,
        Math.min(periodLabels?.length ?? reports.length, reports.length)
      )
    : [];
  const baseReport = activeReports[0];
  const hasReport = Array.isArray(baseReport) && baseReport.length > 0;
  const comparisonMaps = activeReports
    .slice(1)
    .map((report) => buildCashFlowValueMap(report));
  const activeLabels = Array.isArray(periodLabels)
    ? periodLabels.slice(0, activeReports.length)
    : [];
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
              <caption className="balance-report-table__caption"></caption>
              <colgroup>
                <col style={{ width: `${categoryColumnWidth}px` }} />
                <col />
                {activeLabels.slice(1).map((_, index) => (
                  <col key={`cashflow-period-col-${index + 2}`} />
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
                    <span>Category</span>
                    <span
                      className="balance-report-table__column-resizer"
                      role="presentation"
                      onMouseDown={startResizingCategory}
                    />
                  </th>
                  <th>{activeLabels[0] ?? "Period 1"}</th>
                  {activeLabels.slice(1).map((label, index) => (
                    <th key={`cashflow-period-header-${index + 2}`}>{label}</th>
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
        </div>
      ) : (
        <p className="balance-report-empty">
          Generate a report to view the cash flow details.
        </p>
      )}
    </section>
  );
}
