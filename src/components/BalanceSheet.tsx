import { useState } from "react";
import { X, Check } from "lucide-react";
import { accounts, type Account } from "../lib/finance";
import type { Exercise, Field, Grade } from "../lib/exercises";
import {
  getBalanceFields,
  getBalanceMode,
  isAssetField,
  isPostSelected,
  selectionKey,
} from "../lib/balance-exercise";
import { euro, parseMoney, sum } from "../lib/money";

export function BalanceSheet({
  exercise,
  answers,
  results,
  onChange,
  review,
  invalid,
}: {
  exercise: Exercise;
  answers: Record<string, string>;
  results: Grade[] | null;
  onChange: (id: string, value: string) => void;
  review: boolean;
  invalid: boolean;
}) {
  const mutation = getBalanceMode(exercise) === "mutation";
  const fields = getBalanceFields(exercise);
  const [removed, setRemoved] = useState("");
  function add(id: string) {
    if (!id) return;
    onChange(selectionKey(id), "1");
    onChange(id, "");
    setRemoved("");
    setTimeout(
      () => document.getElementById(`${exercise.id}-${id}`)?.focus(),
      0,
    );
  }
  function remove(f: Field) {
    onChange(selectionKey(f.id), "0");
    onChange(f.id, "");
    setRemoved(`${accounts[f.id as Account]} verwijderd.`);
  }
  function isVisible(f: Field) {
    return (
      !mutation || isPostSelected(f, answers) || (!!results && f.answer !== 0)
    );
  }
  const visible = fields.filter(isVisible);
  const total = (asset: boolean) => {
    const side = visible.filter((f) => isAssetField(f) === asset);
    if (
      side.some(
        (f) => answers[f.id]?.trim() && parseMoney(answers[f.id]) === null,
      )
    )
      return null;
    return sum(side.map((f) => parseMoney(answers[f.id] ?? "") ?? 0));
  };
  const leftTotal = total(true),
    rightTotal = total(false);
  return (
    <section
      className="balance-workspace"
      aria-label={mutation ? "Mutatiebalans in T-vorm" : "Balans in T-vorm"}
    >
      <div className="balance-sheet-title">
        <strong>{mutation ? "Mutatiebalans" : "Balans"}</strong>
        <span>
          {mutation
            ? "Alleen de veranderingen · bedragen in euro"
            : "Bedragen in euro"}
        </span>
      </div>
      <p className="balance-instructions">
        {mutation
          ? "Kies alleen de posten die veranderen en vul hun mutatie in. Een afname geef je met een minteken aan."
          : "Vul de bedragen in op de juiste balanszijde. Een leeg bedrag telt als nul."}
      </p>
      <div
        className="balance-scroll"
        tabIndex={0}
        aria-label="T-balans, indien nodig horizontaal scrollen"
      >
        <div className="t-balance">
          {[true, false].map((asset) => {
            const side = fields.filter((f) => isAssetField(f) === asset);
            const shown = side.filter(isVisible);
            const available = side.filter((f) => !isPostSelected(f, answers));
            const totalAmount = asset ? leftTotal : rightTotal;
            return (
              <div className="t-side" key={String(asset)}>
                <div className="t-side-heading">
                  <h3>{asset ? "Activa" : "Passiva"}</h3>
                  <span>{asset ? "Debet" : "Credit"}</span>
                </div>
                {mutation && !review && (
                  <div className="t-add">
                    <select
                      aria-label={
                        asset
                          ? "Post toevoegen bij activa"
                          : "Post toevoegen bij passiva"
                      }
                      value=""
                      onChange={(e) => add(e.target.value)}
                      disabled={available.length === 0}
                    >
                      <option value="">+ Post toevoegen…</option>
                      {available.map((f) => (
                        <option key={f.id} value={f.id}>
                          {accounts[f.id as Account]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="t-rows">
                  {shown.length === 0 && (
                    <p className="t-empty">
                      {review
                        ? "Geen posten opgenomen."
                        : "Geen posten toegevoegd."}
                    </p>
                  )}
                  {shown.map((f) => {
                    const result = results?.find((r) => r.field === f.id);
                    const selected = isPostSelected(f, answers);
                    const missing = mutation && !selected && f.answer !== 0;
                    const fid = `${exercise.id}-${f.id}`;
                    return (
                      <div
                        className={
                          "t-row " +
                          (result
                            ? result.correct
                              ? "is-correct"
                              : "is-incorrect"
                            : "")
                        }
                        key={f.id}
                      >
                        <div className="t-entry">
                          <label htmlFor={fid}>
                            {accounts[f.id as Account]}
                          </label>
                          <div className="money-input">
                            <span aria-hidden="true">€</span>
                            <input
                              id={fid}
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              placeholder={mutation ? "Mutatie" : "—"}
                              aria-label={f.label}
                              aria-invalid={
                                result
                                  ? !result.correct
                                  : invalid &&
                                    !!answers[selectionKey(f.id)] &&
                                    parseMoney(answers[f.id] ?? "") === null
                              }
                              value={answers[f.id] ?? ""}
                              disabled={review}
                              onChange={(e) => {
                                if (mutation) onChange(selectionKey(f.id), "1");
                                onChange(f.id, e.target.value);
                              }}
                            />
                          </div>
                          {mutation && !review && (
                            <button
                              className="t-remove"
                              type="button"
                              aria-label={`${accounts[f.id as Account]} verwijderen`}
                              onClick={() => remove(f)}
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                        {result && (
                          <div className="field-feedback">
                            {result.correct ? (
                              <>
                                <Check size={13} />
                                Goed
                              </>
                            ) : f.answer === 0 ? (
                              "Deze post verandert niet. Verwijder deze post."
                            ) : (
                              <>
                                {missing ? "Deze post ontbreekt. " : ""}Correct:{" "}
                                {euro(f.answer as number)}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="t-total">
                  <strong>{mutation ? "Totale mutatie" : "Totaal"}</strong>
                  <output
                    aria-label={asset ? "Totaal activa" : "Totaal passiva"}
                  >
                    {totalAmount === null ? "—" : euro(totalAmount)}
                  </output>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="t-difference">
        <span>Verschil debet − credit</span>
        <output>
          {leftTotal === null || rightTotal === null
            ? "—"
            : euro(leftTotal - rightTotal)}
        </output>
      </div>
      <p className="sr-only" role="status">
        {removed}
      </p>
    </section>
  );
}
