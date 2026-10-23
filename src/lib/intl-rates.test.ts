import { describe, it, expect } from "vitest";
import { basePrice, chargeableKg, withMarkup, zoneFor } from "./intl-rates";
import card from "@/data/intl-rates.json";

const uk = (card as any)["United Kingdom"].rates._;
describe("international pickup rates", () => {
  it("UK 5 kg uses the 5 kg per-kg rate", () => expect(basePrice(uk, 5)).toBe(Math.round(850.78 * 5)));
  it("weight below first slab is charged at the first slab", () => expect(chargeableKg(1.2, uk)).toBe(5));
  it("admin markup is added on top of the base price", () => expect(withMarkup(1000, 10, 50)).toBe(1150));
  it("Canada postal code maps to its FSA zone", () => expect(zoneFor((card as any).Canada, "L0A 1A1")).toBe("Zone 1"));
  it("US state code maps to zone", () => expect(zoneFor((card as any)["United States"], "CA")).toBe("Zone 1"));
});
