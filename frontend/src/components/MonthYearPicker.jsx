export default function MonthYearPicker({
  monthId,
  yearId,
  monthValue,
  yearValue,
  monthOptions = [],
  yearOptions = [],
  onMonthChange,
  onYearChange,
  rowClassName = "balance-date-picker__row",
  inputClassName = "balance-date-picker__input",
}) {
  return (
    <div className={rowClassName}>
      <select
        id={monthId}
        className={inputClassName}
        value={monthValue ?? ""}
        onChange={(event) => onMonthChange?.(event.target.value)}
      >
        {monthOptions.map((month) => (
          <option key={`${monthId}-${month.value}`} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      <select
        id={yearId}
        className={inputClassName}
        value={yearValue ?? ""}
        onChange={(event) => onYearChange?.(event.target.value)}
      >
        {yearOptions.map((year) => (
          <option key={`${yearId}-${year}`} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
