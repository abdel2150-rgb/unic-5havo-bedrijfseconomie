/** Money is always integer cents. Round half away from zero at each posting. */
export const round = (n: number) =>
  Math.sign(n) *
  Math.round(Math.abs(n) + Number.EPSILON * Math.max(1, Math.abs(n)));
export function cents(n: number) {
  const v = round(n * 100);
  if (!Number.isSafeInteger(v)) throw Error("Bedrag buiten bereik");
  return v;
}
export const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    n / 100,
  );
export function parseMoney(raw: string): number | null {
  const s = raw
    .trim()
    .replace(/^€\s*/, "")
    .replace(/\s/g, "")
    .replace(/−/g, "-");
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(s)) return null;
  const [whole, decimal = ""] = s.replace(/\./g, "").split(",");
  const v =
    Number(whole) * 100 +
    (s.startsWith("-") ? -1 : 1) * Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(v) ? v : null;
}
export const inputMoney = (n: number) =>
  (n / 100).toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
export function vat(net: number, rate = 21) {
  return round((net * rate) / 100);
}
export function splitGross(gross: number, rate = 21) {
  const net = round((gross * 100) / (100 + rate));
  return { net, vat: gross - net, gross };
}
export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
