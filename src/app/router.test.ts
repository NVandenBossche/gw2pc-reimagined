import { describe, expect, it } from "vitest";
import { parseGold } from "../core/money";
import { parseHash, payLink } from "./router";

describe("payLink", () => {
  it.each([123_456_789, 1_234_550, 4_950, 10_000, 149])("round-trips %i copper rounded to the silver", (c) => {
    const route = parseHash(payLink(c));
    expect(route.name).toBe("pay");
    const amount = route.name === "pay" ? route.amount : undefined;
    expect(parseGold(amount ?? "")).toBe(Math.round(c / 100) * 100);
  });
  it("carries the displayed OTC price text, URL-encoded", () => {
    expect(payLink(1_234_550)).toBe("#/pay?amount=123g%2046s");
  });
});

describe("parseHash pay link", () => {
  it("keeps a readable Payment amount from the link", () => {
    expect(parseHash("#/pay?amount=1234g 50s")).toEqual({ name: "pay", amount: "1234g 50s" });
  });
  it("decodes URL-encoded spaces", () => {
    expect(parseHash("#/pay?amount=1234g%2050s")).toEqual({ name: "pay", amount: "1234g 50s" });
    expect(parseHash("#/pay?amount=1234g+50s")).toEqual({ name: "pay", amount: "1234g 50s" });
  });
  it("accepts a bare gold number", () => {
    expect(parseHash("#/pay?amount=500")).toEqual({ name: "pay", amount: "500" });
  });
  it("drops a missing, empty or unreadable amount", () => {
    expect(parseHash("#/pay")).toEqual({ name: "pay" });
    expect(parseHash("#/pay?amount=")).toEqual({ name: "pay" });
    expect(parseHash("#/pay?amount=abc")).toEqual({ name: "pay" });
    expect(parseHash("#/pay?other=1")).toEqual({ name: "pay" });
  });
  it("tolerates a trailing slash before the query", () => {
    expect(parseHash("#/pay/?amount=5g")).toEqual({ name: "pay", amount: "5g" });
  });
});

describe("parseHash other routes", () => {
  it("leaves them unchanged", () => {
    expect(parseHash("")).toEqual({ name: "home" });
    expect(parseHash("#/")).toEqual({ name: "home" });
    expect(parseHash("#/leg")).toEqual({ name: "leg" });
    expect(parseHash("#/item/ecto")).toEqual({ name: "item", slug: "ecto" });
    expect(parseHash("#/set/t6")).toEqual({ name: "set", slug: "t6" });
    expect(parseHash("#/nope")).toEqual({ name: "notfound" });
  });
});
