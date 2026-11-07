// Manual thousands separator (avoids relying on Intl support).
export function peso(n: number) {
  return "₱" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
