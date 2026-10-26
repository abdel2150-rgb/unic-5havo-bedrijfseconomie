import { accounts, assets, type Account } from "./finance";
import type { Exercise, Field } from "./exercises";
import { parseMoney } from "./money";

/** Recognise current exercises and older saved exam snapshots without migrating answers. */
export function getBalanceFields(exercise: Exercise): Field[] {
  return exercise.fields.filter(
    (f) =>
      f.kind === "money" &&
      Object.hasOwn(accounts, f.id) &&
      (f.label === accounts[f.id as Account] ||
        f.label === `${accounts[f.id as Account]} · mutatie`),
  );
}
export function getBalanceMode(
  exercise: Exercise,
): "balance" | "mutation" | null {
  const fields = getBalanceFields(exercise);
  if (!fields.length) return null;
  return fields.some((f) => f.label.endsWith(" · mutatie"))
    ? "mutation"
    : "balance";
}
export const isAssetField = (field: Field) =>
  assets.includes(field.id as Account);
export const selectionKey = (id: string) => `_selected_${id}`;
export function isPostSelected(field: Field, answers: Record<string, string>) {
  const choice = answers[selectionKey(field.id)];
  if (choice !== undefined) return choice === "1";
  const amount = parseMoney(answers[field.id] ?? "");
  return amount !== null && amount !== 0;
}
