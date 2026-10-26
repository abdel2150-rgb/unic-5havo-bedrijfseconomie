import { round, sum, vat } from "./money";
export const accounts = {
  equipment: "Inventaris",
  inventory: "Voorraad",
  receivables: "Debiteuren",
  prepaid: "Vooruitbetaalde bedragen",
  accruedIncome: "Nog te ontvangen bedragen",
  vatIn: "Te vorderen btw",
  bank: "Bank",
  cash: "Kas",
  equity: "Eigen vermogen",
  loan: "Langlopende lening",
  creditors: "Crediteuren",
  advances: "Vooruitontvangen bedragen",
  accruedExpense: "Nog te betalen bedragen",
  vatOut: "Te betalen btw",
  overdraft: "Rekening-courantkrediet",
} as const;
export type Account = keyof typeof accounts;
export const assets: Account[] = [
  "equipment",
  "inventory",
  "receivables",
  "prepaid",
  "accruedIncome",
  "vatIn",
  "bank",
  "cash",
];
export const liabilities: Account[] = [
  "equity",
  "loan",
  "creditors",
  "advances",
  "accruedExpense",
  "vatOut",
  "overdraft",
];
export type Balance = Record<Account, number>;
export const emptyBalance = (): Balance =>
  Object.fromEntries(Object.keys(accounts).map((k) => [k, 0])) as Balance;
export const balance = (values: Partial<Balance>): Balance => ({
  ...emptyBalance(),
  ...values,
});
export const totalAssets = (b: Balance) => sum(assets.map((k) => b[k]));
export const totalLiabilities = (b: Balance) =>
  sum(liabilities.map((k) => b[k]));
export function assertBalance(b: Balance) {
  if (Object.values(b).some((v) => !Number.isSafeInteger(v)))
    throw Error("Geen gehele centen");
  if (totalAssets(b) !== totalLiabilities(b))
    throw Error("De balans sluit niet");
}
export type TxKind =
  | "purchaseCash"
  | "purchaseCredit"
  | "saleCash"
  | "saleCredit"
  | "collect"
  | "pay"
  | "loan"
  | "repay"
  | "deposit"
  | "withdraw"
  | "depreciation"
  | "expenseCash"
  | "accrueExpense"
  | "payAccrued"
  | "prepay"
  | "consumePrepaid"
  | "advance"
  | "deliverAdvance"
  | "accrueIncome"
  | "receiveAccrued"
  | "transfer"
  | "settleVat"
  | "sellAsset";
