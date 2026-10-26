import { useState } from "react";
import { Download, Plus, Upload, Trash2 } from "lucide-react";
import type { Exercise, Field } from "../lib/exercises";
import { goals, modules } from "../content/curriculum";
import { mistakes } from "../content/mistakes";
import {
  csvTemplate,
  importCSV,
  importExercises,
  template,
  validateExercise,
} from "../lib/importer";
import { download } from "../lib/storage";
import { parseMoney } from "../lib/money";
interface DraftField {
  label: string;
  kind: Field["kind"];
  answer: string;
  options: string;
  alternatives: string;
  diagnosis: string;
}
const blank = (): DraftField => ({
  label: "Antwoord",
  kind: "money",
  answer: "",
  options: "",
  alternatives: "",
  diagnosis: "",
});
export function Teacher({
  custom,
  onSave,
}: {
  custom: Exercise[];
  onSave: (ex: Exercise[]) => void;
}) {
  const [title, setTitle] = useState(""),
    [module, setModule] = useState("3.1"),
    [prompt, setPrompt] = useState(""),
    [goal, setGoal] = useState("balans"),
    [level, setLevel] = useState(2),
    [hints, setHints] = useState(["", "", ""]),
    [explanation, setExplanation] = useState(""),
    [source, setSource] = useState("Eigen opgave"),
    [fields, setFields] = useState<DraftField[]>([blank()]),
    [notice, setNotice] = useState("");
  async function load(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw Error("Maximaal 2 MB.");
      const raw = await file.text();
      const rows = file.name.endsWith(".csv")
        ? importCSV(raw)
        : importExercises(raw);
      if (rows.some((x) => custom.some((c) => c.id === x.id)))
        throw Error("Een id bestaat al. Kies unieke id’s vóór import.");
      onSave([...custom, ...rows]);
      setNotice(`${rows.length} opgave(n) lokaal geïmporteerd.`);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function add() {
    try {
      const mapped: Field[] = fields.map((f, i) => {
        const amount = parseMoney(f.answer);
        if (f.kind === "money" && amount === null)
          throw Error(`Ongeldig bedrag bij deelvraag ${i + 1}.`);
        return {
          id: `f${i}`,
          label: f.label,
          kind: f.kind,
          answer: f.kind === "money" ? amount! : f.answer,
          options:
            f.kind === "choice"
              ? f.options.split("|").map((s) => s.trim())
              : undefined,
          alternatives:
            f.kind === "text"
              ? f.alternatives
                  .split("|")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
          diagnosis: f.diagnosis || undefined,
        };
      });
      const ex = validateExercise({
        id: `docent-${crypto.randomUUID()}`,
        module,
        title,
        prompt,
        goal: [goal],
        fields: mapped,
        hints,
        explanation,
        source,
        level,
        kind: mapped.length > 1 ? "matrix" : "table",
        active: true,
      });
      onSave([...custom, ex]);
      setNotice("Je opgave is toegevoegd en staat in de gekozen module.");
      setTitle("");
      setPrompt("");
      setFields([blank()]);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DOCENTWERKPLAATS</p>
          <h1>Maak het eigen.</h1>
          <p>Voeg oefeningen toe zonder code. Alles blijft op dit apparaat.</p>
        </div>
      </div>
      <aside className="notice">
        Antwoorden van een statische website zijn technisch uitleesbaar. Dit
        beheerscherm biedt geen toegangsbeveiliging. Importeer geen beschermde
        Cumulus-antwoorden voor openbare verspreiding. De bron-PDF’s worden niet
        gepubliceerd.
      </aside>
      <div className="toolbar">
        <button
          className="button secondary"
          onClick={() => download("opgave-sjabloon.json", [template])}
        >
          <Download size={17} />
          JSON-sjabloon
        </button>
        <button
          className="button secondary"
          onClick={() => download("opgave-sjabloon.csv", csvTemplate)}
        >
          <Download size={17} />
          CSV-sjabloon
        </button>
        <label className="button secondary">
          <Upload size={17} />
          Importeer JSON / CSV
          <input
            type="file"
            accept=".json,.csv"
            className="file-hidden"
            onChange={(e) => {
              load(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button
          className="button secondary"
          onClick={() => download("eigen-opgaven.json", custom)}
        >
          <Download size={17} />
          Exporteer eigen opgaven
        </button>
      </div>
      <p className="small muted">
        JSON: bedragen in gehele centen, drie hints en leerdoelcodes. CSV: één
        bedrag per opgave, komma als scheidingsteken, antwoord in centen.
        Gebruik het sjabloon. Voor meerdere leerdoelen: JSON.
      </p>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <form
        className="panel teacher-form"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <h2>Een oefening toevoegen</h2>
        <div className="form-grid">
          <label>
            Titel
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            Paragraaf
            <select
              aria-label="Paragraaf"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} {m.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Leerdoel
            <select
              aria-label="Leerdoel"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              {Object.entries(goals).map(([id, label]) => (
                <option key={id} value={id}>
                  {id} · {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Niveau
            <select
              aria-label="Niveau"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            >
              <option value={1}>1 · Begrijpen</option>
              <option value={2}>2 · Toepassen</option>
              <option value={3}>3 · Combineren</option>
            </select>
          </label>
        </div>
        <label>
          Vraag en gegevens
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={3}
          />
        </label>
        {fields.map((f, i) => (
          <fieldset className="field-editor" key={i}>
            <legend>Deelvraag {i + 1}</legend>
            <div className="form-grid">
              <label>
                Veldnaam
                <input
                  value={f.label}
                  required
                  onChange={(e) =>
                    setFields(
                      fields.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Antwoordtype
                <select
                  aria-label="Antwoordtype"
                  value={f.kind}
                  onChange={(e) =>
                    setFields(
                      fields.map((x, j) =>
                        j === i
                          ? { ...x, kind: e.target.value as Field["kind"] }
                          : x,
                      ),
                    )
                  }
                >
                  <option value="money">Bedrag (invoer in euro)</option>
                  <option value="text">Begrip of korte tekst</option>
                  <option value="choice">Keuzevraag</option>
                </select>
              </label>
              <label>
                Correct antwoord
                <input
                  value={f.answer}
                  required
                  onChange={(e) =>
                    setFields(
                      fields.map((x, j) =>
                        j === i ? { ...x, answer: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              {f.kind === "choice" && (
                <label>
                  Keuzes, gescheiden door |
                  <input
                    value={f.options}
                    required
                    onChange={(e) =>
                      setFields(
                        fields.map((x, j) =>
                          j === i ? { ...x, options: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
              )}
              <label>
                Uitleg bij een veelgemaakte fout (optioneel)
                <select
                  aria-label="Uitleg bij een veelgemaakte fout (optioneel)"
                  value={f.diagnosis}
                  onChange={(e) =>
                    setFields(
                      fields.map((x, j) =>
                        j === i ? { ...x, diagnosis: e.target.value } : x,
                      ),
                    )
                  }
                >
                  <option value="">Algemene feedback</option>
                  {mistakes.map((m) => (
                    <option value={m.id} key={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
              {f.kind === "text" && (
                <label>
                  Equivalente antwoorden, gescheiden door |
                  <input
                    value={f.alternatives}
                    onChange={(e) =>
                      setFields(
                        fields.map((x, j) =>
                          j === i ? { ...x, alternatives: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
              )}
            </div>
            {fields.length > 1 && (
              <button
                className="button text-button"
                type="button"
                onClick={() => setFields(fields.filter((_, j) => i !== j))}
              >
                <Trash2 size={16} />
                Deelvraag verwijderen
              </button>
            )}
          </fieldset>
        ))}
        <button
          className="button secondary"
          type="button"
          onClick={() => setFields([...fields, blank()])}
        >
          <Plus size={16} />
          Deelvraag toevoegen
        </button>
        <label>
          Uitleg na controle
          <textarea
            value={explanation}
            required
            onChange={(e) => setExplanation(e.target.value)}
          />
        </label>
        <div className="form-grid">
          {hints.map((h, i) => (
            <label key={i}>
              Hint {i + 1}
              <input
                value={h}
                required
                onChange={(e) =>
                  setHints(hints.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
            </label>
          ))}
          <label>
            Bronvermelding
            <input
              value={source}
              required
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
        </div>
        <button className="button primary" type="submit">
          <Plus size={18} />
          Oefening lokaal opslaan
        </button>
      </form>
      <section className="panel">
        <h2>Eigen oefeningen ({custom.length})</h2>
        {custom.length === 0 ? (
          <p className="muted">Je hebt nog geen eigen oefeningen toegevoegd.</p>
        ) : (
          custom.map((ex) => (
            <div className="custom-row" key={ex.id}>
              <div>
                <strong>{ex.title}</strong>
                <p className="small muted">
                  {ex.module} · {ex.fields.length} deelvragen
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={ex.active}
                  onChange={() =>
                    onSave(
                      custom.map((x) =>
                        x.id === ex.id ? { ...x, active: !x.active } : x,
                      ),
                    )
                  }
                />
                Actief
              </label>
              <button
                className="button text-button"
                onClick={() => {
                  if (
                    confirm(
                      `Oefening “${ex.title}” verwijderen? Exporteer eerst als je deze wilt bewaren.`,
                    )
                  )
                    onSave(custom.filter((x) => x.id !== ex.id));
                }}
                aria-label={`Verwijder ${ex.title}`}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))
        )}
      </section>
    </>
  );
}
