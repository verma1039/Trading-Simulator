export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

export function formatCompactCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

export function formatPercent(value) {
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(2) + "%";
}
