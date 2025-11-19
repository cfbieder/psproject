function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const normalized = value.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toDate(value) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

module.exports = {
  toNumber,
  toDate,
};
