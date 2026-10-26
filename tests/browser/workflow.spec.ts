import { test, expect, type Page } from "@playwright/test";
import { exercises, simulationExercises } from "../../src/content/exercises";
import type { Exercise } from "../../src/lib/exercises";
import { inputMoney } from "../../src/lib/money";
import { template } from "../../src/lib/importer";
import {
  getBalanceFields,
  getBalanceMode,
  isAssetField,
} from "../../src/lib/balance-exercise";
async function ready(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welkom bij bedrijfseconomie." }),
  ).toBeVisible();
}
async function fillExercise(page: Page, exercise: Exercise) {
  const mode = getBalanceMode(exercise);
  const balanceIds = new Set(getBalanceFields(exercise).map((f) => f.id));
  for (const f of exercise.fields) {
    if (balanceIds.has(f.id) && f.answer === 0) continue;
    if (balanceIds.has(f.id) && mode === "mutation")
      await page
        .getByLabel(
          isAssetField(f)
            ? "Post toevoegen bij activa"
            : "Post toevoegen bij passiva",
        )
        .selectOption(f.id);
    const field = page.locator(`[id="${exercise.id}-${f.id}"]`);
    if (f.kind === "choice") await field.selectOption(String(f.answer));
    else
      await field.fill(
        typeof f.answer === "number" ? inputMoney(f.answer) : f.answer,
      );
  }
}
test("dashboard, vier modules, Nederlandse bedragen, hints en lokale opslag", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await page.screenshot({ path: "/tmp/unic-dashboard.png", fullPage: true });
  await page.getByRole("button", { name: "3.1 De beginbalans" }).click();
  await page
    .getByRole("button", { name: /02 Een sneakerzaak starten/ })
    .click();
  const ex = exercises().find((e) => e.id === "3.1-invest")!;
  await page.getByRole("button", { name: "Hint 1 van 3" }).click();
  await fillExercise(page, ex);
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(
    page.getByRole("heading", { name: "Dit klopt. Goed geredeneerd!" }),
  ).toBeVisible();
  await expect(page.getByText("5/5", { exact: true })).toBeVisible();
  await page.screenshot({ path: "/tmp/unic-trainer.png", fullPage: true });
  await page.getByRole("button", { name: "Mijn voortgang" }).click();
  await expect(page.getByText(/poging 1 · 1 hints/)).toBeVisible();
  await page.getByLabel("Leerlingalias (optioneel)").fill("Testleerling");
  await expect(
    page.getByText("Op dit apparaat opgeslagen").last(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welkom, Testleerling." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("classificeren zonder muis en fout herstellen", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "3.1 De beginbalans" }).click();
  const ex = exercises()[0];
  await fillExercise(page, ex);
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(page.getByText("12/12", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "3.2 Inkopen en verkopen" }).click();
  await page
    .getByRole("button", { name: /10 Een ontvangst zonder opbrengst/ })
    .click();
  await page.getByLabel("De balanspost", { exact: true }).fill("crediteuren");
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(
    page.getByText("Begripsfout · Correct: debiteuren", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Debiteurenbetaling is geen nieuwe omzet" })
    .click();
  await expect(
    page.getByText(/De omzet is al bij levering geboekt/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Opnieuw proberen" }).click();
  await page
    .getByLabel("De balanspost", { exact: true })
    .fill("vorderingen op klanten");
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(page.getByText("1/1", { exact: true })).toBeVisible();
});
test("oefentoets verbergt antwoorden, blokkeert navigatie en beoordeelt pas na inleveren", async ({
  page,
  context,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "3.1 De beginbalans" }).click();
  await page.getByRole("button", { name: "Start oefentoets" }).click();
  await expect(
    page.getByRole("button", { name: "3.2 Inkopen en verkopen" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: /Hint/ })).toHaveCount(0);
  await expect(page.getByText(/Correct:/)).toHaveCount(0);
  await fillExercise(page, exercises()[0]);
  const other = await context.newPage();
  await other.goto("/");
  await expect(
    other.getByRole("heading", { name: "Laat zien wat je al kunt." }),
  ).toBeVisible();
  await other.close();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Definitief inleveren" }).click();
  await expect(
    page.getByRole("heading", { name: "Je beoordeling" }),
  ).toBeVisible();
  await expect(page.getByText("12/12", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Vraag 2:/ }).click();
  await expect(page.getByText(/Correct:/).first()).toBeVisible();
  await expect(page.getByLabel("Inventaris exclusief btw")).toBeDisabled();
  await page.getByRole("button", { name: "Opnieuw oefenen" }).click();
  await expect(
    page.getByRole("button", { name: "3.2 Inkopen en verkopen" }),
  ).toBeEnabled();
});
test("docentimport, actieve eigen opgave en voortgangexport", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Docentwerkplaats" }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "eigen-opgave.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([template])),
  });
  await expect(
    page.getByText("1 opgave(n) lokaal geïmporteerd."),
  ).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Actief" })).toBeChecked();
  await page.getByRole("button", { name: "3.3 Kosten en uitgaven" }).click();
  await page.getByRole("button", { name: /13 Eigen aflossingsvraag/ }).click();
  await page.getByLabel("Kosten", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(page.getByText("1/1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mijn voortgang" }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporteer voortgang" }).click();
  expect((await dl).suggestedFilename()).toBe("unic-voortgang.json");
});
test("hele simulatie: begroting, 18 feiten, afwijkingen en sluitende eindbalans", async ({
  page,
}) => {
  test.setTimeout(120000);
  await ready(page);
  await page
    .getByRole("button", { name: "Bedrijfssimulatie", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /2 · Financieringsbegroting/ }),
  ).toBeDisabled();
  for (let i = 0; i < simulationExercises.length; i++) {
    const ex = simulationExercises[i];
    await expect(
      page.getByRole("heading", { name: ex.title, exact: true }),
    ).toBeVisible();
    await fillExercise(page, ex);
    await page
      .getByRole("button", { name: "Controleer mijn antwoord" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Dit klopt. Goed geredeneerd!" }),
    ).toBeVisible();
    if (i < simulationExercises.length - 1)
      await page
        .getByRole("button", { name: "Volgende stap", exact: true })
        .last()
        .click();
  }
  await expect(
    page.getByRole("heading", { name: "Je hebt Studio Sole doorgerekend." }),
  ).toBeVisible();
});
test("mobiel, navigatie, theorie en bronnenregister", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.screenshot({ path: "/tmp/unic-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Menu openen" }).click();
  await page.getByRole("button", { name: "Bronnenregister" }).click();
  await page.getByLabel("Zoek op nummer, titel of leerdoel").fill("3.22");
  await expect(
    page.getByText("Interest vooruit en achteraf betalen", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Menu openen" }).click();
  await page.getByRole("button", { name: "3.4 De eindbalans" }).click();
  await page.getByRole("tab", { name: "Theorie & leerdoelen" }).click();
  await page.getByRole("button", { name: "Van begin naar eind" }).click();
  await expect(page.getByText(/Eindsaldo geld = beginsaldo/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("docent maakt een opgave met foutdiagnose via het formulier", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Docentwerkplaats" }).click();
  await page
    .getByLabel("Titel", { exact: true })
    .fill("Zelfgemaakte aflossingsvraag");
  await page.getByLabel("Paragraaf", { exact: true }).selectOption("3.3");
  await page.getByLabel("Leerdoel", { exact: true }).selectOption("lening");
  await page
    .getByLabel("Vraag en gegevens")
    .fill("Je lost € 250 af. Wat zijn de kosten?");
  await page.getByLabel("Correct antwoord", { exact: true }).fill("0");
  await page
    .getByLabel("Uitleg bij een veelgemaakte fout (optioneel)")
    .selectOption("repay");
  await page
    .getByLabel("Uitleg na controle")
    .fill("Aflossing verlaagt bank en schuld; het resultaat verandert niet.");
  for (let i = 1; i <= 3; i++)
    await page
      .getByLabel(`Hint ${i}`, { exact: true })
      .fill(
        [
          "Denk aan de lening.",
          "Bank en lening dalen samen.",
          "Er is geen resultaatseffect.",
        ][i - 1],
      );
  await page.getByRole("button", { name: "Oefening lokaal opslaan" }).click();
  await expect(
    page.getByText("Je opgave is toegevoegd en staat in de gekozen module."),
  ).toBeVisible();
  await page.getByRole("button", { name: "3.3 Kosten en uitgaven" }).click();
  await page
    .getByRole("button", { name: /13 Zelfgemaakte aflossingsvraag/ })
    .click();
  await page.getByLabel("Antwoord", { exact: true }).fill("250");
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(
    page.getByRole("button", { name: "Aflossing is geen kostenpost" }),
  ).toBeVisible();
});

test("mutatiebalans in T-vorm: alleen veranderde posten, verwijderen en ontbrekende post herkennen", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "3.1 De beginbalans" }).click();
  await page.getByRole("button", { name: /07 De eerste aflossing/ }).click();
  const sheet = page.getByRole("region", { name: "Mutatiebalans in T-vorm" });
  await expect(sheet.getByRole("textbox")).toHaveCount(0);
  await sheet.getByLabel("Post toevoegen bij activa").selectOption("bank");
  await page.getByLabel("Bank · mutatie", { exact: true }).fill("-500");
  await sheet.getByLabel("Post toevoegen bij passiva").selectOption("loan");
  await page
    .getByLabel("Langlopende lening · mutatie", { exact: true })
    .fill("-500");
  await sheet.getByLabel("Post toevoegen bij activa").selectOption("equipment");
  await page.getByLabel("Inventaris · mutatie", { exact: true }).fill("50");
  await sheet.getByRole("button", { name: "Inventaris verwijderen" }).click();
  await expect(sheet.getByRole("textbox")).toHaveCount(2);
  await page.getByLabel("Uitgave", { exact: true }).fill("500");
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(
    page.getByRole("heading", { name: "Dit klopt. Goed geredeneerd!" }),
  ).toBeVisible();
  await expect(sheet.getByLabel("Totaal activa", { exact: true })).toHaveText(
    /500/,
  );
  await expect(sheet.getByLabel("Totaal passiva", { exact: true })).toHaveText(
    /500/,
  );
  await page.screenshot({ path: "/tmp/unic-t-balans.png", fullPage: true });
  await sheet
    .getByRole("button", { name: "Langlopende lening verwijderen" })
    .click();
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(sheet.getByText(/Deze post ontbreekt/)).toBeVisible();
});

test("beginbalans in T-vorm met lege nulsaldi en behouden invoer na herladen", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "3.1 De beginbalans" }).click();
  await page
    .getByRole("button", { name: /04 Bouw de hele beginbalans/ })
    .click();
  const e = exercises().find((e) => e.id === "3.1-opening")!;
  await fillExercise(page, e);
  await page.getByRole("button", { name: "Controleer mijn antwoord" }).click();
  await expect(
    page.getByRole("heading", { name: "Dit klopt. Goed geredeneerd!" }),
  ).toBeVisible();
  const sheet = page.getByRole("region", { name: "Balans in T-vorm" });
  await expect(sheet.getByLabel("Totaal activa", { exact: true })).toHaveText(
    /26.000/,
  );
  await expect(page.getByLabel("Kas", { exact: true })).toHaveValue("");
  await expect(
    page.getByText("Op dit apparaat opgeslagen").last(),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "3.1 De beginbalans" }).click();
  await page
    .getByRole("button", { name: /04 Bouw de hele beginbalans/ })
    .click();
  await expect(page.getByLabel("Bank", { exact: true })).toHaveValue("9060,00");
});
