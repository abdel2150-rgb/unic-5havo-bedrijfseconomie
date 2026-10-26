import { describe, it, expect } from "vitest";
import { exercises } from "../src/content/exercises";
import { grade } from "../src/lib/exercises";
import {
  getBalanceFields,
  getBalanceMode,
  isPostSelected,
  selectionKey,
} from "../src/lib/balance-exercise";
import { inputMoney } from "../src/lib/money";
const radar = exercises().find((e) => e.id === "3.1-repayment")!;
const mutation = { ...radar, fields: getBalanceFields(radar) };
describe("alleen veranderde posten beoordelen", () => {
  it("twee aflossingsposten volstaan, zonder dertien nullen", () => {
    const result = grade(mutation, { bank: "-500", loan: "-500" });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.correct && r.valid)).toBe(true);
  });
  it("lege ongewijzigde posten leveren geen gratis punten op", () => {
    const result = grade(mutation, {});
    expect(result).toHaveLength(2);
    expect(result.every((r) => !r.correct && r.valid)).toBe(true);
  });
  it("een ontbrekende veranderde post blijft fout, ook als de overige bedragen kloppen", () => {
    expect(grade(mutation, { bank: "-500" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "loan", correct: false }),
      ]),
    );
  });
  it.each(["0", "100"])(
    "een onterecht toegevoegde post is fout, ook bij bedrag %s",
    (amount) => {
      const result = grade(mutation, {
        bank: "-500",
        loan: "-500",
        equipment: amount,
        [selectionKey("equipment")]: "1",
      });
      expect(result).toHaveLength(3);
      expect(result.find((r) => r.field === "equipment")).toMatchObject({
        correct: false,
        valid: true,
      });
    },
  );
  it("een toegevoegde post zonder geldig bedrag moet eerst ingevuld worden", () => {
    expect(
      grade(mutation, { [selectionKey("bank")]: "1" }).find(
        (r) => r.field === "bank",
      )?.valid,
    ).toBe(false);
    expect(
      grade(mutation, { bank: "abc", [selectionKey("bank")]: "1" }).find(
        (r) => r.field === "bank",
      )?.valid,
    ).toBe(false);
  });
  it("verwijderen wist de selectie, ook als een oude waarde nog aanwezig is", () => {
    expect(
      grade(mutation, {
        bank: "-500",
        loan: "-500",
        [selectionKey("bank")]: "0",
      }).find((r) => r.field === "bank")?.correct,
    ).toBe(false);
  });
  it("oude opgeslagen antwoorden met expliciete nullen blijven bruikbaar", () => {
    const old = Object.fromEntries(
      mutation.fields.map((f) => [f.id, inputMoney(f.answer as number)]),
    );
    expect(grade(mutation, old)).toHaveLength(2);
    expect(grade(mutation, old).every((r) => r.correct)).toBe(true);
    expect(
      isPostSelected(mutation.fields.find((f) => f.id === "equipment")!, old),
    ).toBe(false);
  });
  it("in volledige balansen mag een nulsaldo leeg blijven", () => {
    const e = exercises().find((e) => e.id === "3.1-opening")!;
    const answers = Object.fromEntries(
      e.fields
        .filter((f) => f.answer !== 0)
        .map((f) => [f.id, inputMoney(f.answer as number)]),
    );
    expect(getBalanceMode(e)).toBe("balance");
    expect(grade(e, answers).every((r) => r.correct)).toBe(true);
    delete answers.bank;
    expect(grade(e, answers).find((r) => r.field === "bank")?.correct).toBe(
      false,
    );
  });
  it("in de transactieradar hoeven nul-effecten ook niet ingevuld te worden", () => {
    const result = grade(radar, { bank: "-500", loan: "-500", payment: "500" });
    expect(result.every((r) => r.correct && r.valid)).toBe(true);
  });
  it("gewone geldvragen veranderen niet van beoordelingsregels", () => {
    const e = exercises().find((e) => e.id === "3.1-invest")!;
    expect(getBalanceMode(e)).toBeNull();
    expect(grade(e, {}).every((r) => !r.valid)).toBe(true);
  });
});
