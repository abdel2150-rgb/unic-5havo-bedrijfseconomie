# Oplevering

## Gerealiseerd

| Onderdeel | Status |
| --- | --- |
| Bronnenonderzoek | Beide aangeleverde hoofdstukken geanalyseerd; register van alle 46 opgaven met pagina’s en leerdoelen |
| Module 3.1 | 12 originele interactieve oefeningen, theorie, investerings- en financieringsbegroting, classificatie en beginbalans |
| Module 3.2 | 10 originele oefeningen, transactieradar, btw, voorraad, omzet, brutowinst en krediettermijnen |
| Module 3.3 | 12 originele oefeningen, matrices, lineaire/annuïtaire schema’s, interest, afschrijving en overlopende posten |
| Module 3.4 | 10 originele oefeningen, liquiditeit, exploitatie, resultaat, volledige mutatie- en eindbalans |
| Simulatie | 18 verwachte gebeurtenissen, begrotingen, werkelijke afwijkingen, resultaat, mutatiebalans en eindbalans; stappen worden vrijgegeven na een volledig juist antwoord |
| Feedback | Drie hintniveaus, punten per deelvraag, 25 misvattingen met nieuw voorbeeld en herstelvraag; patroonherkenning voor typische begripsfouten tegenover reken-/invoerfouten |
| Oefentoets | Geen hints of feedback vóór definitieve inlevering; andere onderdelen in de interface afgesloten, beoordeling achteraf en opnieuw oefenen |
| Voortgang | IndexedDB; antwoorden, pogingen, hints, resultaten, fouten, beheersing en simulatie; optionele alias; JSON-export/import |
| Docentwerkplaats | Formulier voor meerdere deelvragen, begripalternatieven, foutdiagnose, hints, niveau, bron; JSON/CSV-sjablonen en import/export, activeren/deactiveren |
| Publicatie | Productiebuild in dist/; afzonderlijk ZIP-pakket van alleen de statische website |
| Cloudconfiguratie | install_script en start_skill als concept opgeslagen; publicatie door de gebruiker nog nodig |

## Verificatie

- Herhaalbare installatie met `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` geslaagd.
- 74 unit- en inhoudstests geslaagd. Hierbij zijn alle transactietypen, btw, periodetoerekening, leningen/afronding, afschrijving, volledige casuseindstanden, 44 opgaven in meerdere varianten, beoordelingslogica en imports gecontroleerd.
- Zes browserworkflows samen geslaagd: dashboard, hints en lokale opslag; classificatie en herstel; oefentoets en tweede tabblad; docentimport en export; volledige simulatie; mobiele lay-out en bronnen/theorie.
- De aanvullende zevende browserworkflow voor een opgave toevoegen via het docentformulier is na correctie van de toegankelijke selectnamen afzonderlijk geslaagd.
- TypeScript en Vite-productiebuild geslaagd.
- De productiebuild is via een gewone statische webserver geladen en de investeringsbegroting is daadwerkelijk ingevuld en correct beoordeeld, zonder browserfouten.
- Het publicatiepakket is op ZIP-integriteit gecontroleerd en bevat geen PDF-bronbestanden.

## Nog open en grenzen

- Actuele OSSAcademie-videolinks zijn niet geverifieerd. Het inhoudsbestand bevat een plek per leerdoel; de component ondersteunt echte HTTPS-links, YouTube-embeds en controlevragen zodra gecontroleerde gegevens zijn toegevoegd. Er zijn nog geen concrete gekoppelde video’s of bijbehorende videospecifieke vragen.
- De broncode en statische websitebestanden zijn naar GitHub gestuurd. De live bereikbaarheid van GitHub Pages kan vanuit deze omgeving niet worden geverifieerd. De cloudconfiguratie moet afzonderlijk worden gepubliceerd; een werkende huidige instantie is geen bewijs van herstel in een nieuwe taak.
- De broncode wordt gepubliceerd op main en de statische build op gh-pages. De GitHub Pages-instelling moet eenmalig op gh-pages / (root) staan; API-toegang voor automatische activering is in deze omgeving geblokkeerd.
- Korte tekstvelden herkennen gedefinieerde equivalente begrippen, geen willekeurige open betogen. Beheersingslabels zijn didactische signalen, geen gevalideerde leerlingmeting.
- Een statische website beveiligt antwoordmodellen niet. Gebruik de toets formatief. De lokale docentwerkplaats verwerkt eigen oefeningen; een afzonderlijke beveiligde/lokale verwerker voor beschermde uitgeversantwoorden is niet gebouwd en is voor deze parallelopgaven niet nodig.

## Balansen in T-vorm

Beginbalansen, eindbalansen en mutatiebalansen hebben activa/debet links en passiva/credit rechts. De leerling voegt bij mutatiebalansen alleen veranderde posten toe. Ontbrekende noodzakelijke posten en onterecht toegevoegde posten blijven fout; lege ongewijzigde posten leveren geen punten op. In volledige balansen en bij de aanvullende effecten van de transactieradar telt een leeg bedrag als nul. De totalen volgen uitsluitend uit de eigen invoer.

Alle negen browserworkflows zijn samen geslaagd, inclusief twee regressietests voor selectie/verwijderen/ontbrekende mutaties en een T-beginbalans met lege nulsaldi en opgeslagen invoer. De nieuwe T-balans is daarnaast op mobiele breedte gecontroleerd: de pagina loopt niet buiten beeld; de balans kan zo nodig binnen zijn eigen kader horizontaal scrollen.
