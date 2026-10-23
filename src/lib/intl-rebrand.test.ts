import { describe, it, expect } from "vitest";
import { rebrand } from "./intl-rates.functions";
describe("international service names", () => {
  it("shows GetXpress.in instead of ShipGlobal", () => {
    expect(rebrand("ShipGlobal Direct")).toBe("GetXpress.in Direct");
    expect(rebrand("Shipglobal Express")).toBe("GetXpress.in Express");
    expect(rebrand("ShipGlobal First Class")).toBe("GetXpress.in First Class");
    expect(rebrand("ShipGlobal Premium")).toBe("GetXpress.in Premium");
  });
});
