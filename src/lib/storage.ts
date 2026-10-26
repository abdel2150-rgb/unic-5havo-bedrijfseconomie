import { openDB } from "idb";
import type { Exercise } from "./exercises";
export interface Attempt {
  id: string;
  exercise: string;
  module: string;
  goals: string[];
  kind: string;
  variant: number;
  correct: number;
  total: number;
  hints: number;
  try: number;
  at: string;
  mistakes: string[];
  answers: Record<string, string>;
}
export interface Exam {
  module: string;
  variant: number;
  exercises: Exercise[];
  answers: Record<string, Record<string, string>>;
  submitted: boolean;
  started: string;
}
export interface Progress {
  version: 1;
  alias: string;
  attempts: Attempt[];
  drafts: Record<string, Record<string, string>>;
  variants: Record<string, number>;
  custom: Exercise[];
  simulationIndex: number;
  exam: Exam | null;
}
export const fresh = (): Progress => ({
  version: 1,
  alias: "",
  attempts: [],
  drafts: {},
  variants: {},
  custom: [],
  simulationIndex: 0,
  exam: null,
});
const db = () =>
  openDB("unic-eenmanszaak", 1, {
    upgrade(d) {
      d.createObjectStore("progress");
    },
  });
export async function readProgress(): Promise<Progress> {
  const d = await db();
  try {
    return (await d.get("progress", "current")) ?? fresh();
  } finally {
    d.close();
  }
}
export async function saveProgress(p: Progress) {
  const d = await db();
  try {
    await d.put("progress", p, "current");
  } finally {
    d.close();
  }
}
export function download(name: string, value: unknown) {
  const blob = new Blob(
    [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
    {
      type:
        typeof value === "string"
          ? "text/csv;charset=utf-8"
          : "application/json",
    },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function mastery(attempts: Attempt[], goal: string) {
  const list = attempts.filter((a) => a.goals.includes(goal));
  if (!list.length) return { label: "Nog niet geoefend", percent: 0 };
  const successful = list.filter((a) => a.correct === a.total);
  const ids = new Set(successful.map((a) => a.exercise));
  const independent = successful.filter((a) => a.hints === 0 && a.try === 1);
  const kinds = new Set(independent.map((a) => a.kind));
  const independentIds = new Set(independent.map((a) => a.exercise));
  if (independentIds.size >= 3 && kinds.size >= 2)
    return { label: "Goed beheerst", percent: 100 };
  if (ids.size >= 2) return { label: "Redelijk beheerst", percent: 65 };
  return { label: "Bezig met oefenen", percent: 25 };
}
