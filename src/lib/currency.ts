export const CURRENCIES = [
  { value: "MAD", label: "MAD — Moroccan Dirham" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
];

export function formatCurrency(amount: number, currency: string = "MAD", decimals: number = 2): string {
  const n = amount.toFixed(decimals);
  switch (currency) {
    case "EUR": return `€${n}`;
    case "USD": return `$${n}`;
    case "GBP": return `£${n}`;
    case "AED": return `${n} AED`;
    case "SAR": return `${n} SAR`;
    default:    return `${n} MAD`;
  }
}
