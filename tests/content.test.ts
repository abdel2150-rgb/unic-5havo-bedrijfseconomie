import { describe, it, expect } from "vitest";
import { exercises, simulationExercises } from "../src/content/exercises";
import { grade, gradeField } from "../src/lib/exercises";
import { inputMoney } from "../src/lib/money";
import { modules, goals } from "../src/content/curriculum";
import register from "../src/content/register.json" with { type: "json" };
import {
  validateExercise,
  importExercises,
  importCSV,
  importProgress,
  template,
  csvTemplate,
  parseCSV,
} from "../src/lib/importer";
import { fresh, mastery, type Attempt } from "../src/lib/storage";
import { mistakes } from "../src/content/mistakes";
describe("inhoud en beoordeling", () => {
  it("alle 46 bronopgaven behouden eigen nummering en gecontroleerde pagina’s", () => {
    expect(register).toHaveLength(46);
    expect(register.map((r) => r.number)).toEqual(
      Array.from({ length: 46 }, (_, i) => `3.${i + 1}`),
    );
    expect(register[1]).toMatchObject({
      title: "Investeren in Pura Vida",
      workbookPage: 16,
      answerPage: 9,
      module: "3.1",
    });
    expect(register[45]).toMatchObject({
      workbookPage: 100,
      answerPage: 61,
      module: "3.4",
    });
  });
  it.each([1, 2, 3, 7])(
    "alle opgaven variant %i zijn valide en hebben zelf-consistente exacte beoordelingen",
    (v) => {
      const es = exercises(v);
      expect(new Set(es.map((e) => e.id)).size).toBe(es.length);
      for (const m of modules)
        expect(
          es.filter((e) => e.module === m.id).length,
        ).toBeGreaterThanOrEqual(10);
      for (const e of [...es, ...simulationExercises]) {
        if (e.module !== "sim")
          expect(() => validateExercise(e), e.id).not.toThrow();
        expect(e.goal.every((g) => goals[g])).toBe(true);
        expect(e.hints).toHaveLength(3);
        const answers = Object.fromEntries(
          e.fields.map((f) => [
            f.id,
            typeof f.answer === "number" ? inputMoney(f.answer) : f.answer,
          ]),
        );
        expect(
          grade(e, answers).every((r) => r.correct),
          e.id,
        ).toBe(true);
        expect(
          grade(e, {}).every((r) => !r.correct),
          e.id,
        ).toBe(true);
      }
    },
  );
  it("nieuwe varianten veranderen bedragen maar behouden de structuur", () => {
    const one = exercises(1),
      two = exercises(2);
    expect(two.find((x) => x.id === "3.1-invest")?.fields[0].answer).toBe(
      1200000,
    );
    expect(one.map((e) => e.id)).toEqual(two.map((e) => e.id));
  });
  it("herkent equivalente begrippen zonder niet-equivalente antwoorden goed te keuren", () => {
    const f = exercises().find((e) => e.id === "3.2-explain")!.fields[0];
    expect(gradeField(f, " Vorderingen op klanten. ").correct).toBe(true);
    expect(gradeField(f, "crediteuren").correct).toBe(false);
    expect(gradeField(f, "geen debiteuren").correct).toBe(false);
  });
  it("onderscheidt veelvoorkomende begripsfouten van rekenafwijkingen", () => {
    const f = {
      id: "x",
      label: "Ontvangst",
      kind: "money" as const,
      answer: 12100,
      diagnosis: "inclusive",
    };
    expect(gradeField(f, "100").errorKind).toBe("begrip");
    expect(gradeField(f, "120,99").errorKind).toBe("berekening");
    expect(gradeField(f, "-121").diagnosis).toBe("sign");
  });
  it("begroting en gerealiseerde resultaten hebben eigen antwoorden", () => {
    const ex = simulationExercises.find((e) => e.id === "sim-actual")!;
    expect(ex.fields.map((f) => f.answer)).toEqual([
      -50000, -15000, -35000, -70500,
    ]);
  });
  it("foutenbibliotheek bevat minstens twintig inhoudelijke herstelvragen", () => {
    expect(mistakes.length).toBeGreaterThanOrEqual(20);
    expect(new Set(mistakes.map((m) => m.id)).size).toBe(mistakes.length);
    expect(mistakes.every((m) => m.example && m.repair && m.answer)).toBe(true);
  });
});
describe("docentimport en voortgang", () => {
  it("weigert incomplete CSV-antwoorden en onbruikbare interactieve gegevens", () => {
    expect(() => importCSV(csvTemplate.replace(",0,", ",,"))).toThrow();
    expect(() => validateExercise({ ...template, context: {} })).toThrow();
    expect(() =>
      validateExercise({
        ...template,
        fields: [
          {
            ...template.fields[0],
            wrong: [{ value: 25000, diagnosis: "onbekend" }],
          },
        ],
      }),
    ).toThrow();
  });

  it("JSON en CSV sjablonen zijn echt importeerbaar", () => {
    expect(importExercises(JSON.stringify([template]))).toHaveLength(1);
    expect(importCSV(csvTemplate)[0].fields[0].answer).toBe(0);
  });
  it("CSV leest geciteerde komma’s en nieuwe regels", () =>
    expect(parseCSV('a,b\r\n"Hallo, leerling","regel 1\nregel 2"\r\n')).toEqual(
      [
        ["a", "b"],
        ["Hallo, leerling", "regel 1\nregel 2"],
      ],
    ));
  it("weigert ongeldige opgaven en antwoordtypes", () => {
    expect(() =>
      importExercises(
        JSON.stringify({
          ...template,
          fields: [{ id: "x", label: "X", kind: "money", answer: 12.5 }],
        }),
      ),
    ).toThrow();
    expect(() =>
      importExercises(JSON.stringify({ ...template, goal: ["fake"] })),
    ).toThrow();
    expect(() =>
      importExercises(JSON.stringify([template, template])),
    ).toThrow();
    expect(() => importCSV("id,answer\nx,abc")).toThrow();
  });
  it("voortgang kan rondreizen en weigert verkeerde schema’s", () => {
    expect(importProgress(JSON.stringify(fresh()))).toEqual(fresh());
    expect(() => importProgress('{"version":2}')).toThrow();
    expect(() =>
      importProgress(
        JSON.stringify({ ...fresh(), drafts: { x: { answer: 5 } } }),
      ),
    ).toThrow();
  });
  it("beheersing vraagt verschillende opgaven en zelfstandige werkvormen", () => {
    const a: Attempt = {
      id: "a",
      exercise: "one",
      module: "3.1",
      goals: ["balans"],
      kind: "table",
      variant: 1,
      correct: 1,
      total: 1,
      hints: 0,
      try: 1,
      at: "2027-01-01",
      mistakes: [],
      answers: { a: "0" },
    };
    expect(mastery([], "balans").label).toBe("Nog niet geoefend");
    expect(mastery([a, a, a], "balans").label).toBe("Bezig met oefenen");
    expect(mastery([a, { ...a, exercise: "two" }], "balans").label).toBe(
      "Redelijk beheerst",
    );
    expect(
      mastery(
        [
          a,
          { ...a, exercise: "two" },
          { ...a, exercise: "three", kind: "radar" },
        ],
        "balans",
      ).label,
    ).toBe("Goed beheerst");
    expect(
      mastery(
        [
          a,
          { ...a, exercise: "two", hints: 1 },
          { ...a, exercise: "three", kind: "radar", try: 2 },
        ],
        "balans",
      ).label,
    ).toBe("Redelijk beheerst");
  });
});
