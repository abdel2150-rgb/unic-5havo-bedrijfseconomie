# UniC · Bedrijfseconomie 5 havo

Een Nederlandstalige, statisch hostbare leeromgeving over **De eenmanszaak**. React, TypeScript, Vite en Tailwind; geen accounts of backend nodig.

## Starten

Benodigd: Node.js 24 en npm 11 (de geteste omgeving gebruikt Node 24.19.0). Gebruik de bestaande checkout; iedere cloudtaak is al geïsoleerd. Maak alleen op expliciet verzoek een Git-worktree.

```bash
cd /workspace/unic-5havo-bedrijfseconomie
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run dev -- --port 5173
```

## Controleren en bouwen

```bash
npm test
npm run build
npm run test:e2e
```

De browsertests gebruiken `/usr/bin/chromium`. Op een andere machine kun je `CHROMIUM_PATH` op het pad van een geschikte Chromium-installatie zetten. Playwright start voor de tests zelf Vite. De integrale simulatietest vult alle stappen in en duurt circa een minuut.

`npm run build` genereert `dist/`. Publiceer de **inhoud van dist/** bij een statische HTTPS-host. Er zijn geen servervariabelen of geheime sleutels nodig. `base: './'` ondersteunt ook een submap. Er is geen routerfallback nodig. Publicatie is niet uitgevoerd door deze bouwopdracht.

## Beschikbare onderdelen

- Vier hoofdstukmodules: 12, 10, 12 en 10 originele oefeningen, met nieuwe bedragvarianten, theorie en gekoppelde leerdoelen.
- Balansposten slepen of kiezen, investering/financiering, volledige begin- en eindbalansen, mutatiebalansen, btw, voorraad/omzet, krediettermijnen, kosten/uitgaven, opbrengsten/ontvangsten, leningen/annuïteiten, afschrijving, liquiditeit, exploitatie en resultaat.
- Eén financiële motor in gehele centen; periodeboeking via expliciete transacties; invarianten en tests. De 18-gebeurtenissencasus gebruikt deze motor voor begrotingen, realisatie, afwijkingen, mutatiebalans en eindbalans.
- Oefenmodus met drie oplopende hints, deelvraagfeedback, 25 misvattingen met voorbeelden/herstelvragen en vrij opnieuw proberen.
- Onbeveiligde formatieve oefentoets per module: één punt per deelvraag, geen tussentijdse hints of antwoorden, definitief inleveren, model en score achteraf. Andere onderdelen blijven in de interface gesloten zolang een toets actief is; tabbladen synchroniseren via IndexedDB/BroadcastChannel.
- IndexedDB voor alias (optioneel), antwoorden, resultaten, pogingen, fouten, beheersing en simulatie. Voortgang exporteren/importeren. Exporteer vóór apparaatwissel of wissen van browsergegevens.
- Lokale docentwerkplaats: opgaven toevoegen met meerdere deelvragen, leerdoel, niveau, hints en bron; JSON/CSV-import met sjablonen, export en activeren/deactiveren. JSON biedt tekstalternatieven en foutdiagnoses. CSV ondersteunt één bedrag per opgave. Schermonderdelen zijn met toetsenbord te bedienen; in rekentabellen springen pijltjes omhoog/omlaag tussen de invoervelden.
- Register van alle 46 Cumulus-bronopgaven met nummer, titel, paragraaf, pagina’s in beide boeken, leerdoel, voorkennis, werkvorm, niveau en gebruiksstatus.

## Bronnen en grenzen

De aangeleverde PDF’s zijn lokaal geanalyseerd en staan **niet** in de applicatie, `public/` of `dist/`. De website bevat eigen parallelopgaven, geen volledige uitgeversopgaven of antwoordmodellen. Zie [bronnenanalyse](docs/bronnenanalyse.md) en het [technisch ontwerp](docs/technisch-ontwerp.md).

OSSAcademie-video’s hebben per leerdoel een plek in `src/content/videos.ts`. **Er zijn nog geen links inhoudelijk geverifieerd.** De UI vermeldt dat eerlijk. Voeg pas na controle een echte HTTPS-URL, verificatiedatum en twee of drie controlevragen toe. De videocomponent ondersteunt een gewone link, een privacyvriendelijke YouTube-embed en controle van de vragen. Er zijn geen verzonnen videolinks opgenomen.

Een statische website kan antwoorden niet beveiligen: deze zijn in de gedownloade code en lokale data inspecteerbaar. Gebruik de toets uitsluitend formatief. Het beheerscherm is lokaal, zonder docentauthenticatie, en is geen beveiligde publicatietool voor beschermde antwoorden. Willekeurige open betogen worden niet semantisch beoordeeld; korte begrippen gebruiken expliciet toegestane equivalente formuleringen. Een balans die sluit is een noodzakelijke, maar niet voldoende, controle op correcte boekingen.

## Financiële controlecasus

Studio Sole begint met € 26.000 activa. Na de 18 werkelijke gebeurtenissen:

| Controle                          |      Bedrag |
| --------------------------------- | ----------: |
| Opbrengsten                       | € 12.000,00 |
| Kosten                            |  € 7.450,00 |
| Resultaat                         |  € 4.550,00 |
| Ontvangsten                       | € 13.100,00 |
| Uitgaven                          |  € 5.975,00 |
| Eindbank                          | € 16.185,00 |
| Eigen vermogen eind               | € 21.250,00 |
| Eindbalanstotaal aan beide zijden | € 35.085,00 |

De afzonderlijke verwachte cijfers geven € 4.900 winst en € 16.890 eindbank. De leerlingen verwerken de afwijkingen en stellen daarna de gerealiseerde overzichten op.

## Publiceren via GitHub Pages

De broncode staat op `main`. Alleen de gebouwde statische website wordt naar `gh-pages` gepubliceerd:

```bash
bash scripts/publish-pages.sh
```

Het script test en bouwt eerst, gebruikt een afzonderlijke tijdelijke Git-index, behoudt de broncheckout en pusht zonder force. De originele bron-PDF’s worden niet meegenomen.

Selecteer eenmalig in de GitHub-repository **Settings → Pages → Build and deployment**:

- Source: **Deploy from a branch**
- Branch: **gh-pages**
- Folder: **/ (root)**

Sla dit op. GitHub toont de website-URL zodra de Pages-publicatie voltooid is. Het activeren van deze repository-instelling via de API is in de huidige cloudomgeving geblokkeerd doordat `api.github.com` niet op de netwerkallowlist staat.
