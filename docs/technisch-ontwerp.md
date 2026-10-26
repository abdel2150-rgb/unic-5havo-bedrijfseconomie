# Technisch ontwerp

React 19 + TypeScript + Vite, Tailwind 4, Radix Accordion, dnd-kit met native select-alternatief en toetsenbordbediening. Statische HTTPS-hosting, geen accounts/server nodig. IndexedDB via idb bewaart alleen alias (optioneel), antwoorden, pogingen, hints, resultaten, fouten, varianten, simulatie en eigen opgaven. Exporteer voortgang vóór wissen van browsergegevens of wisselen van apparaat.

## Financieel model

Alle geldbedragen zijn gehele centen. Reken afronding half van nul af per boeking; bereken btw vanuit netto, of splits bruto met netto = afgerond(bruto/1,21). Het verschil is exact de btw. Schaalfactoren leveren reproduceerbare nieuwe parallelopgaven. Datums leggen het moment van boeken vast; overlopende bedragen worden met afzonderlijke transacties toegerekend/vereffend. De motor doet geen automatische maandafsluiting.

Een transactie levert een sluitende mutatiebalans, opbrengsten, kosten, ontvangsten en uitgaven op. De kas/bankmutatie is gelijk aan ontvangst min uitgave. Eigen vermogen stijgt met resultaat, plus kapitaalstortingen, minus privé-opnamen. Interne kas-bankoverboekingen zijn geen ondernemingsontvangsten. De motor weigert negatieve voorraad, vorderingen, schulden of liquide middelen; een rekening-courantkrediet is een afzonderlijke balanspost. Oefeningen veronderstellen aftrekbare btw tenzij vrijgesteld. Voorschotten worden netto als verplichting geboekt met btw bij ontvangst. Interest en loon zijn zonder btw. Verkoop vaste activa boekt boekwinst/verlies apart van handelsomzet.

De leningcalculator rekent met een expliciet periodepercentage en betalingen achteraf; aparte oefeningen behandelen vooruitbetaalde interest en aflossing vooraf. Bij afronding corrigeert de laatste termijn de schuld naar nul. Afschrijving is begrensd op restwaarde; periodieke cumulatieve afschrijving wordt vanuit de ongeronde grondslag berekend.

## Leerdata en beoordeling

Iedere opgave heeft leerdoelen, soort, niveau, velden, rubrieken, drie hints, uitleg en eigen bronlabel. Geldantwoorden worden exact op centen beoordeeld; Nederlandse komma’s en duizendtallen worden ondersteund. Tekstantwoorden gebruiken expliciete equivalente begrippen; dit is geen automatische semantische beoordeling van willekeurige betogen. Docenten kunnen alternatieven toevoegen. Iedere deelvraag is één punt.

Beheersing vraagt verschillende opgaven en voor het hoogste niveau ook verschillende werkvormen, zelfstandig in de eerste poging zonder hints. Geen claim van gevalideerde psychometrische meting. Een oefentoets houdt antwoorden/feedback verborgen tot definitief inleveren. De toetsset en antwoorden worden lokaal opgeslagen; actieve toets blokkeert andere onderdelen in de interface, ook via tabbladsynchronisatie. Dit is formatief en onbeveiligd: broncode en lokale gegevens bevatten antwoordmodellen en zijn inspecteerbaar. Een statische website kan geen summatieve toets beveiligen.

## Bronnen en docenttool

46 bronverwijzingen in het register; eigen parallelopgaven, geen beschermde PDF’s in de applicatie. Het beheerscherm bewaart imports uitsluitend lokaal op dit apparaat. JSON ondersteunt meerdere velden en tekstalternatieven. CSV ondersteunt eenvoudige één-bedragopgaven. Antwoorden in openbare statische assets zijn altijd uitleesbaar. Importeer geen beschermde antwoordmodellen voor openbaar verspreiden; voor beschermde verwerking is een afzonderlijke lokale docenttool nodig. Die tool is niet onderdeel van deze release.
