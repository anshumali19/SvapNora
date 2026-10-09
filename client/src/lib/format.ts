export function formatMinor(
  amountMinor: string | number,
  currency: string,
  locale = "en-US",
): string {
  const value = Number(amountMinor);
  try {
    const exponent =
      new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      value / 10 ** exponent,
    );
  } catch {
    return `${currency} ${(value / 100).toFixed(2)}`;
  }
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
