import { useState } from "react";
import {
  ArrowRight,
  ArrowDown,
  Check,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import type { Exercise, Grade } from "../lib/exercises";
import { grade, normalize } from "../lib/exercises";
import { euro, parseMoney } from "../lib/money";
import { mistake } from "../content/mistakes";
import { SortTrainer } from "./SortTrainer";
export function Repair({ id }: { id: string }) {
  const m = mistake(id);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  return (
    <div className="repair">
      <strong>{m.title}</strong>
      <p>{m.explanation}</p>
      <p>
        <b>Nieuw voorbeeld:</b> {m.example}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setResult(
            normalize(answer) === normalize(m.answer) ||
              (parseMoney(answer) !== null &&
                parseMoney(answer) === parseMoney(m.answer)),
          );
        }}
      >
        <label>
          {m.repair}
          <input
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setResult(null);
            }}
            required
            aria-label={m.repair}
          />
        </label>
        <button className="button secondary" type="submit">
          Herstelantwoord controleren
        </button>
        {result !== null && (
          <p role="status">
            {result
              ? "Goed! Je hebt dit onderscheid hersteld."
              : `Nog niet. Het antwoord is ${m.answer}. Lees het voorbeeld nog eens en probeer opnieuw.`}
          </p>
        )}
      </form>
    </div>
  );
}
export function ExerciseView({
  exercise,
  answers,
  onChange,
  onCheck,
  review = false,
  exam = false,
  onNext,
}: {
  exercise: Exercise;
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onCheck?: (results: Grade[]) => void;
  review?: boolean;
  exam?: boolean;
  onNext?: () => void;
}) {
  const [results, setResults] = useState<Grade[] | null>(
    review ? grade(exercise, answers) : null,
  );
  const [invalid, setInvalid] = useState(false);
  const [repair, setRepair] = useState<string | null>(null);
  const hints = Number(answers._hints ?? 0);
  const shown = review ? grade(exercise, answers) : results;
  const correct = shown?.filter((r) => r.correct).length ?? 0;
  const edit = (id: string, value: string) => {
    onChange(id, value);
    if (!review) setResults(null);
    setInvalid(false);
  };
  const diagnoses = Array.from(
    new Set(
      shown
        ?.filter((r) => !r.correct && r.diagnosis)
        .map((r) => r.diagnosis as string) ?? [],
    ),
  );
  function check() {
    const r = grade(exercise, answers);
    if (r.some((x) => !x.valid)) {
      setInvalid(true);
      return;
    }
    setResults(r);
    setInvalid(false);
    onCheck?.(r);
  }
  return (
    <article className="exercise-card">
      <div className="exercise-meta">
        <span className="pill">
          {exercise.kind === "radar"
            ? "Transactieradar"
            : exercise.kind === "sort"
              ? "Balanspostentrainer"
              : exercise.kind === "schedule"
                ? "Rekenschema"
                : exercise.kind === "matrix"
                  ? "Begrippen & bedragen"
                  : "Financiële werkruimte"}
        </span>
        <span className="small muted">
          {"●".repeat(exercise.level)}
          {"○".repeat(3 - exercise.level)} · {exercise.fields.length} punten
        </span>
      </div>
      <h2>{exercise.title}</h2>
      <p className="question">{exercise.prompt}</p>
      {exercise.context && (
        <details className="context">
          <summary>
            Bekijk de gebeurtenissen ({exercise.context.length})
          </summary>
          <ol>
            {exercise.context.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ol>
        </details>
      )}
      {!exam && !review && exercise.kind === "sort" && (
        <SortTrainer
          fields={exercise.fields}
          answers={answers}
          onChange={edit}
        />
      )}
      <form
        onKeyDown={(e) => {
          if (
            (e.key === "ArrowDown" || e.key === "ArrowUp") &&
            e.target instanceof HTMLInputElement
          ) {
            e.preventDefault();
            const inputs = Array.from(
              e.currentTarget.querySelectorAll<HTMLInputElement>(
                "input:not(:disabled)",
              ),
            );
            const index = inputs.indexOf(e.target);
            inputs[index + (e.key === "ArrowDown" ? 1 : -1)]?.focus();
          }
        }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!exam) check();
        }}
      >
        <div
          className={
            "answer-table " + (exercise.kind === "radar" ? "radar-table" : "")
          }
        >
          <div className="table-heading">
            <span>
              {exercise.kind === "radar" ? "Balanspost / effect" : "Onderdeel"}
            </span>
            <span>Jouw antwoord</span>
          </div>
          {exercise.fields.map((f, i) => {
            const result = shown?.find((r) => r.field === f.id);
            const fid = `${exercise.id}-${f.id}`;
            return (
              <div
                className={
                  "answer-row " +
                  (result
                    ? result.correct
                      ? "is-correct"
                      : "is-incorrect"
                    : "")
                }
                key={f.id}
              >
                <label htmlFor={fid}>{f.label}</label>
                <div className="answer-control">
                  {f.kind === "choice" ? (
                    <select
                      id={fid}
                      disabled={review}
                      value={answers[f.id] ?? ""}
                      onChange={(e) => edit(f.id, e.target.value)}
                      aria-invalid={
                        result ? !result.correct : invalid && !answers[f.id]
                      }
                    >
                      <option value="">Kies…</option>
                      {f.options?.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="money-input">
                      {f.kind === "money" && <span aria-hidden="true">€</span>}
                      <input
                        id={fid}
                        autoComplete="off"
                        type="text"
                        inputMode={f.kind === "money" ? "decimal" : "text"}
                        placeholder={
                          f.kind === "money" ? "0,00" : "Jouw antwoord"
                        }
                        value={answers[f.id] ?? ""}
                        onChange={(e) => edit(f.id, e.target.value)}
                        disabled={review}
                        aria-invalid={
                          result
                            ? !result.correct
                            : invalid &&
                              (!answers[f.id] ||
                                (f.kind === "money" &&
                                  parseMoney(answers[f.id]) === null))
                        }
                      />
                    </div>
                  )}
                  {result && (
                    <span className="field-feedback">
                      {result.correct ? (
                        <>
                          <Check size={14} /> Goed
                        </>
                      ) : (
                        <>
                          <span>
                            {result.errorKind === "begrip"
                              ? "Begripsfout"
                              : "Reken- of invoerfout"}{" "}
                            · Correct:{" "}
                            {typeof f.answer === "number"
                              ? euro(f.answer)
                              : f.answer}
                          </span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {invalid && (
          <p className="error" role="alert">
            Vul alle antwoorden in. Gebruik voor bedragen de Nederlandse
            notatie, bijvoorbeeld 1.250,50. Vul 0 in als er geen effect is.
          </p>
        )}
        {!exam && !review && (
          <div className="exercise-actions">
            <button className="button primary" type="submit">
              <CheckCircle2 size={18} />
              Controleer mijn antwoord
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={hints >= 3}
              onClick={() => onChange("_hints", String(hints + 1))}
            >
              <Lightbulb size={18} />
              {hints >= 3 ? "Alle hints gebruikt" : `Hint ${hints + 1} van 3`}
            </button>
          </div>
        )}
      </form>
      {!exam && hints > 0 && !review && (
        <aside className="hint" aria-live="polite">
          <Lightbulb size={20} />
          <div>
            <strong>Hint {hints}</strong>
            <p>{exercise.hints[hints - 1]}</p>
          </div>
        </aside>
      )}
      {shown && (
        <div
          className={
            "feedback " +
            (correct === exercise.fields.length ? "success" : "retry")
          }
          role="status"
        >
          <div className="feedback-title">
            {correct === exercise.fields.length ? (
              <CheckCircle2 />
            ) : (
              <AlertCircle />
            )}
            <h3>
              {correct === exercise.fields.length
                ? "Dit klopt. Goed geredeneerd!"
                : "Kijk nog eens naar het verschil."}
            </h3>
            <b>
              {correct}/{exercise.fields.length}
            </b>
          </div>
          <p>{exercise.explanation}</p>
          {exercise.kind === "radar" && (
            <div
              className="result-flow"
              aria-label="Samenhang van de geldstroom en het resultaat"
            >
              {[
                ["receipt", "Ontvangst"],
                ["revenue", "Opbrengst"],
                ["cost", "Kosten"],
                ["result", "Resultaat"],
              ].map(([id, label], i) => {
                const f = exercise.fields.find((x) => x.id === id);
                return (
                  <div key={id} style={{ animationDelay: `${i * 100}ms` }}>
                    <span>{label}</span>
                    <strong>
                      {typeof f?.answer === "number" ? euro(f.answer) : "—"}
                    </strong>
                    {i < 3 && <ArrowRight size={15} />}
                  </div>
                );
              })}
            </div>
          )}
          {correct < exercise.fields.length && (
            <p className="small">
              Een verkeerd bedrag kan een rekenfout zijn. De volgende begrippen
              helpen je controleren of de redenering ook klopt.
            </p>
          )}
          {diagnoses.map((id) => (
            <button
              className="diagnosis"
              key={id}
              onClick={() => setRepair(repair === id ? null : id)}
            >
              {mistake(id).title}
              <ArrowRight size={15} />
            </button>
          ))}
          {repair && <Repair id={repair} />}
          <div className="exercise-actions">
            {!review && correct < exercise.fields.length && (
              <button
                className="button secondary"
                onClick={() => setResults(null)}
              >
                <RotateCcw size={16} />
                Opnieuw proberen
              </button>
            )}
            {onNext && (
              <button className="button primary" onClick={onNext}>
                Volgende stap
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        </div>
      )}
      <p className="source-note">{exercise.source}</p>
    </article>
  );
}
