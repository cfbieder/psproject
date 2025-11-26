export default function PeriodCountSelector({
  id = "period-count",
  label = "Number of Periods",
  value,
  onChange,
  options = [1, 2, 3],
  labelClassName = "balance-date-picker__label",
  inputClassName = "balance-date-picker__input",
}) {
  return (
    <>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>

      <select
        id={id}
        className={inputClassName}
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
      >
        {options.map((count) => (
          <option key={`${id}-${count}`} value={count}>
            {count}
          </option>
        ))}
      </select>
    </>
  );
}
