import { balance, ledger, report, type Transaction } from "../lib/finance";
import { cents as c } from "../lib/money";
export const opening = balance({
  equipment: c(6000),
  inventory: c(8000),
  vatIn: c(2940),
  bank: c(9060),
  equity: c(16000),
  loan: c(10000),
});
const definitions: [string, Transaction["kind"], number, number?, number?][] = [
  [
    "Extra sneakers ontvangen op rekening, € 3.000 excl. 21% btw",
    "purchaseCredit",
    3000,
  ],
  [
    "Sneakers geleverd en direct betaald: € 5.000 excl. 21% btw; inkoopwaarde € 2.500",
    "saleCash",
    5000,
    2500,
  ],
  [
    "Sneakers geleverd op rekening: € 4.000 excl. 21% btw; inkoopwaarde € 2.000",
    "saleCredit",
    4000,
    2000,
  ],
  ["Een klant betaalt € 2.420 van de openstaande vordering", "collect", 2420],
  ["Betaling van € 1.815 aan de leverancier", "pay", 1815],
  [
    "Drie maanden huur vooruitbetaald, € 1.200, vrijgesteld van btw",
    "prepay",
    1200,
    undefined,
    0,
  ],
  ["Huur voor januari toegerekend: € 400", "consumePrepaid", 400],
  [
    "Loon voor januari betaald: € 900, geen btw",
    "expenseCash",
    900,
    undefined,
    0,
  ],
  ["Interestkosten januari: € 50; betaling volgt later", "accrueExpense", 50],
  ["Aflossing banklening: € 500", "repay", 500],
  ["Afschrijving inventaris januari: € 100", "depreciation", 100],
  ["Privé-opname: € 300", "withdraw", 300],
  ["Eigenaar stort € 1.000 extra eigen geld", "deposit", 1000],
  [
    "Voorschot ontvangen: € 1.000 excl. 21% btw voor nog te leveren sneakers",
    "advance",
    1000,
  ],
  [
    "Sneakers uit het voorschot geleverd; omzet € 1.000, inkoopwaarde € 500; btw was bij voorschot geboekt",
    "deliverAdvance",
    1000,
    500,
  ],
  ["Betaling van de al geboekte interest: € 50", "payAccrued", 50],
  [
    "Voorraad gekocht en direct betaald: € 1.000 excl. 21% btw",
    "purchaseCash",
    1000,
  ],
  [
    "Sneakers geleverd en direct betaald: € 2.000 excl. 21% btw; inkoopwaarde € 1.000",
    "saleCash",
    2000,
    1000,
  ],
];
export const transactions: Transaction[] = definitions.map(
  ([label, kind, amount, cost, rate], i) => ({
    id: `case-${i + 1}`,
    date: `2027-01-${String(i + 2).padStart(2, "0")}`,
    label,
    kind,
    amount: c(amount),
    cost: cost === undefined ? undefined : c(cost),
    rate,
  }),
);
export const planned = transactions.map((t) => ({ ...t }));
planned[7] = {
  ...planned[7],
  amount: c(800),
  label: "Begroot loon januari: € 800, geen btw",
};
planned[17] = {
  ...planned[17],
  amount: c(2500),
  cost: c(1250),
  label: "Begrote directe verkoop: € 2.500 excl. 21% btw; inkoopwaarde € 1.250",
};
export const finalBalance = ledger(opening, transactions);
export const actualReport = report(transactions);
export const planReport = report(planned);
