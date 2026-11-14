// src/lib/money.ts
// Formats an amount as 263,040.00 (thousands separator, two decimals).
export function formatMoney(amount: number): string {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
