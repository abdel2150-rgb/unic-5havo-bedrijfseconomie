import { goals } from "./curriculum";
export interface Video {
  title: string;
  url: string | null;
  module: string;
  goal: string;
  verifiedAt: string | null;
  questions: { question: string; answer: string; options: string[] }[];
}
// Alleen toevoegen na controle van de echte video én de aansluiting bij het leerdoel.
export const videos: Video[] = Object.keys(goals).map((goal) => ({
  title: `OSSAcademie · ${goals[goal]}`,
  url: null,
  module: ["balans", "investeren", "financieren", "krediet"].includes(goal)
    ? "3.1"
    : ["btw", "voorraad", "omzet", "geldstromen"].includes(goal)
      ? "3.2"
      : ["kosten", "lening", "afschrijving", "overlopend"].includes(goal)
        ? "3.3"
        : "3.4",
  goal,
  verifiedAt: null,
  questions: [],
}));
