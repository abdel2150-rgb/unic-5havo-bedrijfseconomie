import { parseMoney } from "./money";
import {
  getBalanceFields,
  getBalanceMode,
  isPostSelected,
} from "./balance-exercise";
export interface Field {
  id: string;
  label: string;
  kind: "money" | "choice" | "text";
  answer: number | string;
  options?: string[];
  alternatives?: string[];
  diagnosis?: string;
  wrong?: { value: number | string; diagnosis: string }[];
  unit?: string;
}
export interface Exercise {
  id: string;
  module: string;
  title: string;
  goal: string[];
  kind:
    | "table"
    | "radar"
    | "sort"
    | "schedule"
    | "matrix"
    | "open"
    | "budget"
    | "balance"
    | "mutation";
  prompt: string;
  context?: string[];
  fields: Field[];
  explanation: string;
  hints: [string, string, string];
  source: string;
  level: 1 | 2 | 3;
  active: boolean;
}
export interface Grade {
  field: string;
  correct: boolean;
  valid: boolean;
  diagnosis?: string;
  errorKind?: "begrip" | "berekening";
}
export const normalize = (s: string) =>
  s
    .toLocaleLowerCase("nl")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
export function gradeField(field: Field, value: string | undefined): Grade {
  const raw = value?.trim() ?? "";
  const parsed = field.kind === "money" ? parseMoney(raw) : raw;
  const valid = parsed !== null && raw !== "";
  const correct =
    valid &&
    (typeof field.answer === "number"
      ? parsed === field.answer
      : [field.answer, ...(field.alternatives ?? [])].some(
          (a) => normalize(a as string) === normalize(raw),
        ));
  const wrong = field.wrong?.find((w) =>
    typeof w.value === "number"
      ? parsed === w.value
      : normalize(String(w.value)) === normalize(raw),
  );
  let diagnosis = wrong?.diagnosis ?? field.diagnosis;
  let errorKind: "begrip" | "berekening" =
    field.kind === "money" ? "berekening" : "begrip";
  if (wrong) errorKind = "begrip";
  if (
    typeof parsed === "number" &&
    typeof field.answer === "number" &&
    !correct &&
    valid
  ) {
    if (parsed === -field.answer && field.answer !== 0) {
      diagnosis = "sign";
      errorKind = "begrip";
    } else if (
      field.answer !== 0 &&
      (parsed === Math.round(field.answer * 1.21) ||
        parsed === Math.round(field.answer / 1.21))
    ) {
      diagnosis = "inclusive";
      errorKind = "begrip";
    } else if ((field.answer === 0 || parsed === 0) && diagnosis) {
      errorKind = "begrip";
    }
  }
  return {
    field: field.id,
    valid,
    correct,
    diagnosis: correct ? undefined : diagnosis,
    errorKind: correct ? undefined : errorKind,
  };
}
export function grade(ex: Exercise, answers: Record<string, string>): Grade[] {
  const mode = getBalanceMode(ex);
  const balanceIds = new Set(getBalanceFields(ex).map((f) => f.id));
  return ex.fields.flatMap((f) => {
    if (!balanceIds.has(f.id))
      return [
        gradeField(
          f,
          ex.kind === "radar" && f.kind === "money"
            ? answers[f.id]?.trim() || "0"
            : answers[f.id],
        ),
      ];
    const selected = isPostSelected(f, answers);
    if (mode === "mutation" && f.answer === 0 && !selected) return [];
    if (mode === "mutation" && !selected) return [gradeField(f, "0")];
    const raw = answers[f.id]?.trim() ?? "";
    if (mode === "mutation" && selected && f.answer === 0) {
      return [
        {
          field: f.id,
          correct: false,
          valid: raw !== "" && parseMoney(raw) !== null,
          diagnosis: "sign",
          errorKind: "begrip",
        } satisfies Grade,
      ];
    }
    if (mode === "mutation" && selected && raw === "")
      return [gradeField(f, raw)];
    return [gradeField(f, raw || "0")];
  });
}
