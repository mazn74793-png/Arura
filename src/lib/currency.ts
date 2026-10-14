export const CURRENCY = 'EG';

export function formatPrice(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return `0 ${CURRENCY}`;
  const num = Number(amount);
  if (isNaN(num)) return `0 ${CURRENCY}`;
  return `${num.toLocaleString()} ${CURRENCY}`;
}
