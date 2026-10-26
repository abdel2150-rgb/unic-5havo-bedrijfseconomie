import { describe, it, expect } from "vitest";
import {
  cents as c,
  parseMoney,
  splitGross,
  vat,
  round,
} from "../src/lib/money";
import {
  accounts,
  assets,
  liabilities,
  balance,
  posting,
  apply,
  ledger,
  report,
  assertBalance,
  totalAssets,
  totalLiabilities,
  loanSchedule,
  depreciation,
  type Transaction,
  type TxKind,
} from "../src/lib/finance";
import {
  opening,
  transactions,
  finalBalance,
  actualReport,
  planReport,
} from "../src/content/simulation";
const t = (
  kind: TxKind,
  amount: number,
  extra: Partial<Transaction> = {},
): Transaction => ({
  id: "test",
  label: "test",
  date: "2027-01-01",
  kind,
  amount: c(amount),
  ...extra,
});
const b = balance({
  bank: c(20000),
  inventory: c(10000),
  equipment: c(10000),
  receivables: c(1210),
  prepaid: c(900),
  accruedIncome: c(100),
  vatIn: c(210),
  cash: c(100),
  equity: c(23800),
  loan: c(15000),
  creditors: c(2420),
  advances: c(500),
  accruedExpense: c(300),
  vatOut: c(500),
});
describe("Nederlandse bedragen en btw", () => {
  it.each([
    ["1.234,56", 123456],
    ["€ 1.250,50", 125050],
    ["-0,50", -50],
    ["−1.250,00", -125000],
    ["0", 0],
    ["1000", 100000],
  ])("%s wordt %s cent", (raw, amount) => expect(parseMoney(raw)).toBe(amount));
  it.each(["1,234", "1.23", "1e3", "NaN", "1,2,3", "", "1.2345", "€ -"])(
    "weigert ambigue invoer %s",
    (raw) => expect(parseMoney(raw)).toBeNull(),
  );
  it("rekent btw terug zonder een cent te verliezen", () => {
    expect(splitGross(c(121))).toEqual({ net: 10000, vat: 2100, gross: 12100 });
    expect(splitGross(c(109), 9).net).toBe(10000);
    for (let i = 1; i < 10000; i += 7) {
      const s = splitGross(i);
      expect(s.net + s.vat).toBe(i);
    }
    expect(vat(1, 21)).toBe(0);
    expect(round(-1.5)).toBe(-2);
    expect(c(1.005)).toBe(101);
    expect(c(-1.005)).toBe(-101);
  });
});
describe("boekhoudkundige gevolgen", () => {
  it("testfixture sluit", () => expect(() => assertBalance(b)).not.toThrow());
  it("verkoop op rekening scheidt omzet, btw, voorraad en geld", () => {
    const p = posting(t("saleCredit", 1000, { cost: c(600) }));
    expect(p.delta.receivables).toBe(c(1210));
    expect(p.delta.vatOut).toBe(c(210));
    expect(p.delta.inventory).toBe(c(-600));
    expect(p.delta.equity).toBe(c(400));
    expect(p.receipts).toBe(0);
    expect(p.revenue).toBe(c(1000));
    expect(p.costs).toBe(c(600));
  });
  it("contante verkoop kent ontvangst inclusief btw", () => {
    const p = posting(t("saleCash", 1000, { cost: c(600) }));
    expect(p.receipts).toBe(c(1210));
    expect(p.delta.receivables).toBe(0);
    expect(p.result).toBe(c(400));
  });
  it.each(["purchaseCash", "purchaseCredit"] as const)(
    "%s verhoogt voorraad en btw, zonder kosten",
    (kind) => {
      const p = posting(t(kind, 2000));
      expect(p.delta.inventory).toBe(c(2000));
      expect(p.delta.vatIn).toBe(c(420));
      expect(p.costs).toBe(0);
      expect(p.payments).toBe(kind === "purchaseCash" ? c(2420) : 0);
      expect(p.delta.creditors).toBe(kind === "purchaseCredit" ? c(2420) : 0);
    },
  );
  it("aanschaf inventaris is geen directe kostenpost", () => {
    const p = posting(t("purchaseCash", 1000, { asset: "equipment" }));
    expect(p.delta.equipment).toBe(c(1000));
    expect(p.delta.inventory).toBe(0);
    expect(p.costs).toBe(0);
  });
  it("debiteurenbetaling heeft geen tweede omzet", () => {
    const p = posting(t("collect", 1210));
    expect(p.receipts).toBe(c(1210));
    expect(p.delta.receivables).toBe(c(-1210));
    expect(p.revenue).toBe(0);
  });
  it("crediteurenbetaling heeft geen tweede kosten", () => {
    const p = posting(t("pay", 2420));
    expect(p.delta.creditors).toBe(c(-2420));
    expect(p.payments).toBe(c(2420));
    expect(p.costs).toBe(0);
  });
  it.each(["loan", "repay"] as const)("%s verandert geen resultaat", (kind) => {
    const p = posting(t(kind, 500));
    expect(p.result).toBe(0);
    expect(p.delta.loan).toBe(c(kind === "loan" ? 500 : -500));
    expect(p.delta.bank).toBe(p.delta.loan);
  });
  it.each(["deposit", "withdraw"] as const)(
    "%s loopt buiten resultaat",
    (kind) => {
      const p = posting(t(kind, 500));
      expect(p.result).toBe(0);
      expect(p.delta.equity).toBe(c(kind === "deposit" ? 500 : -500));
    },
  );
  it("afschrijving verlaagt boekwaarde en winst maar geen bank", () => {
    const p = posting(t("depreciation", 200));
    expect(p.delta.equipment).toBe(c(-200));
    expect(p.result).toBe(c(-200));
    expect(p.payments).toBe(0);
  });
  it("directe kosten en btw apart", () => {
    const p = posting(t("expenseCash", 100));
    expect(p.payments).toBe(c(121));
    expect(p.costs).toBe(c(100));
    expect(p.delta.vatIn).toBe(c(21));
  });
  it("onbetaalde interest wordt kosten én schuld, daarna betaling zonder kosten", () => {
    const accrual = posting(t("accrueExpense", 60));
    expect(accrual.costs).toBe(c(60));
    expect(accrual.delta.accruedExpense).toBe(c(60));
    expect(accrual.payments).toBe(0);
    const paid = posting(t("payAccrued", 60));
    expect(paid.costs).toBe(0);
    expect(paid.payments).toBe(c(60));
  });
  it("vooruitbetaling en periodetoerekening gescheiden", () => {
    const payment = posting(t("prepay", 900, { rate: 0 }));
    const cost = posting(t("consumePrepaid", 300));
    expect(payment.payments).toBe(c(900));
    expect(payment.costs).toBe(0);
    expect(cost.costs).toBe(c(300));
    expect(cost.payments).toBe(0);
    expect(
      ledger(b, [t("prepay", 900, { rate: 0 }), t("consumePrepaid", 300)])
        .prepaid,
    ).toBe(c(1500));
  });
  it("voorschot boekt btw eenmalig en omzet pas bij levering", () => {
    const first = posting(t("advance", 500));
    const second = posting(t("deliverAdvance", 500, { cost: c(200) }));
    expect(first.receipts).toBe(c(605));
    expect(first.revenue).toBe(0);
    expect(first.delta.advances).toBe(c(500));
    expect(second.revenue).toBe(c(500));
    expect(second.delta.vatOut).toBe(0);
    expect(second.receipts).toBe(0);
  });
  it("te ontvangen bedrag is opbrengst vóór ontvangst", () => {
    expect(posting(t("accrueIncome", 100)).result).toBe(c(100));
    expect(posting(t("receiveAccrued", 100)).revenue).toBe(0);
    expect(posting(t("receiveAccrued", 100)).receipts).toBe(c(100));
  });
  it("kas-bankoverboeking veroorzaakt geen externe geldstroom", () => {
    const p = posting(t("transfer", 100));
    expect(p.receipts).toBe(0);
    expect(p.payments).toBe(0);
    expect(p.delta.cash + p.delta.bank).toBe(0);
  });
  it("btw afrekenen wist beide posten en raakt geen winst", () => {
    const p = posting(t("settleVat", 500, { cost: c(210) }));
    expect(p.payments).toBe(c(290));
    expect(p.result).toBe(0);
    expect(p.delta.vatIn).toBe(c(-210));
    expect(p.delta.vatOut).toBe(c(-500));
    expect(posting(t("settleVat", 100, { cost: c(210) })).receipts).toBe(
      c(110),
    );
  });
  it("verkoop activa boekt alleen boekwinst als resultaat", () => {
    const p = posting(t("sellAsset", 500, { bookValue: c(400) }));
    expect(p.result).toBe(c(100));
    expect(p.delta.equipment).toBe(c(-400));
    expect(p.receipts).toBe(c(605));
  });
  it("alle transactietypen sluiten en koppelen bank aan geldstroom", () => {
    for (const kind of [
      "purchaseCash",
      "purchaseCredit",
      "saleCash",
      "saleCredit",
      "collect",
      "pay",
      "loan",
      "repay",
      "deposit",
      "withdraw",
      "depreciation",
      "expenseCash",
      "accrueExpense",
      "payAccrued",
      "prepay",
      "consumePrepaid",
      "advance",
      "deliverAdvance",
      "accrueIncome",
      "receiveAccrued",
      "transfer",
      "settleVat",
      "sellAsset",
    ] as TxKind[]) {
      const p = posting(t(kind, 100, { cost: c(50), bookValue: c(80) }));
      expect(totalAssets(p.delta), kind).toBe(totalLiabilities(p.delta));
      expect(p.receipts - p.payments).toBe(p.delta.bank + p.delta.cash);
    }
  });
  it("weigert onmogelijke afboekingen en ongeldige bedragen", () => {
    expect(() => apply(b, t("repay", 20000))).toThrow();
    expect(() =>
      apply(b, t("saleCredit", 20000, { cost: c(20000) })),
    ).toThrow();
    expect(() => posting(t("loan", -1))).toThrow();
    expect(() => posting({ ...t("loan", 1), amount: 0.5 })).toThrow();
    expect(() => posting(t("purchaseCash", 1, { rate: NaN }))).toThrow();
    expect(() => posting(t("sellAsset", 10, { bookValue: -1 }))).toThrow();
  });
});
describe("leningen, afschrijving en perioden", () => {
  it("lineair neemt interest af over restschuld", () => {
    const s = loanSchedule(c(12000), 0.05, 4, "linear");
    expect(s[0]).toMatchObject({
      opening: c(12000),
      interest: c(600),
      repayment: c(3000),
      closing: c(9000),
    });
    expect(s[1].interest).toBe(c(450));
    expect(s[3].closing).toBe(0);
  });
  it("annuïteit verschuift van interest naar aflossing", () => {
    const s = loanSchedule(c(12000), 0.05, 4, "annuity");
    expect(s[0].payment).toBe(c(3384.14));
    expect(s[1].interest).toBe(c(460.79));
    expect(s[1].repayment).toBe(c(2923.35));
    expect(s[3].closing).toBe(0);
    expect(s.reduce((a, r) => a + r.repayment, 0)).toBe(c(12000));
  });
  it("restwaarde en deeljaar blijven begrensd", () => {
    expect(depreciation(c(9000), c(1000), 4, 9)).toEqual({
      annual: c(2000),
      accumulated: c(1500),
      bookValue: c(7500),
    });
    expect(depreciation(c(9000), c(1000), 4, 100).bookValue).toBe(c(1000));
  });
  it("rondt de laatste lineaire termijn bij ondeelbare hoofdsom", () =>
    expect(loanSchedule(100, 0.0, 3, "linear").map((r) => r.repayment)).toEqual(
      [33, 33, 34],
    ));
  it("filtert rapport op expliciete periode", () => {
    const one = t("saleCredit", 100, { date: "2027-01-10" });
    const two = t("collect", 121, { date: "2027-02-10" });
    expect(report([one, two], "2027-01")).toMatchObject({
      revenue: c(100),
      receipts: 0,
    });
    expect(report([one, two], "2027-02")).toMatchObject({
      revenue: 0,
      receipts: c(121),
    });
  });
});
describe("doorlopende casus onafhankelijk nagerekend", () => {
  it("18 gebeurtenissen sluiten na elke stap", () => {
    expect(transactions).toHaveLength(18);
    let b = opening;
    for (const t of transactions) {
      b = apply(b, t);
      assertBalance(b);
    }
  });
  it("juiste gerealiseerde geldstromen en winst", () =>
    expect(actualReport).toEqual({
      revenue: c(12000),
      costs: c(7450),
      result: c(4550),
      receipts: c(13100),
      payments: c(5975),
      cashChange: c(7125),
    }));
  it("juiste eindstanden en balanstotaal", () => {
    expect(finalBalance).toEqual(
      balance({
        equipment: c(5900),
        inventory: c(6000),
        receivables: c(2420),
        prepaid: c(800),
        vatIn: c(3780),
        bank: c(16185),
        equity: c(21250),
        loan: c(9500),
        creditors: c(1815),
        vatOut: c(2520),
      }),
    );
    expect(totalAssets(finalBalance)).toBe(c(35085));
  });
  it("begroot en werkelijk blijven afzonderlijk", () => {
    expect(planReport.result).toBe(c(4900));
    expect(opening.bank + planReport.cashChange).toBe(c(16890));
    expect(actualReport.result - planReport.result).toBe(c(-350));
  });
});
