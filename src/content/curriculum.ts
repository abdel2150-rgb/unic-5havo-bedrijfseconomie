export const modules = [
  {
    id: "3.1",
    title: "De beginbalans",
    short: "Van idee naar start",
    description:
      "Wat heb je nodig, en hoe betaal je dat? Bouw een financieel vertrekpunt.",
    icon: "balance",
    goals: ["balans", "investeren", "financieren", "krediet", "mutaties"],
    theory: [
      [
        "Een plan met drie delen",
        "Een ondernemingsplan bevat een persoonlijk plan, marketingplan en financieel plan. Het financiële plan verbindt investeringen, financiering, resultaat en liquiditeit.",
      ],
      [
        "Activa: wat doe je met het geld?",
        "Vaste activa gaan langer dan een jaar mee. Vlottende activa worden op korte termijn omgezet of verbruikt. Bank en kas zijn liquide middelen. Orden in die volgorde. Voorraad en inventaris staan exclusief terugvorderbare btw op de balans; debiteuren inclusief btw.",
      ],
      [
        "Passiva: waar komt het geld vandaan?",
        "Eigen vermogen is permanent beschikbaar. Lang vreemd vermogen heeft een looptijd langer dan één jaar; kort vreemd vermogen maximaal één jaar. Een lening, leverancierskrediet en eigen inbreng financieren bezittingen. Crowdfunding kan verschillende vormen hebben.",
      ],
      [
        "Vier kredietvormen",
        "Later betaald krijgen na levering: verstrekt leverancierskrediet (debiteuren). Later betalen na ontvangst: ontvangen leverancierskrediet (crediteuren). Vooruitbetalen: verstrekt afnemerskrediet (vooruitbetaalde bedragen). Een voorschot ontvangen: ontvangen afnemerskrediet (vooruitontvangen bedragen).",
      ],
      [
        "De balans blijft in evenwicht",
        "Activa = eigen vermogen + vreemd vermogen. In een mutatiebalans noteer je alleen de veranderingen, met plus of min. Een afname op beide zijden is ook een sluitende mutatie.",
      ],
    ],
  },
  {
    id: "3.2",
    title: "Inkopen en verkopen",
    short: "Volg de transactie",
    description:
      "Ontdek wat een verkoop doet met voorraad, btw, winst en geld.",
    icon: "radar",
    goals: ["btw", "omzet", "voorraad", "geldstromen", "mutaties"],
    theory: [
      [
        "Levering en betaling zijn verschillende momenten",
        "Bij geleverde goederen ontstaat omzet exclusief btw. Bij verkoop op rekening ontstaat eerst een vordering inclusief btw. Pas bij betaling volgt een ontvangst; die betaling levert geen tweede omzet op.",
      ],
      [
        "Voorraad en brutowinst",
        "Eindvoorraad = beginvoorraad + inkopen − inkoopwaarde van de omzet. De inkoopwaarde hoort bij de verkochte artikelen, niet bij alle inkopen. Brutowinst = omzet − inkoopwaarde van de omzet.",
      ],
      [
        "Btw is geen winst",
        "Bij 21% btw: inclusief = exclusief × 1,21; exclusief = inclusief ÷ 1,21. Vorderbare btw ontstaat bij een inkoopfactuur, ook als je die later betaalt. Te betalen btw ontstaat bij de verkoopfactuur.",
      ],
      [
        "Krediettermijnen verschuiven geld",
        "Bij één maand krediet ontvang je in februari het op rekening verkochte deel van januari. Voor contante verkoop tel je het deel van februari. Gebruik de factuurbedragen inclusief btw.",
      ],
    ],
  },
  {
    id: "3.3",
    title: "Kosten en uitgaven",
    short: "Denk in perioden",
    description:
      "Geld dat je betaalt is niet altijd een kostenpost. Leer het verschil.",
    icon: "timeline",
    goals: ["kosten", "geldstromen", "lening", "afschrijving", "overlopend"],
    theory: [
      [
        "Kosten horen bij een periode",
        "Een uitgave is een betaling op een datum. Kosten drukken het resultaat van de periode waarin je de middelen verbruikt. Betaal je drie maanden huur vooruit, dan is er één uitgave maar zijn er drie maanden huurkosten.",
      ],
      [
        "Interest en aflossing",
        "Aflossing verlaagt schuld én bank; het resultaat verandert niet. Interest is de vergoeding voor geleend geld en vormt kosten. Reken met de schuld die in die periode uitstaat en zet de jaarrente om naar de juiste periode.",
      ],
      [
        "Vooraf of achteraf",
        "Betaalde maar nog niet verbruikte interest is een actief: vooruitbetaalde bedragen. Al toegerekende maar nog niet betaalde interest is een schuld: nog te betalen bedragen. Teken eerst de betaal- en aflossingsmomenten op een tijdlijn.",
      ],
      [
        "Lineair en annuïtair",
        "Lineair: elke periode dezelfde aflossing; interest daalt. Annuïtair: een gelijk termijnbedrag, met dalende interest en stijgende aflossing. De laatste termijn kan een afrondingscorrectie bevatten.",
      ],
      [
        "Afschrijven",
        "Jaarlijkse afschrijving = (aanschaf inclusief installatie, exclusief terugvorderbare btw − restwaarde) ÷ economische levensduur. Boekwaarde = aanschaf − cumulatieve afschrijving, nooit lager dan de restwaarde. Technische levensduur is hoe lang iets nog functioneert; economische levensduur hoe lang gebruik verantwoord is.",
      ],
    ],
  },
  {
    id: "3.4",
    title: "De eindbalans",
    short: "Breng alles samen",
    description:
      "Verbind begrotingen en resultaat met een sluitende eindbalans.",
    icon: "table",
    goals: [
      "liquiditeit",
      "exploitatie",
      "resultaat",
      "eindbalans",
      "mutaties",
    ],
    theory: [
      [
        "Twee vragen, twee begrotingen",
        "Liquiditeitsbegroting: welke ontvangsten en uitgaven verwacht je? Gebruik betaalmomenten en bedragen inclusief btw. Exploitatiebegroting: welke opbrengsten en kosten verwacht je in de periode? Gebruik bedragen exclusief terugvorderbare btw. Een resultatenrekening bevat de gerealiseerde cijfers.",
      ],
      [
        "Van begin naar eind",
        "Eindsaldo geld = beginsaldo + ontvangsten − uitgaven. Eindvoorraad = beginvoorraad + inkopen − inkoopwaarde. Einddebiteuren = begindebiteuren + verkopen op rekening inclusief btw − betalingen. Voor crediteuren geldt de overeenkomstige regel met inkopen en uitgaven.",
      ],
      [
        "Eigen vermogen en privé",
        "Eigen vermogen eind = eigen vermogen begin + resultaat + privé-stortingen − privé-opnamen. Een privé-opname is geen bedrijfskostenpost. Bij een eenmanszaak is inkomstenbelasting van de eigenaar geen bedrijfskostenpost in deze trainers.",
      ],
      [
        "Overlopende posten",
        "Nog te ontvangen en vooruitbetaalde bedragen staan aan de activazijde. Nog te betalen en vooruitontvangen bedragen zijn kort vreemd vermogen. Gebruik ze om betalingen en periodebedragen uit elkaar te houden.",
      ],
      [
        "Staffel en scontro",
        "In staffelvorm trek je de kosten onder de opbrengsten af. In scontrovorm staan kosten debet en opbrengsten credit; winst staat debet om beide zijden te laten aansluiten. De vorm verandert het resultaat niet.",
      ],
    ],
  },
];
export const goals: Record<string, string> = {
  balans: "Balansposten ordenen",
  investeren: "Investeringsbegroting",
  financieren: "Financieringsbegroting",
  krediet: "Kredietvormen herkennen",
  mutaties: "Mutatiebalans opstellen",
  btw: "Btw berekenen",
  omzet: "Omzet en brutowinst",
  voorraad: "Voorraad berekenen",
  geldstromen: "Ontvangsten en uitgaven",
  kosten: "Kosten aan perioden toerekenen",
  lening: "Interest en aflossing",
  afschrijving: "Afschrijving en boekwaarde",
  overlopend: "Overlopende posten",
  liquiditeit: "Liquiditeitsbegroting",
  exploitatie: "Exploitatiebegroting",
  resultaat: "Resultatenrekening",
  eindbalans: "Eindbalans opstellen",
};
