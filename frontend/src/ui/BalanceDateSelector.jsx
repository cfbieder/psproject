import "./BalanceDateSelector.css";

export default function BalanceDateSelector({
  periodDates,
  onPeriodDateChange,
  onGenerateReport,
  isLoading,
  periodCount,
  onPeriodCountChange,
  onToggleCollapseAll,
  collapseToggleLabel,
  collapseToggleDisabled,
}) {
  const normalizedDates = Array.isArray(periodDates) ? periodDates : [];
  const clampedPeriodCount = Math.min(Math.max(periodCount ?? 1, 1), 3);

  return (
    <div className="balance-layout">
      <aside className="balance-panel">
        <div className="balance-date-picker">
          <label
            htmlFor="balance-date-period-count"
            className="balance-date-picker__label"
          >
            Number of Periods
          </label>
          <select
            id="balance-date-period-count"
            className="balance-date-picker__input"
            value={clampedPeriodCount}
            onChange={(event) =>
              onPeriodCountChange?.(Number(event.target.value))
            }
          >
            {[1, 2, 3].map((count) => (
              <option key={`balance-period-count-${count}`} value={count}>
                {count}
              </option>
            ))}
          </select>
          {Array.from({ length: clampedPeriodCount }).map((_, index) => {
            const periodLabel = index + 1;
            const inputId = `balance-date-period-${periodLabel}`;
            return (
              <div key={inputId}>
                <label htmlFor={inputId} className="balance-date-picker__label">
                  {`Balance Date Period ${periodLabel}`}
                </label>
                <input
                  id={inputId}
                  type="date"
                  className="balance-date-picker__input"
                  value={normalizedDates[index] ?? ""}
                  onChange={(event) =>
                    onPeriodDateChange?.(index, event.target.value)
                  }
                />
              </div>
            );
          })}
        </div>
        <button
          className="generate-report-button"
          type="button"
          onClick={onGenerateReport}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Report"}
        </button>
        <button
          className="generate-report-button"
          type="button"
          onClick={onToggleCollapseAll}
          disabled={collapseToggleDisabled}
        >
          {collapseToggleLabel}
        </button>
      </aside>
    </div>
  );
}
