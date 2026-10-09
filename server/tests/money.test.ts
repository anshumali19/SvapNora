import { describe, expect, it } from "vitest";
import {
  currencyExponent,
  formatMinor,
  fromMinorUnits,
  toMinorUnits,
} from "../src/lib/money";

describe("money", () => {
  it("converts decimal amounts to integer minor units", () => {
    expect(toMinorUnits("10.00", "USD")).toBe(1000n);
    expect(toMinorUnits("0.99", "USD")).toBe(99n);
    expect(toMinorUnits(5, "USD")).toBe(500n);
    expect(toMinorUnits("100", "JPY")).toBe(100n);
  });

  it("round-trips minor units", () => {
    expect(fromMinorUnits(1299n, "USD")).toBeCloseTo(12.99);
  });

  it("knows currency exponents", () => {
    expect(currencyExponent("USD")).toBe(2);
    expect(currencyExponent("JPY")).toBe(0);
  });

  it("formats minor units as currency", () => {
    const formatted = formatMinor(4900n, "USD");
    expect(formatted).toContain("49");
    expect(formatted).toMatch(/\$/);
  });

  it("rejects invalid amounts", () => {
    expect(() => toMinorUnits("abc", "USD")).toThrow();
    expect(() => toMinorUnits("1.2.3", "USD")).toThrow();
  });
});