export interface Transaction {
  id: string;
  date: string;
  label: string;
  kind: TxKind;
  amount: number;
  rate?: number;
  cost?: number;
  asset?: "equipment" | "inventory";
  bookValue?: number;
}
export interface Posting {
  delta: Balance;
  revenue: number;
  costs: number;
  receipts: number;
  payments: number;
  result: number;
}
export function posting(t: Transaction): Posting {
  const d = emptyBalance();
  let revenue = 0,
    costs = 0;
  const a = t.amount;
  if (!Number.isSafeInteger(a) || a < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(t.date))
    throw Error("Ongeldige transactie");
  if (
    t.rate !== undefined &&
    (!Number.isFinite(t.rate) || t.rate < 0 || t.rate > 100)
  )
    throw Error("Ongeldig btw-percentage");
  if (t.cost !== undefined && (!Number.isSafeInteger(t.cost) || t.cost < 0))
    throw Error("Ongeldige inkoopwaarde");
  if (
    t.bookValue !== undefined &&
    (!Number.isSafeInteger(t.bookValue) || t.bookValue < 0)
  )
    throw Error("Ongeldige boekwaarde");
  const tax = vat(a, t.rate ?? 21),
    gross = a + tax;
  switch (t.kind) {
    case "purchaseCash":
    case "purchaseCredit":
      d[t.asset ?? "inventory"] += a;
      d.vatIn += tax;
      if (t.kind === "purchaseCash") d.bank -= gross;
      else d.creditors += gross;
      break;
    case "saleCash":
    case "saleCredit":
      revenue = a;
      costs = t.cost ?? 0;
      d.inventory -= costs;
      d.vatOut += tax;
      if (t.kind === "saleCash") d.bank += gross;
      else d.receivables += gross;
      break;
    case "collect":
      d.bank += a;
      d.receivables -= a;
      break;
    case "pay":
      d.bank -= a;
      d.creditors -= a;
      break;
    case "loan":
      d.bank += a;
      d.loan += a;
      break;
    case "repay":
      d.bank -= a;
      d.loan -= a;
      break;
    case "deposit":
      d.bank += a;
      d.equity += a;
      break;
    case "withdraw":
      d.bank -= a;
      d.equity -= a;
      break;
    case "depreciation":
      d.equipment -= a;
      costs = a;
      break;
    case "expenseCash":
      d.bank -= gross;
      d.vatIn += tax;
      costs = a;
      break;
    case "accrueExpense":
      d.accruedExpense += a;
      costs = a;
      break;
    case "payAccrued":
      d.bank -= a;
      d.accruedExpense -= a;
      break;
    case "prepay":
      d.bank -= gross;
      d.prepaid += a;
      d.vatIn += tax;
      break;
    case "consumePrepaid":
      d.prepaid -= a;
      costs = a;
      break;
    // Advances are net of VAT; VAT is posted at receipt, then not counted again on delivery.
    case "advance":
      d.bank += gross;
      d.advances += a;
      d.vatOut += tax;
      break;
    case "deliverAdvance":
      d.advances -= a;
      revenue = a;
      costs = t.cost ?? 0;
      d.inventory -= costs;
      break;
    case "accrueIncome":
      d.accruedIncome += a;
      revenue = a;
      break;
    case "receiveAccrued":
      d.bank += a;
      d.accruedIncome -= a;
      break;
    case "transfer":
      d.cash -= a;
      d.bank += a;
      break;
    // cost holds the exact input VAT to clear; amount is output VAT to clear.
    case "settleVat":
      d.vatOut -= a;
      d.vatIn -= t.cost ?? 0;
      d.bank += (t.cost ?? 0) - a;
      break;
    case "sellAsset":
      d.equipment -= t.bookValue ?? 0;
      d.bank += gross;
      d.vatOut += tax;
      revenue = a - (t.bookValue ?? 0);
      break;
    default:
      throw Error("Onbekend transactietype");
  }
  if (t.cost !== undefined && (!Number.isSafeInteger(t.cost) || t.cost < 0))
    throw Error("Ongeldige inkoopwaarde");
  const result = revenue - costs;
  d.equity += result;
  assertBalance(d);
  const cashChange = d.bank + d.cash;
  return {
    delta: d,
    revenue,
    costs,
    result,
    receipts: Math.max(0, cashChange),
    payments: Math.max(0, -cashChange),
  };
}
export function apply(b: Balance, t: Transaction): Balance {
  const d = posting(t).delta;
  const next = Object.fromEntries(
    Object.keys(b).map((k) => [k, b[k as Account] + d[k as Account]]),
  ) as Balance;
  assertBalance(next);
  if (Object.entries(next).some(([k, v]) => k !== "equity" && v < 0))
    throw Error(`Onvoldoende saldo of ongeldige afboeking: ${t.label}`);
  return next;
}
export function ledger(start: Balance, tx: Transaction[]) {
  assertBalance(start);
  return tx.reduce((b, t) => apply(b, t), start);
}
export function report(tx: Transaction[], period?: string) {
  const selected = period ? tx.filter((t) => t.date.startsWith(period)) : tx;
  const p = selected.map(posting);
  return {
    revenue: sum(p.map((x) => x.revenue)),
    costs: sum(p.map((x) => x.costs)),
    result: sum(p.map((x) => x.result)),
    receipts: sum(p.map((x) => x.receipts)),
    payments: sum(p.map((x) => x.payments)),
    cashChange: sum(p.map((x) => x.receipts - x.payments)),
  };
}
export function loanSchedule(
  principal: number,
  periodRate: number,
  periods: number,
  kind: "linear" | "annuity",
  fixedPayment?: number,
) {
  if (
    !Number.isSafeInteger(principal) ||
    principal <= 0 ||
    periodRate < 0 ||
    !Number.isFinite(periodRate) ||
    !Number.isInteger(periods) ||
    periods < 1
  )
    throw Error("Ongeldige lening");
  const annuity =
    fixedPayment ??
    round(
      periodRate === 0
        ? principal / periods
        : (principal * periodRate) / (1 - (1 + periodRate) ** -periods),
    );
  let debt = principal;
  return Array.from({ length: periods }, (_, i) => {
    const opening = debt;
    const interest = round(opening * periodRate);
    let repayment =
      kind === "linear"
        ? Math.min(opening, round(principal / periods))
        : Math.min(opening, annuity - interest);
    if (repayment < 0) throw Error("Termijn dekt de interest niet");
    if (i === periods - 1) repayment = opening;
    debt -= repayment;
    return {
      period: i + 1,
      opening,
      interest,
      repayment,
      payment: interest + repayment,
      closing: debt,
    };
  });
}
export function depreciation(
  cost: number,
  residual: number,
  years: number,
  months: number,
) {
  if (cost < residual || residual < 0 || years <= 0 || months < 0)
    throw Error("Ongeldige afschrijving");
  const annual = round((cost - residual) / years);
  const accumulated = Math.min(
    cost - residual,
    round(((cost - residual) * months) / (years * 12)),
  );
  return { annual, accumulated, bookValue: cost - accumulated };
}
