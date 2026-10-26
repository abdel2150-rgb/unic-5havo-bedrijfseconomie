import register from "./register.json" with { type: "json" };
import type { Exercise, Field } from "../lib/exercises";
import {
  accounts,
  assets,
  balance,
  emptyBalance,
  ledger,
  posting,
  report,
  loanSchedule,
  depreciation,
  type Balance,
  type Transaction,
} from "../lib/finance";
import { cents as c, euro, sum, vat } from "../lib/money";
import {
  opening,
  transactions,
  planned,
  finalBalance,
  actualReport,
  planReport,
} from "./simulation";
const sourceRefs: Record<string, number> = {
  "3.1-sort": 3,
  "3.1-invest": 1,
  "3.1-finance": 4,
  "3.1-opening": 5,
  "3.1-credit": 5,
  "3.1-purchase": 6,
  "3.1-repayment": 6,
  "3.1-contribution": 39,
  "3.1-equity": 8,
  "3.1-vat9": 8,
  "3.2-cash-sale": 14,
  "3.2-credit-sale": 14,
  "3.2-collect": 14,
  "3.2-cash-purchase": 14,
  "3.2-pay": 14,
  "3.2-stock": 11,
  "3.2-receipts": 10,
  "3.2-creditors": 18,
  "3.2-markup": 13,
  "3.2-explain": 9,
  "3.3-cost-matrix": 20,
  "3.3-income-matrix": 9,
  "3.3-linear": 23,
  "3.3-annuity": 24,
  "3.3-depreciation": 27,
  "3.3-advance-interest": 22,
  "3.3-arrears": 22,
  "3.3-private": 39,
  "3.3-loan": 21,
  "3.3-life": 27,
  "3.3-partial-year": 28,
  "3.3-accrual": 26,
  "3.4-liquidity": 32,
  "3.4-exploitation": 34,
  "3.4-results": 35,
  "3.4-ending": 38,
  "3.4-mutations": 40,
  "3.4-receivables": 45,
  "3.4-reconciliation": 39,
  "3.4-vat-settlement": 6,
};
export const categories = [
  "Activa · vaste activa",
  "Activa · vlottende activa",
  "Activa · liquide middelen",
  "Passiva · eigen vermogen",
  "Passiva · lang vreemd vermogen",
  "Passiva · kort vreemd vermogen",
];
const M = (
  id: string,
  label: string,
  amount: number,
  diagnosis?: string,
): Field => ({ id, label, kind: "money", answer: amount, diagnosis });
const Q = (
  id: string,
  label: string,
  answer: string,
  options: string[],
  diagnosis?: string,
): Field => ({ id, label, kind: "choice", answer, options, diagnosis });
const euroFields = (rows: [string, number, string?][]) =>
  rows.map(([label, n, d], i) => M(`f${i}`, label, c(n), d));
