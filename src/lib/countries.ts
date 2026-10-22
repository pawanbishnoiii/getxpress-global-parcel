import { getCountries, getCountryCallingCode } from "libphonenumber-js";

export type Country = { code: string; name: string; dial: string; flag: string };

/** Emoji flag from an ISO-3166 alpha-2 code. */
export function flagOf(code: string) {
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

let cache: Country[] | null = null;
/** Every country with name, ISO code, dialing code and flag, sorted by name. */
export function allCountries(): Country[] {
  if (cache) return cache;
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  cache = getCountries()
    .map((code) => ({ code, name: names.of(code) ?? code, dial: `+${getCountryCallingCode(code)}`, flag: flagOf(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}

/** Search by name, ISO code (IN, US) or dialing code (+91, 44). */
export function searchCountries(q: string, list = allCountries()) {
  const s = q.trim().toLowerCase().replace(/^\+/, "");
  if (!s) return list;
  return list.filter((c) => c.name.toLowerCase().includes(s) || c.code.toLowerCase() === s || c.dial.slice(1).startsWith(s))
    .sort((a, b) => Number(b.code.toLowerCase() === s) - Number(a.code.toLowerCase() === s));
}
