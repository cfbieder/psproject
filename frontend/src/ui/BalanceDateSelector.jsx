import "./BalanceDateSelector.css";

export default function BalanceDateSelector({
  selectedDate,
  onDateChange,
  onGenerateReport,
  isLoading,
}) {
  return (
    <div className="balance-layout">
      <aside className="balance-panel">
        <div className="balance-date-picker">
          <label htmlFor="balance-date" className="balance-date-picker__label">
            Balance Date
          </label>
          <input
            id="balance-date"
            type="date"
            className="balance-date-picker__input"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>
        <button
          className="generate-report-button"
          type="button"
          onClick={onGenerateReport}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Report"}
        </button>
      </aside>
    </div>
  );
}
