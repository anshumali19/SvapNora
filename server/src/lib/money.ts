/**
 * Money utilities.
 *
 * All amounts are stored and manipulated as integer minor units (e.g. cents)
 * to avoid floating-point rounding errors. Formatting is delegated to Intl.
 */

export function currencyExponent(currency: string): number {
  try {
    const parts = new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions();
    return parts.maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** Convert a decimal string/number to integer minor units. */
export function toMinorUnits(amount: string | number, currency: string): bigint {
  const exponent = currencyExponent(currency);
  const value = typeof amount === "string" ? amount.trim() : String(amount);
  if (!/^-?\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole = "0", frac = ""] = unsigned.split(".");
  const fracPadded = (frac + "0".repeat(exponent)).slice(0, exponent);
  const minor = BigInt(whole) * 10n ** BigInt(exponent) + BigInt(fracPadded || "0");
  return negative ? -minor : minor;
}

/** Convert integer minor units to a decimal number for display. */
export function fromMinorUnits(amountMinor: bigint, currency: string): number {
  const exponent = currencyExponent(currency);
  return Number(amountMinor) / 10 ** exponent;
}

/** Format integer minor units as a localized currency string. */
export function formatMinor(
  amountMinor: bigint,
  currency: string,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(fromMinorUnits(amountMinor, currency));
}

/** Normalize a currency code to ISO-4217 uppercase. */
export function normalizeCurrency(currency: string): string {
  return currency.trim().toUpperCase();
}