const yn = ["Ja", "Nee"];
function E(
  module: string,
  id: string,
  title: string,
  goal: string[],
  prompt: string,
  fields: Field[],
  explanation: string,
  formula: string,
  kind: Exercise["kind"] = "table",
  level: 1 | 2 | 3 = 2,
): Exercise {
  return {
    id: `${module}-${id}`,
    module,
    title,
    goal,
    kind,
    prompt,
    fields,
    explanation,
    hints: [
      "Bepaal eerst: gaat dit over een balansstand, een geldstroom of een periodebedrag?",
      formula,
      `Begin bij ${fields[0]?.label}: ${typeof fields[0]?.answer === "number" ? euro(fields[0].answer) : fields[0]?.answer}. ${explanation}`,
    ],
    source:
      "Eigen parallelopgave; inhoudelijke aansluiting: Cumulus hoofdstuk 3.",
    level,
    active: true,
  };
}
export function mutationFields(d: Balance): Field[] {
  return Object.entries(accounts).map(([key, label]) =>
    M(
      key,
      label + " · mutatie",
      d[key as keyof Balance],
      key === "equity"
        ? "profit-equity"
        : key === "vatIn" || key === "vatOut"
          ? "vat-side"
          : "sign",
    ),
  );
}
export function balanceFields(b: Balance): Field[] {
  return Object.entries(accounts).map(([key, label]) =>
    M(
      key,
      label,
      b[key as keyof Balance],
      key === "equity" ? "profit-equity" : "begin-end",
    ),
  );
}
const tx = (
  kind: Transaction["kind"],
  amount: number,
  cost?: number,
  rate?: number,
): Transaction => ({
  id: "one",
  date: "2027-01-15",
  label: "Transactie",
  kind,
  amount: c(amount),
  cost: cost === undefined ? undefined : c(cost),
  rate,
});
const radar = (
  module: string,
  id: string,
  title: string,
  t: Transaction,
  description: string,
) => {
  const p = posting(t);
  const focus =
    t.kind === "repay" || t.kind === "loan"
      ? ["lening"]
      : t.kind === "depreciation"
        ? ["afschrijving", "kosten"]
        : t.kind === "accrueExpense"
          ? ["kosten", "overlopend"]
          : t.kind === "purchaseCredit"
            ? ["voorraad", "krediet", "btw"]
            : t.kind === "collect"
              ? ["omzet", "krediet"]
              : ["omzet"];
  return E(
    module,
    id,
    title,
    ["mutaties", "geldstromen", ...focus],
    description +
      " Voeg alleen de balansposten toe die veranderen. Noteer de mutaties met een minteken bij een afname.",
    [
      ...mutationFields(p.delta),
      M("receipt", "Ontvangst", p.receipts, "credit-cash"),
      M("revenue", "Opbrengst", p.revenue, "collect"),
      M("cost", "Kosten", p.costs, "stock"),
      M("payment", "Uitgave", p.payments, "repay"),
      M("result", "Resultaat", p.result, "cash-profit"),
    ],
    `De resultaatmutatie is opbrengst minus kosten. De bank verandert alleen bij een daadwerkelijke betaling. ${euro(p.revenue)} opbrengst − ${euro(p.costs)} kosten = ${euro(p.result)} resultaat. Btw staat afzonderlijk op de balans.`,
    "Scheid levering, btw en betaling. Teken de mutaties aan beide balanszijden.",
    "radar",
  );
};
export function exercises(variant = 1): Exercise[] {
  const v = variant;
  const ev = 16000 * v,
    loan = 10000 * v;
  const start = balance({
    equipment: c(6000 * v),
    inventory: c(8000 * v),
    vatIn: c(2940 * v),
    bank: c(9060 * v),
    equity: c(ev),
    loan: c(loan),
  });
  const x: Exercise[] = [];
  x.push(
    E(
      "3.1",
      "sort",
      "Geef elke post een plek",
      ["balans", "krediet"],
      "Sleep de posten naar hun categorie, of kies de categorie met het toetsenbord.",
      [
        ["Inventaris", 0],
        ["Voorraad", 1],
        ["Debiteuren", 1],
        ["Vooruitbetaalde huur", 1],
        ["Te vorderen btw", 1],
        ["Bank", 2],
        ["Kas", 2],
        ["Eigen inbreng", 3],
        ["Lening met looptijd vijf jaar", 4],
        ["Crediteuren", 5],
        ["Vooruitontvangen bedragen", 5],
        ["Te betalen btw", 5],
      ].map(([label, index], i) =>
        Q(
          `s${i}`,
          label as string,
          categories[index as number],
          categories,
          index === 1
            ? "stock"
            : i === 2
              ? "debcred"
              : i === 3
                ? "prepaid"
                : "balance-side",
        ),
      ),
      "Activa zijn bezittingen en rechten. Passiva verklaren de financiering. Een vordering is iets anders dan een schuld.",
      "Orden activa van vaste activa via vlottende activa naar liquide middelen.",
      "sort",
      1,
    ),
  );
  x.push(
    E(
      "3.1",
      "invest",
      "Een sneakerzaak starten",
      ["investeren", "btw"],
      `Studio Sole investeert in inventaris van ${euro(c(7260 * v))} inclusief 21% btw en voorraad van ${euro(c(8000 * v))} exclusief 21% btw. Er moet ${euro(c(9060 * v))} op de bank overblijven. Stel de investeringsbegroting op.`,
      euroFields([
        ["Inventaris exclusief btw", 6000 * v, "gross-back"],
        ["Voorraad exclusief btw", 8000 * v, "vat-double"],
        ["Te vorderen btw", 2940 * v, "vat-side"],
        ["Bankbuffer", 9060 * v],
        ["Totale investering", 26000 * v, "vat-double"],
      ]),
      "De inventaris is € 6.000 per variantfactor. Btw over inventaris en voorraad komt als vordering apart op de begroting. De bankbuffer is ook een investering.",
      "Inclusief ÷ 1,21 = exclusief; btw = inventaris × 21% + voorraad × 21%.",
    ),
  );
  x.push(
    E(
      "3.1",
      "finance",
      "Sluit de financiering",
      ["financieren"],
      `De investeringsbehoefte is ${euro(c(26000 * v))}. De eigenaar brengt ${euro(c(ev))} in. Er is geen leverancierskrediet. Vul de financieringsbegroting in.`,
      euroFields([
        ["Eigen vermogen", ev],
        ["Benodigde langlopende lening", loan, "loan-revenue"],
        ["Kort vreemd vermogen", 0],
        ["Totale financiering", 26000 * v],
      ]),
      "De lening vult het verschil tussen de totale behoefte en eigen vermogen. Het is financiering, geen omzet.",
      "Lening = investeringsbehoefte − eigen inbreng.",
    ),
  );
  x.push(
    E(
      "3.1",
      "opening",
      "Bouw de hele beginbalans",
      ["balans", "investeren", "financieren"],
      `Zet deze gegevens in de beginbalans: inventaris ${euro(start.equipment)}, voorraad ${euro(start.inventory)}, btw-vordering ${euro(start.vatIn)}, bank ${euro(start.bank)}, eigen inbreng ${euro(start.equity)}, lening vijf jaar ${euro(start.loan)}. Laat posten zonder bedrag leeg.`,
      balanceFields(start),
      "Activa en passiva zijn beide gelijk aan de totale financiering. Btw is een aparte vordering.",
      "Tel de activa op en controleer: totaal activa = eigen vermogen + schulden.",
    ),
  );
  const creditOptions = [
    "Verstrekt leverancierskrediet",
    "Ontvangen leverancierskrediet",
    "Verstrekt afnemerskrediet",
    "Ontvangen afnemerskrediet",
  ];
  x.push(
    E(
      "3.1",
      "credit",
      "Wie geeft wie krediet?",
      ["krediet"],
      "Classificeer de vier situaties vanuit jouw onderneming.",
      [
        Q(
          "c1",
          "Klant betaalt later voor al geleverde schoenen",
          creditOptions[0],
          creditOptions,
          "debcred",
        ),
        Q(
          "c2",
          "Jij betaalt later voor ontvangen voorraad",
          creditOptions[1],
          creditOptions,
          "debcred",
        ),
        Q(
          "c3",
          "Jij betaalt een leverancier vóór levering",
          creditOptions[2],
          creditOptions,
          "prepaid",
        ),
        Q(
          "c4",
          "Een klant betaalt jou vóór levering",
          creditOptions[3],
          creditOptions,
          "advance",
        ),
      ],
      "Bij leverancierskrediet wordt eerst geleverd, bij afnemerskrediet eerst betaald. Kijk vervolgens wie het krediet verstrekt.",
      "Eerst levering? Leverancierskrediet. Eerst betaling? Afnemerskrediet.",
      "matrix",
      1,
    ),
  );
  x.push(
    radar(
      "3.1",
      "purchase",
      "Voorraad op rekening",
      tx("purchaseCredit", 1000 * v),
      `Er wordt ${euro(c(1000 * v))} voorraad exclusief 21% btw geleverd op rekening.`,
    ),
  );
  x.push(
    radar(
      "3.1",
      "repayment",
      "De eerste aflossing",
      tx("repay", 500 * v),
      `Er wordt ${euro(c(500 * v))} op de langlopende lening afgelost per bank.`,
    ),
  );
  x.push(
    radar(
      "3.1",
      "contribution",
      "Eigen geld in de zaak",
      tx("deposit", 750 * v),
      `De eigenaar stort ${euro(c(750 * v))} eigen spaargeld op de zakelijke bankrekening.`,
    ),
  );
  x.push(
    E(
      "3.1",
      "equity",
      "Het ontbrekende vermogen",
      ["balans", "financieren"],
      `Inventaris ${euro(c(12000 * v))}, voorraad ${euro(c(6000 * v))}, bank ${euro(c(2000 * v))}, lening vijf jaar ${euro(c(9000 * v))}, crediteuren ${euro(c(3000 * v))}. Btw buiten beschouwing. Bepaal het eigen vermogen.`,
      euroFields([
        ["Totaal activa", 20000 * v],
        ["Totaal vreemd vermogen", 12000 * v],
        ["Eigen vermogen", 8000 * v, "profit-equity"],
      ]),
      "Eigen vermogen is het verschil tussen alle bezittingen en alle schulden.",
      "EV = activa − vreemd vermogen.",
    ),
  );
  x.push(
    E(
      "3.1",
      "plan",
      "Het ondernemingsplan",
      ["financieren"],
      "Een ondernemer beschrijft motivatie, doelgroep en begrotingen. Koppel elk onderdeel aan het juiste plan.",
      [
        Q("p1", "Motivatie en kwaliteiten", "Persoonlijk plan", [
          "Persoonlijk plan",
          "Marketingplan",
          "Financieel plan",
        ]),
        Q("p2", "Doelgroep en promotie", "Marketingplan", [
          "Persoonlijk plan",
          "Marketingplan",
          "Financieel plan",
        ]),
        Q("p3", "Investeringen en financiering", "Financieel plan", [
          "Persoonlijk plan",
          "Marketingplan",
          "Financieel plan",
        ]),
      ],
      "Het persoonlijke plan gaat over de ondernemer, het marketingplan over de markt en het financiële plan over de financiële haalbaarheid.",
      "Kijk of het onderwerp de persoon, de klant of het geld is.",
      "matrix",
      1,
    ),
  );
  x.push(
    E(
      "3.1",
      "vat9",
      "Twee btw-tarieven",
      ["btw", "investeren"],
      `Een lunchzaak koopt voorraad voor ${euro(c(1090 * v))} inclusief 9% btw en inventaris voor ${euro(c(2420 * v))} inclusief 21% btw. Bereken de netto-investering en btw.`,
      euroFields([
        ["Voorraad excl. 9% btw", 1000 * v, "gross-back"],
        ["Inventaris excl. 21% btw", 2000 * v, "gross-back"],
        ["Te vorderen btw totaal", 510 * v, "vat-side"],
        ["Totaal te financieren", 3510 * v, "vat-double"],
      ]),
      "Elk factuurbedrag heeft een eigen terugrekenfactor. Tel de btw-bedragen pas daarna op.",
      "Deel respectievelijk door 1,09 en 1,21.",
    ),
  );
  x.push(
    E(
      "3.1",
      "order",
      "Liquiditeitsvolgorde",
      ["balans"],
      "Kies de juiste volgorde van de drie groepen aan iedere balanszijde.",
      [
        Q("a", "Activa", "Vast → vlottend → liquide", [
          "Vast → vlottend → liquide",
          "Liquide → vast → vlottend",
          "Vlottend → liquide → vast",
        ]),
        Q("b", "Passiva", "Eigen → lang vreemd → kort vreemd", [
          "Eigen → lang vreemd → kort vreemd",
          "Kort vreemd → lang vreemd → eigen",
          "Lang vreemd → eigen → kort vreemd",
        ]),
      ],
      "De volgorde begint bij middelen die het langst vastzitten en vermogen dat het langst beschikbaar blijft.",
      "Van lang naar kort.",
      "matrix",
      1,
    ),
  );
  x.push(
    radar(
      "3.2",
      "cash-sale",
      "Direct verkocht en betaald",
      tx("saleCash", 1000 * v, 600 * v),
      `Sneakers worden geleverd voor ${euro(c(1000 * v))} exclusief 21% btw en direct per bank betaald. De inkoopwaarde is ${euro(c(600 * v))}.`,
    ),
  );
  x.push(
    radar(
      "3.2",
      "credit-sale",
      "Levering nu, betaling later",
      tx("saleCredit", 1500 * v, 900 * v),
      `Levering op rekening: ${euro(c(1500 * v))} exclusief 21% btw. Inkoopwaarde: ${euro(c(900 * v))}.`,
    ),
  );
  x.push(
    radar(
      "3.2",
      "collect",
      "Een debiteur betaalt",
      tx("collect", 1210 * v),
      `Een klant betaalt de volledige oude factuur van ${euro(c(1210 * v))} inclusief btw. De levering en omzet zijn al eerder geboekt.`,
    ),
  );
  x.push(
    radar(
      "3.2",
      "cash-purchase",
      "Voorraad ontvangen en betaald",
      tx("purchaseCash", 800 * v),
      `Voorraad ${euro(c(800 * v))} exclusief 21% btw wordt geleverd en direct betaald.`,
    ),
  );
  x.push(
    radar(
      "3.2",
      "pay",
      "De leverancier betalen",
      tx("pay", 968 * v),
      `Een eerder geboekte inkoopfactuur van ${euro(c(968 * v))} wordt betaald per bank.`,
    ),
  );
  x.push(
    E(
      "3.2",
      "stock",
      "Waar bleef de voorraad?",
      ["voorraad", "omzet"],
      `Beginvoorraad ${euro(c(5000 * v))}, inkopen ${euro(c(3000 * v))}, omzet ${euro(c(6000 * v))}. De inkoopwaarde is 60% van de omzet. Alle bedragen exclusief btw.`,
      euroFields([
        ["Inkoopwaarde omzet", 3600 * v, "stock"],
        ["Eindvoorraad", 4400 * v, "stock"],
        ["Brutowinst", 2400 * v, "margin"],
      ]),
      "De voorraad daalt door de inkoopwaarde van verkochte goederen, niet door de verkoopprijs.",
      "Eindvoorraad = begin + inkopen − inkoopwaarde; brutowinst = omzet − inkoopwaarde.",
    ),
  );
  x.push(
    E(
      "3.2",
      "receipts",
      "Een maand opschuiven",
      ["geldstromen", "omzet"],
      `Omzet januari ${euro(c(10000 * v))}, februari ${euro(c(12000 * v))}. Steeds 40% direct betaald, 60% op rekening met één maand krediet. Levering in de verkoopmaand. Btw 21%. Bereken februari.`,
      euroFields([
        ["Omzet februari", 12000 * v],
        ["Directe ontvangsten februari", 5808 * v, "credit-cash"],
        ["Ontvangsten van januaridebiteuren", 7260 * v, "period"],
        ["Totale ontvangsten februari", 13068 * v, "cash-profit"],
        ["Debiteuren einde februari", 8712 * v, "inclusive"],
      ]),
      "Ontvangsten bestaan uit het contante deel van februari plus het kredietdeel van januari.",
      "0,4 × februariverkopen × 1,21 + 0,6 × januariverkopen × 1,21.",
    ),
  );
  x.push(
    E(
      "3.2",
      "creditors",
      "Twee maanden leverancierskrediet",
      ["geldstromen", "btw"],
      `Inkopen januari ${euro(c(4000 * v))}, februari ${euro(c(5000 * v))}, maart ${euro(c(6000 * v))}, exclusief 21% btw. 25% direct betaald, 75% na twee maanden. Bereken maart.`,
      euroFields([
        ["Contante uitgaven maart", 1815 * v],
        ["Betaling januaricrediteuren", 3630 * v, "period"],
        ["Totale uitgaven aan leveranciers", 5445 * v, "period"],
        ["Crediteuren einde maart", 9982.5 * v, "inclusive"],
      ]),
      "In maart betaal je 25% van maart en 75% van januari. Het kredietdeel van februari en maart staat nog open.",
      "Betaling = (0,25 × maart + 0,75 × januari) × 1,21.",
    ),
  );
  x.push(
    E(
      "3.2",
      "markup",
      "Opslag op de inkoopprijs",
      ["omzet"],
      `Een sneaker kost ${euro(c(80 * v))} exclusief btw. De opslag is 50% van de inkoopprijs. Btw 21%.`,
      euroFields([
        ["Verkoopprijs exclusief btw", 120 * v, "margin"],
        ["Brutowinst per sneaker", 40 * v, "margin"],
        ["Verkoopprijs inclusief btw", 145.2 * v, "gross-back"],
      ]),
      "50% opslag betekent dat de inkoopprijs 100% is en de verkoopprijs 150%.",
      "Verkoopprijs excl. = inkoopprijs × 1,50.",
    ),
  );
  x.push(
    E(
      "3.2",
      "explain",
      "Een ontvangst zonder opbrengst",
      ["geldstromen", "omzet"],
      "Welke balanspost daalt bij betaling van een oude vordering door een klant? Vul één begrip in.",
      [
        {
          id: "term",
          label: "De balanspost",
          kind: "text",
          answer: "debiteuren",
          alternatives: [
            "debiteur",
            "vorderingen op klanten",
            "handelsdebiteuren",
          ],
          diagnosis: "collect",
        },
      ],
      "De vordering op de klant verdwijnt. De bank neemt toe, maar de omzet wordt niet opnieuw geboekt.",
      "Denk aan het bedrag dat klanten jou nog schuldig zijn.",
      "open",
      1,
    ),
  );
  const annual = depreciation(c(6000 * v), c(1000 * v), 5, 24);
  x.push(
    E(
      "3.3",
      "cost-matrix",
      "Kosten of uitgaven?",
      ["kosten", "geldstromen"],
      `In januari: ${euro(c(900 * v))} huur betalen voor januari–maart; ${euro(c(500 * v))} aflossen; ${euro(c(100 * v))} afschrijven; ${euro(c(50 * v))} interest over januari betalen. Btw buiten beschouwing.`,
      euroFields([
        ["Huurkosten januari", 300 * v, "prepayment"],
        ["Huuruitgave januari", 900 * v, "prepayment"],
        ["Kosten aflossing", 0, "repay"],
        ["Uitgave aflossing", 500 * v, "repay"],
        ["Kosten afschrijving", 100 * v, "depreciation"],
        ["Uitgave afschrijving", 0, "depreciation"],
        ["Interestkosten januari", 50 * v, "interest"],
        ["Interestuitgave januari", 50 * v],
      ]),
      "Huurkosten worden over drie maanden verdeeld. Aflossing is alleen uitgave; afschrijving alleen kosten.",
      "Stel per gebeurtenis twee vragen: wordt er betaald, en welk verbruik hoort bij januari?",
      "matrix",
    ),
  );
  x.push(
    E(
      "3.3",
      "income-matrix",
      "Opbrengst of ontvangst?",
      ["omzet", "geldstromen"],
      `Geleverd op rekening: ${euro(c(1000 * v))} excl. 21% btw. Ontvangen oude vordering: ${euro(c(605 * v))}. Ontvangen voorschot: ${euro(c(242 * v))} incl. 21% btw voor levering volgende maand.`,
      euroFields([
        ["Opbrengst levering op rekening", 1000 * v, "credit-cash"],
        ["Ontvangst levering op rekening", 0, "credit-cash"],
        ["Opbrengst oude vordering", 0, "collect"],
        ["Ontvangst oude vordering", 605 * v, "collect"],
        ["Opbrengst voorschot", 0, "advance"],
        ["Ontvangst voorschot", 242 * v, "advance"],
      ]),
      "Alleen de levering vormt nu opbrengst. De oude factuur en het voorschot vormen ontvangsten.",
      "Kijk voor opbrengsten naar de levering, voor ontvangsten naar de bank.",
      "matrix",
    ),
  );
  for (const kind of ["linear", "annuity"] as const) {
    const rows = loanSchedule(c(12000 * v), 0.05, 4, kind);
    x.push(
      E(
        "3.3",
        kind,
        kind === "linear"
          ? "Bouw een lineair schema"
          : "Bouw een annuïteitenschema",
        ["lening"],
        `Lening ${euro(c(12000 * v))}, looptijd vier jaar, 5% per jaar. Betaling aan het einde van elk jaar. ${kind === "annuity" ? `De jaarannuïteit is ${euro(rows[0].payment)}; de laatste betaling corrigeert afronding.` : "Elk jaar een gelijke aflossing."} Vul de eerste twee jaren in.`,
        rows
          .slice(0, 2)
          .flatMap((r) => [
            M(
              `opening${r.period}`,
              `Jaar ${r.period} · beginschuld`,
              r.opening,
              "rate",
            ),
            M(
              `interest${r.period}`,
              `Jaar ${r.period} · interest`,
              r.interest,
              "rate",
            ),
            M(
              `repay${r.period}`,
              `Jaar ${r.period} · aflossing`,
              r.repayment,
              "repay",
            ),
            M(
              `closing${r.period}`,
              `Jaar ${r.period} · eindschuld`,
              r.closing,
              "interest",
            ),
          ]),
        "Interest wordt berekend over de beginschuld. Alleen de aflossing verlaagt die schuld. Rond elke geboekte interest af op centen.",
        "Interest = beginschuld × 5%; aflossing = termijn − interest bij een annuïteit.",
        "schedule",
      ),
    );
  }
  x.push(
    E(
      "3.3",
      "depreciation",
      "Van aanschaf naar boekwaarde",
      ["afschrijving"],
      `Inventaris kost ${euro(c(7260 * v))} inclusief 21% btw. Restwaarde ${euro(c(1000 * v))} exclusief btw, economische levensduur vijf jaar, technische levensduur acht jaar. Bereken na twee volledige jaren.`,
      [
        M("annual", "Jaarlijkse afschrijving", annual.annual, "residual"),
        M("book", "Boekwaarde na twee jaar", annual.bookValue, "residual"),
        M("expense", "Uitgave op het afschrijfmoment", 0, "depreciation"),
      ],
      "Gebruik de economische levensduur en trek de restwaarde eerst af. Afschrijven is geen nieuwe betaling.",
      "(Aanschaf exclusief btw − restwaarde) ÷ economische levensduur.",
    ),
  );
  x.push(
    E(
      "3.3",
      "advance-interest",
      "Interest vooruit",
      ["lening", "overlopend"],
      `Schuld vóór 1 januari: ${euro(c(42000 * v))}. Op 1 januari wordt ${euro(c(2000 * v))} afgelost en daarna 3% halfjaarinterest vooruitbetaald voor januari–juni. Btw niet van toepassing. Bereken januari en de stand eind maart.`,
      euroFields([
        ["Schuld na aflossing", 40000 * v],
        ["Interestuitgave op 1 januari", 1200 * v, "rate"],
        ["Interestkosten januari", 200 * v, "prepayment"],
        ["Vooruitbetaalde interest eind maart", 600 * v, "prepaid"],
        ["Totale uitgaven op 1 januari", 3200 * v, "repay"],
      ]),
      "Door aflossing vóór de interestbetaling is de grondslag lager. Eind maart zijn drie van de zes maanden verbruikt.",
      "Eerst schuld na aflossing; dan × 3%; kosten = halfjaarbedrag ÷ 6.",
    ),
  );
  x.push(
    E(
      "3.3",
      "arrears",
      "Interest achteraf",
      ["lening", "overlopend"],
      `Schuld ${euro(c(24000 * v))}, jaarrente 6%. Interest januari–juni wordt op 30 juni achteraf betaald, samen met ${euro(c(4000 * v))} aflossing. Er zijn eerder geen aflossingen.`,
      euroFields([
        ["Interestkosten januari", 120 * v, "rate"],
        ["Interestuitgave januari", 0, "prepayment"],
        ["Nog te betalen interest eind maart", 360 * v, "period"],
        ["Totale betaling op 30 juni", 4720 * v, "repay"],
        ["Schuld na 30 juni", 20000 * v],
      ]),
      "Kosten ontstaan maandelijks, betaling pas eind juni. Tot dat moment bouwt een schuld op.",
      "Interest = € 24.000 per variantfactor × 6% × maanden/12.",
    ),
  );
  x.push(
    radar(
      "3.3",
      "private",
      "Een privé-opname",
      tx("withdraw", 400 * v),
      `De eigenaar neemt ${euro(c(400 * v))} per bank op voor een privévakantie.`,
    ),
  );
  x.push(
    radar(
      "3.3",
      "loan",
      "Lenen is geen verdienen",
      tx("loan", 5000 * v),
      `De bank verstrekt een lening van ${euro(c(5000 * v))} met een looptijd van vijf jaar, ontvangen op de bankrekening.`,
    ),
  );
  x.push(
    E(
      "3.3",
      "life",
      "Welke levensduur?",
      ["afschrijving"],
      "Een machine functioneert tien jaar. Na zes jaar wordt onderhoud zo duur dat gebruik niet meer verantwoord is.",
      [
        Q(
          "economic",
          "Economische levensduur",
          "6 jaar",
          ["6 jaar", "10 jaar", "16 jaar"],
          "residual",
        ),
        Q(
          "technical",
          "Technische levensduur",
          "10 jaar",
          ["6 jaar", "10 jaar", "16 jaar"],
          "residual",
        ),
      ],
      "Afschrijving volgt hier de economische levensduur, niet de technische mogelijkheid om nog te functioneren.",
      "Economisch = verantwoord; technisch = functionerend.",
      "matrix",
      1,
    ),
  );
  x.push(
    E(
      "3.3",
      "partial-year",
      "Installeren en deeljaren",
      ["afschrijving", "btw"],
      `Een machine is op 1 april in gebruik genomen. Aanschaf ${euro(c(9680 * v))} incl. 21% btw, installatie ${euro(c(1000 * v))} excl. btw. Restwaarde ${euro(c(1000 * v))}, levensduur vier jaar. Schrijf negen maanden af tot 31 december.`,
      euroFields([
        [
          "Aanschafbasis excl. btw inclusief installatie",
          9000 * v,
          "vat-double",
        ],
        ["Jaarlijkse afschrijving", 2000 * v, "residual"],
        ["Afschrijving april–december", 1500 * v, "period"],
        ["Boekwaarde 31 december", 7500 * v, "begin-end"],
      ]),
      "Installatie hoort bij de aanschafbasis. Negen maanden is 9/12 van een jaar.",
      "Basis = aanschaf excl. + installatie excl.; jaarafschrijving × 9/12.",
    ),
  );
  x.push(
    radar(
      "3.3",
      "accrual",
      "Wel kosten, nog niet betaald",
      tx("accrueExpense", 60 * v),
      `De interest over januari bedraagt ${euro(c(60 * v))}; de betaling volgt in februari.`,
    ),
  );
  const b = balance({
    equipment: c(10000 * v),
    inventory: c(5000 * v),
    bank: c(15000 * v),
    equity: c(20000 * v),
    loan: c(10000 * v),
  });
  const events = [
    tx("purchaseCredit", 2000 * v),
    tx("saleCash", 6000 * v, 3000 * v),
    tx("saleCredit", 4000 * v, 2000 * v),
    tx("expenseCash", 1000 * v, undefined, 0),
    tx("repay", 500 * v),
    tx("depreciation", 200 * v),
    tx("withdraw", 300 * v),
    tx("accrueExpense", 50 * v),
  ];
  const end = ledger(b, events),
    r = report(events);
  const common = `Casus Atelier Nova, januari. Beginbalans: inventaris ${euro(b.equipment)}, voorraad ${euro(b.inventory)}, bank ${euro(b.bank)}, EV ${euro(b.equity)}, lening ${euro(b.loan)}. Overige posten nul. Geleverd: voorraadinkoop op rekening ${euro(c(2000 * v))} excl. 21% btw; directe verkoop ${euro(c(6000 * v))} excl. 21% btw (inkoopwaarde ${euro(c(3000 * v))}); verkoop op rekening ${euro(c(4000 * v))} excl. 21% btw (inkoopwaarde ${euro(c(2000 * v))}). Verder: loon betaald ${euro(c(1000 * v))}, aflossing ${euro(c(500 * v))}, afschrijving ${euro(c(200 * v))}, privé-opname ${euro(c(300 * v))}, interestkosten ${euro(c(50 * v))} nog niet betaald. Loon, interest en privé: geen btw.`;
  x.push(
    E(
      "3.4",
      "liquidity",
      "Liquiditeitsbegroting",
      ["liquiditeit", "geldstromen"],
      common +
        " Beschouw de gebeurtenissen als verwachtingen. Vul de liquiditeitsbegroting in.",
      [
        M("opening", "Beginsaldo bank", b.bank),
        M("receipts", "Totale ontvangsten", r.receipts, "credit-cash"),
        M("payments", "Totale uitgaven", r.payments, "depreciation"),
        M(
          "change",
          "Saldo ontvangsten − uitgaven",
          r.cashChange,
          "cash-profit",
        ),
        M("closing", "Eindsaldo bank", end.bank, "begin-end"),
      ],
      "De verkopen op rekening en inkopen op rekening veroorzaken nog geen geldstroom. Afschrijving en onbetaalde interest zijn ook geen uitgaven.",
      "Bank eind = bank begin + ontvangsten − uitgaven.",
    ),
  );
  x.push(
    E(
      "3.4",
      "exploitation",
      "Exploitatiebegroting",
      ["exploitatie", "kosten"],
      common + " Gebruik de verwachtingen voor de exploitatiebegroting.",
      euroFields([
        ["Omzet", 10000 * v],
        ["Inkoopwaarde omzet", 5000 * v, "stock"],
        ["Loonkosten", 1000 * v],
        ["Afschrijvingskosten", 200 * v, "depreciation"],
        ["Interestkosten", 50 * v, "interest"],
        ["Totale kosten", 6250 * v],
        ["Begroot resultaat", 3750 * v, "cash-profit"],
      ]),
      "Ook onbetaalde omzet en kosten horen bij deze periode. Aflossing en privé-opname tellen niet mee in het resultaat.",
      "Resultaat = omzet − inkoopwaarde − loon − afschrijving − interest.",
    ),
  );
  x.push(
    E(
      "3.4",
      "results",
      "Gerealiseerde resultatenrekening",
      ["resultaat", "exploitatie"],
      common +
        " Alle gebeurtenissen zijn nu werkelijk gerealiseerd. Stel de resultatenrekening in staffelvorm op.",
      euroFields([
        ["Gerealiseerde omzet", 10000 * v],
        ["Inkoopwaarde omzet", 5000 * v, "stock"],
        ["Brutowinst", 5000 * v, "margin"],
        ["Overige kosten totaal", 1250 * v, "repay"],
        ["Nettoresultaat", 3750 * v, "cash-profit"],
      ]),
      "Een resultatenrekening gebruikt gerealiseerde gegevens. De staffel trekt kosten van opbrengsten af.",
      "Omzet − inkoopwaarde = brutowinst; daarna trek je overige kosten af.",
    ),
  );
  x.push(
    E(
      "3.4",
      "ending",
      "Stel de eindbalans op",
      ["eindbalans", "balans"],
      common + " Vul de eindstanden in. Posten zonder saldo mag je leeg laten.",
      balanceFields(end),
      "Elke eindstand volgt uit beginstand plus mutaties. EV stijgt met winst en daalt met de privé-opname.",
      "Controleer alle activa en passiva afzonderlijk; gebruik resultaat voor de mutatie in EV.",
      "table",
      3,
    ),
  );
  const delta = Object.fromEntries(
    Object.keys(b).map((k) => [
      k,
      end[k as keyof Balance] - b[k as keyof Balance],
    ]),
  ) as Balance;
  x.push(
    E(
      "3.4",
      "mutations",
      "De integrale mutatiebalans",
      ["mutaties", "eindbalans"],
      common +
        " Noteer de totale mutatie per post, niet de eindstand. Laat posten zonder verandering weg.",
      mutationFields(delta),
      "De mutatie in eigen vermogen bestaat uit resultaat minus privé-opname. Beide zijden van de mutatiebalans hebben hetzelfde saldo.",
      "Mutatie = eindstand − beginstand.",
      "table",
      3,
    ),
  );
  x.push(
    E(
      "3.4",
      "receivables",
      "De vorderingen aan het einde",
      ["eindbalans", "geldstromen"],
      `Begindebiteuren ${euro(c(1210 * v))}. Nieuwe geleverde verkopen op rekening ${euro(c(3000 * v))} excl. 21% btw. Ontvangen van debiteuren ${euro(c(2420 * v))}.`,
      euroFields([
        ["Nieuwe facturen inclusief btw", 3630 * v, "inclusive"],
        ["Einddebiteuren", 2420 * v, "begin-end"],
        ["Omzet uit de ontvangen oude facturen", 0, "collect"],
      ]),
      "De nieuwe facturen verhogen debiteuren inclusief btw. Ontvangsten verlagen de vordering.",
      "Eind = begin + nieuwe facturen − ontvangen betalingen.",
    ),
  );
  x.push(
    E(
      "3.4",
      "transitory",
      "De vier overlopende posten",
      ["overlopend", "eindbalans"],
      "Geef elke post een balanszijde.",
      [
        Q(
          "t1",
          "Nog te ontvangen huur",
          "Activa",
          ["Activa", "Passiva"],
          "prepaid",
        ),
        Q(
          "t2",
          "Vooruitbetaalde verzekering",
          "Activa",
          ["Activa", "Passiva"],
          "prepaid",
        ),
        Q(
          "t3",
          "Nog te betalen interest",
          "Passiva",
          ["Activa", "Passiva"],
          "interest",
        ),
        Q(
          "t4",
          "Vooruitontvangen huur",
          "Passiva",
          ["Activa", "Passiva"],
          "advance",
        ),
      ],
      "Rechten staan bij activa, verplichtingen bij passiva.",
      "Moet de onderneming nog iets krijgen of nog iets leveren/betalen?",
      "matrix",
    ),
  );
  x.push(
    E(
      "3.4",
      "reconciliation",
      "Winst en eigen vermogen",
      ["eindbalans", "resultaat"],
      `Begin EV ${euro(c(15000 * v))}, winst ${euro(c(3000 * v))}, privé-opname ${euro(c(800 * v))}, privé-storting ${euro(c(500 * v))}.`,
      euroFields([
        ["Mutatie eigen vermogen", 2700 * v, "profit-equity"],
        ["Eigen vermogen eind", 17700 * v, "profit-equity"],
        ["Bedrijfskosten door privé-opname", 0, "private"],
      ]),
      "Privé-mutaties lopen buiten de resultatenrekening om, maar veranderen EV rechtstreeks.",
      "EV eind = EV begin + winst − privé-opnamen + privé-stortingen.",
    ),
  );
  x.push(
    E(
      "3.4",
      "forms",
      "Staffel of scontro?",
      ["resultaat"],
      `Opbrengsten ${euro(c(5000 * v))}, kosten ${euro(c(4200 * v))}. Vul de winst en de plek van de winst in scontrovorm in.`,
      [
        M("profit", "Winst", c(800 * v)),
        Q(
          "side",
          "Winst in scontrovorm aan",
          "Debetzijde",
          ["Debetzijde", "Creditzijde"],
          "profit-equity",
        ),
      ],
      "Bij scontro staan kosten debet. De winst komt aan dezelfde zijde om beide totalen gelijk te maken.",
      "Vul het verschil aan aan de zijde met het laagste totaal.",
      "matrix",
    ),
  );
  x.push(
    radar(
      "3.4",
      "vat-settlement",
      "Btw afrekenen",
      { ...tx("settleVat", 840 * v, 630 * v), label: "Btw-afrekening" },
      `Te betalen btw ${euro(c(840 * v))}, te vorderen btw ${euro(c(630 * v))}. Beide posten worden verrekend en het saldo direct per bank betaald.`,
    ),
  );
  for (const e of x) {
    const source = register.find((r) => r.number === `3.${sourceRefs[e.id]}`);
    if (source)
      e.source = `Eigen parallelopgave. Inhoudelijke aansluiting: Cumulus opgave ${source.number} · ${source.title}, werkboek p. ${source.workbookPage}, antwoorden p. ${source.answerPage}.`;
    if (
      e.id.endsWith("-invest") ||
      e.id.endsWith("-finance") ||
      e.id.endsWith("-vat9") ||
      e.id.endsWith("-liquidity") ||
      e.id.endsWith("-exploitation")
    )
      e.kind = "budget";
    if (e.id.endsWith("-opening") || e.id.endsWith("-ending"))
      e.kind = "balance";
    if (e.id.endsWith("-mutations")) e.kind = "mutation";
  }
  return x;
}
export const simulationExercises: Exercise[] = [
  E(
    "sim",
    "invest",
    "1 · Investeringsbegroting",
    ["investeren"],
    "Je start Studio Sole. Inventaris € 7.260 incl. 21% btw; voorraad € 8.000 excl. 21% btw; gewenste bankbuffer € 9.060. Stel de begroting op.",
    euroFields([
      ["Inventaris excl. btw", 6000],
      ["Voorraad excl. btw", 8000],
      ["Te vorderen btw", 2940],
      ["Bankbuffer", 9060],
      ["Totaal investering", 26000],
    ]),
    "De btw-vordering financiert tijdelijk mee.",
    "Splits de btw en tel daarna alle activa op.",
  ),
  E(
    "sim",
    "finance",
    "2 · Financieringsbegroting",
    ["financieren"],
    "Totale behoefte € 26.000; je brengt € 16.000 spaargeld in. Je financiert het restant met een lening voor vijf jaar.",
    euroFields([
      ["Eigen vermogen", 16000],
      ["Benodigde lening", 10000],
      ["Totale financiering", 26000],
    ]),
    "Het financieringstotaal is gelijk aan de investeringsbehoefte.",
    "Trek eigen inbreng af van de totale behoefte.",
  ),
  E(
    "sim",
    "opening",
    "3 · Beginbalans",
    ["balans"],
    "Beginbalans Studio Sole: inventaris € 6.000, voorraad € 8.000, btw-vordering € 2.940, bank € 9.060, EV € 16.000, lening € 10.000; alle andere posten nul.",
    balanceFields(opening),
    "Beide zijden tellen op tot € 26.000.",
    "Orden rechten/bezittingen en financiering.",
  ),
  ...planned.map((t, i) => ({
    ...radar(
      "sim",
      `plan-${i}`,
      `4.${i + 1} · Verwachte gebeurtenis`,
      t,
      t.label,
    ),
    goal: ["mutaties", "geldstromen"],
  })),
  {
    ...E(
      "sim",
      "liquidity",
      "5 · Liquiditeitsbegroting",
      ["liquiditeit"],
      "Bereken de verwachte geldstromen van alle 18 begrote gebeurtenissen. De oorspronkelijke beginbank is € 9.060.",
      [
        M("receipts", "Begrote ontvangsten", planReport.receipts),
        M("payments", "Begrote uitgaven", planReport.payments),
        M("cash", "Begrote eindbank", opening.bank + planReport.cashChange),
      ],
      "Gebruik alle geldstromen, ook financiering en privé.",
      "Beginsaldo + ontvangsten − uitgaven.",
    ),
    context: planned.map((t) => t.label),
  },
  {
    ...E(
      "sim",
      "exploitation",
      "6 · Exploitatiebegroting",
      ["exploitatie"],
      "Bereken de verwachte opbrengsten, kosten en winst uit de 18 begrote gebeurtenissen.",
      [
        M("revenue", "Begrote opbrengsten", planReport.revenue),
        M("cost", "Begrote kosten", planReport.costs),
        M("profit", "Begrote winst", planReport.result),
      ],
      "Vooruitbetalingen en financiering zijn geen nieuwe periodekosten of opbrengsten.",
      "Tel de opbrengsten bij levering en de kosten van de periode op.",
    ),
    context: planned.map((t) => t.label),
  },
  {
    ...E(
      "sim",
      "actual",
      "7 · Werkelijkheid verwerken",
      ["mutaties", "resultaat"],
      "Het loon blijkt € 900 in plaats van € 800. De laatste directe verkoop is € 2.000 excl. btw in plaats van € 2.500; de werkelijke inkoopwaarde is € 1.000 in plaats van € 1.250. Alle andere gebeurtenissen blijven gelijk. Bereken de afwijkingen ten opzichte van de begroting (werkelijk minus begroot).",
      [
        M(
          "revenue",
          "Afwijking opbrengsten",
          actualReport.revenue - planReport.revenue,
        ),
        M("cost", "Afwijking kosten", actualReport.costs - planReport.costs),
        M(
          "result",
          "Afwijking resultaat",
          actualReport.result - planReport.result,
        ),
        M(
          "cash",
          "Afwijking eindbank",
          actualReport.cashChange - planReport.cashChange,
        ),
      ],
      "De lagere verkoop verlaagt omzet, btw en bank; de lagere inkoopwaarde verlaagt kosten. Het hogere loon verhoogt kosten en uitgaven.",
      "Vergelijk ieder verschil apart: verkoop −500; inkoopwaarde −250; loon +100.",
    ),
    context: planned.map((t) => t.label),
  },
  {
    ...E(
      "sim",
      "result",
      "8 · Resultatenrekening",
      ["resultaat"],
      "Stel de gerealiseerde resultatenrekening van januari op.",
      [
        M("revenue", "Werkelijke opbrengsten", actualReport.revenue),
        M("cost", "Werkelijke kosten", actualReport.costs),
        M("result", "Werkelijke winst", actualReport.result),
      ],
      "De werkelijke winst bevat beide directe verkopen, de verkoop op rekening en de geleverde bestelling uit het voorschot.",
      "Gebruik werkelijke gegevens, geen begrote cijfers.",
    ),
    context: transactions.map((t) => t.label),
  },
  {
    ...E(
      "sim",
      "delta",
      "9 · Integrale mutatiebalans",
      ["mutaties"],
      "Noteer voor alle posten de totale werkelijke mutatie over januari. Laat posten zonder verandering weg.",
      mutationFields(
        Object.fromEntries(
          Object.keys(opening).map((k) => [
            k,
            finalBalance[k as keyof Balance] - opening[k as keyof Balance],
          ]),
        ) as Balance,
      ),
      "De som van de activamutaties is gelijk aan de som van de passivamutaties.",
      "Mutatie = eind − begin.",
    ),
    context: transactions.map((t) => t.label),
  },
  {
    ...E(
      "sim",
      "ending",
      "10 · Eindbalans",
      ["eindbalans"],
      "Stel de werkelijke eindbalans van Studio Sole op. Beginstanden: inventaris € 6.000, voorraad € 8.000, btw-vordering € 2.940, bank € 9.060, EV € 16.000, lening € 10.000; overige posten nul.",
      balanceFields(finalBalance),
      "Elke eindstand volgt uit de beginbalans en de werkelijke transacties.",
      "Denk aan overlopende posten en privé-mutaties.",
    ),
    context: transactions.map((t) => t.label),
  },
  E(
    "sim",
    "check",
    "11 · Eindcontrole",
    ["eindbalans", "resultaat"],
    "Controleer het verband. Begin EV € 16.000, privé-storting € 1.000 en privé-opname € 300. Gebruik je eigen eindbalans en resultaat.",
    [
      M(
        "profit",
        "Resultaat afgeleid uit EV",
        finalBalance.equity - opening.equity - c(1000) + c(300),
      ),
      M("difference", "Activa minus passiva", 0),
      M("cash", "Verandering bank", actualReport.cashChange),
    ],
    "Een sluitende balans en de EV-aansluiting vormen samen een controle. Een sluitende balans alleen bewijst nog niet dat iedere post correct is.",
    "EV eind − EV begin − storting + opname = resultaat.",
  ),
];
