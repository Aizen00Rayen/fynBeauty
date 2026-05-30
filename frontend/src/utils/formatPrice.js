export function formatPrice(amount) {
  if (amount == null) return "";
  const n = new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${n} DZD`;
}

export function discountPercent(original, sale) {
  if (!original || original <= sale) return null;
  return Math.round((1 - sale / original) * 100) + "%";
}
