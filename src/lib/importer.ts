import type { Exercise, Field } from "./exercises";
import type { Progress } from "./storage";
import { goals } from "../content/curriculum";
import { mistakes } from "../content/mistakes";
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const str = (x: unknown, max = 8000): x is string =>
  typeof x === "string" && x.length > 0 && x.length <= max;
const money = (x: unknown) => typeof x === "number" && Number.isSafeInteger(x);
const strings = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((v) => typeof v === "string");
export function validateExercise(value: unknown): Exercise {
  if (!object(value)) throw Error("Een opgave moet een object zijn.");
  const x = value;
  if (
    !str(x.id, 100) ||
    !str(x.title, 200) ||
    !["3.1", "3.2", "3.3", "3.4"].includes(String(x.module)) ||
    !str(x.prompt) ||
    !str(x.explanation) ||
    !str(x.source, 1000) ||
    ![1, 2, 3].includes(Number(x.level)) ||
    typeof x.active !== "boolean"
  )
    throw Error(
      "Controleer id, titel, paragraaf, vraag, uitleg, bron, niveau en actief.",
    );
  if (!strings(x.goal) || !x.goal.length || x.goal.some((g) => !goals[g]))
    throw Error(
      "Onbekend of ontbrekend leerdoel. Gebruik de leerdoelcodes uit het sjabloon.",
    );
  if (
    ![
      "table",
      "radar",
      "sort",
      "schedule",
      "matrix",
      "open",
      "budget",
      "balance",
      "mutation",
    ].includes(String(x.kind)) ||
    !strings(x.hints) ||
    x.hints.length !== 3
  )
    throw Error("Geef een werkvorm en precies drie hints.");
  if (!Array.isArray(x.fields) || !x.fields.length || x.fields.length > 100)
    throw Error("Een opgave heeft 1–100 deelvragen nodig.");
  if (
    x.context !== undefined &&
    (!strings(x.context) ||
      x.context.length > 100 ||
      x.context.some((s) => !str(s)))
  )
    throw Error("Ongeldige gegevenslijst bij de opgave.");
  if (x.hints.some((h) => !str(h))) throw Error("Hints mogen niet leeg zijn.");
  const ids = new Set<string>();
  for (const f of x.fields) {
    if (
      !object(f) ||
      !str(f.id, 100) ||
      ids.has(f.id) ||
      !str(f.label, 200) ||
      !["money", "choice", "text"].includes(String(f.kind))
    )
      throw Error("Ongeldig of dubbel deelvraag-id.");
    ids.add(f.id);
    if (f.kind === "money" ? !money(f.answer) : !str(f.answer, 500))
      throw Error(
        "Bedragantwoorden zijn gehele centen; overige antwoorden zijn tekst.",
      );
    if (
      f.kind === "choice" &&
      (!strings(f.options) ||
        f.options.length < 2 ||
        f.options.length > 30 ||
        f.options.some((o) => !str(o, 500)) ||
        !f.options.includes(String(f.answer)) ||
        new Set(f.options).size !== f.options.length)
    )
      throw Error("Keuzeantwoord ontbreekt in de unieke opties.");
    if (
      f.diagnosis !== undefined &&
      !mistakes.some((m) => m.id === f.diagnosis)
    )
      throw Error("Onbekende foutdiagnose.");
    if (
      f.wrong !== undefined &&
      (!Array.isArray(f.wrong) ||
        f.wrong.some(
          (w) =>
            !object(w) ||
            (f.kind === "money" ? !money(w.value) : !str(w.value, 500)) ||
            !mistakes.some((m) => m.id === w.diagnosis),
        ))
    )
      throw Error("Ongeldig foutantwoord of diagnose.");
    if (f.alternatives !== undefined && !strings(f.alternatives))
      throw Error("Alternatieven moeten een lijst teksten zijn.");
  }
  return x as unknown as Exercise;
}
export function importExercises(raw: string) {
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (rows.length > 200) throw Error("Maximaal 200 opgaven per import.");
  const result = rows.map(validateExercise);
  if (new Set(result.map((x) => x.id)).size !== result.length)
    throw Error("Dubbele opgave-id’s.");
  return result;
}
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (quoted) throw Error("Niet-afgesloten aanhalingsteken in CSV.");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function importCSV(raw: string) {
  const [headers, ...rows] = parseCSV(raw);
  if (
    !headers ||
    ![
      "id",
      "module",
      "title",
      "goal",
      "prompt",
      "answer",
      "explanation",
      "hint1",
      "hint2",
      "hint3",
      "source",
    ].every((h) => headers.includes(h))
  )
    throw Error("Gebruik het CSV-sjabloon met alle verplichte kolommen.");
  if (rows.length > 200) throw Error("Maximaal 200 opgaven per import.");
  if (new Set(headers).size !== headers.length)
    throw Error("Dubbele kolommen in CSV.");
  const result = rows.map((row) => {
    if (row.length !== headers.length)
      throw Error("Niet iedere CSV-rij heeft evenveel kolommen.");
    const r = Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]));
    if (!r.answer.trim())
      throw Error("Een correct antwoord mag niet ontbreken.");
    return validateExercise({
      id: r.id,
      module: r.module,
      title: r.title,
      goal: r.goal.split("|"),
      kind: "table",
      prompt: r.prompt,
      fields: [
        {
          id: "answer",
          label: "Bedrag in euro",
          kind: "money",
          answer: Number(r.answer),
        } satisfies Field,
      ],
      explanation: r.explanation,
      hints: [r.hint1, r.hint2, r.hint3],
      source: r.source,
      level: 2,
      active: true,
    });
  });
  if (new Set(result.map((x) => x.id)).size !== result.length)
    throw Error("Dubbele opgave-id’s.");
  return result;
}
export function importProgress(raw: string): Progress {
  const p: unknown = JSON.parse(raw);
  if (
    !object(p) ||
    p.version !== 1 ||
    typeof p.alias !== "string" ||
    p.alias.length > 60 ||
    !Array.isArray(p.attempts) ||
    p.attempts.length > 100000 ||
    !Array.isArray(p.custom) ||
    !object(p.drafts) ||
    !object(p.variants) ||
    !Number.isInteger(p.simulationIndex) ||
    Number(p.simulationIndex) < 0 ||
    Number(p.simulationIndex) > 100
  )
    throw Error("Dit is geen geldig voortgangsbestand versie 1.");
  for (const a of p.attempts) {
    if (
      !object(a) ||
      !str(a.id) ||
      !str(a.exercise) ||
      !str(a.module) ||
      !strings(a.goals) ||
      !str(a.kind) ||
      !str(a.at) ||
      !strings(a.mistakes) ||
      !object(a.answers) ||
      ![a.correct, a.total, a.hints, a.try, a.variant].every(
        (n) => typeof n === "number" && Number.isInteger(n) && n >= 0,
      ) ||
      Number(a.correct) > Number(a.total) ||
      Number(a.total) < 1 ||
      Number(a.hints) > 3
    )
      throw Error("Ongeldig resultaat in voortgangsbestand.");
    if (Object.values(a.answers).some((v) => typeof v !== "string"))
      throw Error("Ongeldige antwoorden.");
  }
  for (const row of Object.values(p.drafts))
    if (!object(row) || Object.values(row).some((v) => typeof v !== "string"))
      throw Error("Ongeldige conceptantwoorden.");
  if (
    Object.values(p.variants).some(
      (v) => !Number.isInteger(v) || Number(v) < 1 || Number(v) > 1000,
    )
  )
    throw Error("Ongeldige variant.");
  p.custom = p.custom.map(validateExercise);
  if (p.exam !== null) {
    if (
      !object(p.exam) ||
      !str(p.exam.module) ||
      !Number.isInteger(p.exam.variant) ||
      !Array.isArray(p.exam.exercises) ||
      !object(p.exam.answers) ||
      typeof p.exam.submitted !== "boolean" ||
      !str(p.exam.started)
    )
      throw Error("Ongeldige oefentoets.");
    p.exam.exercises = p.exam.exercises.map(validateExercise);
    for (const row of Object.values(p.exam.answers))
      if (!object(row) || Object.values(row).some((v) => typeof v !== "string"))
        throw Error("Ongeldige toetsantwoorden.");
  }
  return p as unknown as Progress;
}
export const template: Exercise = {
  id: "docent-eigen-1",
  module: "3.3",
  title: "Eigen aflossingsvraag",
  goal: ["lening"],
  kind: "table",
  prompt:
    "Je lost € 250 af op een lening. Wat zijn de kosten van die aflossing?",
  fields: [
    {
      id: "answer",
      label: "Kosten",
      kind: "money",
      answer: 0,
      diagnosis: "repay",
    },
  ],
  hints: [
    "Wat gebeurt er met de lening?",
    "Bank en lening dalen evenveel.",
    "De aflossing verlaagt het resultaat niet.",
  ],
  explanation:
    "Aflossing verlaagt bank en schuld; het is een uitgave zonder kosten.",
  source: "Eigen opgave van de docent",
  level: 1,
  active: true,
};
export const csvTemplate =
  "id,module,title,goal,prompt,answer,explanation,hint1,hint2,hint3,source\ndocent-csv-1,3.3,Aflossing,lening,Je lost 250 euro af. Wat zijn de kosten?,0,Aflossing is geen kostenpost.,Kijk naar de schuld.,Schuld en bank dalen.,Het resultaat blijft gelijk.,Eigen opgave\n";
