import { describe, it, expect } from "vitest";
import { generateCode, conversionRate, totalReward } from "./utils";

describe("generateCode", () => {
  it("returns a URL-safe code of the requested length", () => {
    const code = generateCode(8);
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("produces different codes", () => {
    expect(generateCode()).not.toBe(generateCode());
  });
});

describe("conversionRate", () => {
  it("returns 0 when there are no clicks", () => expect(conversionRate(0, 0)).toBe(0));
  it("computes a percentage with one decimal", () => expect(conversionRate(3, 1)).toBe(33.3));
});

describe("totalReward", () => {
  it("multiplies signups by reward", () => expect(totalReward(4, 2.5)).toBe(10));
});
