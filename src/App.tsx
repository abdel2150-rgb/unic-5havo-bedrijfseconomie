import { useEffect, useRef, useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  List,
  Menu,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { modules, goals } from "./content/curriculum";
import { exercises, simulationExercises } from "./content/exercises";
import register from "./content/register.json" with { type: "json" };
import { mistakes } from "./content/mistakes";
import { videos } from "./content/videos";
import { ExerciseView, Repair } from "./components/ExerciseView";
import { Teacher } from "./components/Teacher";
import { VideoCard } from "./components/VideoCard";
import { grade, type Exercise, type Grade } from "./lib/exercises";
import {
  fresh,
  readProgress,
  saveProgress,
  download,
  mastery,
  type Progress,
  type Attempt,
} from "./lib/storage";
import { importProgress } from "./lib/importer";
import { euro } from "./lib/money";
const icons = [Scale, TrendingUp, Wallet, ChartNoAxesCombined];
const moduleExercises = (p: Progress, id: string, variant = 1) => [
  ...exercises(variant).filter((x) => x.module === id),
  ...p.custom.filter((x) => x.module === id && x.active),
];
function App() {
  const [p, setP] = useState<Progress>(fresh),
    [loaded, setLoaded] = useState(false),
    [storage, setStorage] = useState("Laden…"),
    [page, setPage] = useState("home"),
    [tab, setTab] = useState("oefenen"),
    [selected, setSelected] = useState(0),
    [mobile, setMobile] = useState(false),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState(""),
    [errorId, setErrorId] = useState<string | null>(null),
    [examIndex, setExamIndex] = useState(0);
  const main = useRef<HTMLElement>(null);
  const writeQueue = useRef(Promise.resolve());
  const channel = useRef<BroadcastChannel | null>(null);
  const fromOtherTab = useRef(false);
  useEffect(() => {
    readProgress()
      .then((value) => {
        setP(value);
        if (value.exam && !value.exam.submitted) setPage("exam");
        setLoaded(true);
        setStorage("Op dit apparaat opgeslagen");
      })
      .catch(() => {
        setLoaded(true);
        setStorage(
          "Lokale opslag niet beschikbaar. Exporteer je voortgang vóór afsluiten.",
        );
      });
    const ch = new BroadcastChannel("unic-progress");
    channel.current = ch;
    ch.onmessage = () =>
      readProgress()
        .then((value) => {
          fromOtherTab.current = true;
          setP(value);
        })
        .catch(() => {});
    return () => ch.close();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    if (fromOtherTab.current) {
      fromOtherTab.current = false;
      return;
    }
    setStorage("Opslaan…");
    writeQueue.current = writeQueue.current
      .catch(() => {})
      .then(() => saveProgress(p))
      .then(() => {
        setStorage("Op dit apparaat opgeslagen");
        channel.current?.postMessage("saved");
      })
      .catch(() =>
        setStorage("Opslaan mislukt. Exporteer je voortgang vóór afsluiten."),
      );
  }, [p, loaded]);
  useEffect(() => {
    main.current?.focus();
  }, [page]);
  const activeExam = p.exam && !p.exam.submitted;
  function go(id: string) {
    if (activeExam && id !== "exam") {
      setNotice(
        "Lever eerst je oefentoets in. Andere onderdelen zijn tijdens deze poging afgesloten.",
      );
      return;
    }
    setPage(id);
    setSelected(id === "sim" ? p.simulationIndex : 0);
    setMobile(false);
    setNotice("");
    setSearch("");
  }
  const variant = p.variants[page] ?? 1;
  const all =
    page === "sim" ? simulationExercises : moduleExercises(p, page, variant);
  const current = all[Math.min(selected, all.length - 1)];
  const done = new Set(
    p.attempts.filter((a) => a.correct === a.total).map((a) => a.exercise),
  );
  const score = p.attempts.length
    ? Math.round(
        (100 * p.attempts.reduce((a, b) => a + b.correct, 0)) /
          p.attempts.reduce((a, b) => a + b.total, 0),
      )
    : 0;
  function answer(ex: Exercise, id: string, value: string) {
    const key = `${ex.id}@${page === "sim" ? 1 : variant}`;
    setP((s) => ({
      ...s,
      drafts: { ...s.drafts, [key]: { ...s.drafts[key], [id]: value } },
    }));
  }
  function attempt(
    ex: Exercise,
    results: Grade[],
    answers: Record<string, string>,
    v = variant,
    exam = false,
  ) {
    setP((s) => {
      const n =
        s.attempts.filter((a) => a.exercise === ex.id && a.variant === v)
          .length + 1;
      const a: Attempt = {
        id: crypto.randomUUID(),
        exercise: ex.id,
        module: ex.module,
        goals: ex.goal,
        kind: ex.kind,
        variant: v,
        correct: results.filter((r) => r.correct).length,
        total: results.length,
        hints: exam ? 0 : Number(answers._hints ?? 0),
        try: n,
        at: new Date().toISOString(),
        mistakes: results
          .filter((r) => !r.correct && r.diagnosis)
          .map((r) => r.diagnosis!),
        answers,
      };
      return {
        ...s,
        attempts: [...s.attempts, a],
        simulationIndex:
          ex.module === "sim" && a.correct === a.total
            ? Math.max(
                s.simulationIndex,
                Math.min(simulationExercises.length - 1, selected + 1),
              )
            : s.simulationIndex,
      };
    });
  }
  function startExam(module: string) {
    const v = p.variants[module] ?? 1;
    setP((s) => ({
      ...s,
      exam: {
        module,
        variant: v,
        exercises: moduleExercises(s, module, v),
        answers: {},
        submitted: false,
        started: new Date().toISOString(),
      },
    }));
    setPage("exam");
    setExamIndex(0);
    setNotice("");
  }
  function submitExam() {
    if (!p.exam || p.exam.submitted) return;
    const ex = p.exam;
    const blank = ex.exercises.reduce(
      (count, e) =>
        count +
        e.fields.filter((f) => !(ex.answers[e.id]?.[f.id] ?? "").trim()).length,
      0,
    );
    if (
      !confirm(
        `Definitief inleveren? ${blank ? `Er zijn ${blank} onbeantwoorde deelvragen. ` : ""}Daarna kun je deze poging niet meer aanpassen.`,
      )
    )
      return;
    setP((s) => {
      if (!s.exam || s.exam.submitted) return s;
      const exam = s.exam;
      const attempts = exam.exercises.map((e) => {
        const answers = exam.answers[e.id] ?? {},
          r = grade(e, answers);
        return {
          id: crypto.randomUUID(),
          exercise: e.id,
          module: e.module,
          goals: e.goal,
          kind: e.kind,
          variant: exam.variant,
          correct: r.filter((x) => x.correct).length,
          total: r.length,
          hints: 0,
          try:
            s.attempts.filter(
              (a) => a.exercise === e.id && a.variant === exam.variant,
            ).length + 1,
          at: new Date().toISOString(),
          mistakes: r
            .filter((x) => !x.correct && x.diagnosis)
            .map((x) => x.diagnosis!),
          answers,
        } satisfies Attempt;
      });
      return {
        ...s,
        exam: { ...exam, submitted: true },
        attempts: [...s.attempts, ...attempts],
      };
    });
  }
  async function loadProgress(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10_000_000) throw Error("Maximaal 10 MB.");
      const next = importProgress(await file.text());
      if (
        !confirm(
          "Huidige lokale voortgang vervangen door dit bestand? Exporteer eerst als je die wilt bewaren.",
        )
      )
        return;
      setP(next);
      setNotice("Voortgang geïmporteerd.");
      setPage(next.exam && !next.exam.submitted ? "exam" : "progress");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  const nav = (id: string, label: string, Icon: typeof Scale) => (
    <button
      className={"nav-item " + (page === id ? "active" : "")}
      onClick={() => go(id)}
      disabled={!!activeExam && id !== "exam"}
    >
      <Icon size={19} />
      <span>{label}</span>
      {page === id && <span className="nav-dot" />}
    </button>
  );
  if (!loaded)
    return (
      <div className="loading">
        <GraduationCap size={36} />
        <h1>Je leeromgeving wordt geladen…</h1>
      </div>
    );
  const module = modules.find((m) => m.id === page);
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "mobile-open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="brand-mark">
            U<span>i</span>
          </span>
          <span>
            UniC<span className="brand-sub">LEEROMGEVING</span>
          </span>
        </a>
        <button
          className="mobile-close"
          onClick={() => setMobile(false)}
          aria-label="Menu sluiten"
        >
          <X />
        </button>
        <div className="subject">
          <span className="subject-icon">
            <BookOpen size={20} />
          </span>
          <div>
            <strong>Bedrijfseconomie</strong>
            <span>5 havo · 2026–2027</span>
          </div>
        </div>
        <p className="nav-label">JOUW LEERROUTE</p>
        {nav("home", "Overzicht", LayoutDashboard)}
        <div className="chapter-label">
          HOOFDSTUK 3 <span>De eenmanszaak</span>
        </div>
        {modules.map((m, i) => (
          <button
            className={"nav-item module-nav " + (page === m.id ? "active" : "")}
            key={m.id}
            onClick={() => go(m.id)}
            disabled={!!activeExam}
          >
            <span className="nav-number">{m.id}</span>
            <span>{m.title}</span>
            {done.size > 0 &&
              moduleExercises(p, m.id).every((e) => done.has(e.id)) && (
                <Check size={16} />
              )}
          </button>
        ))}
        {nav("sim", "Bedrijfssimulatie", Store)}
        <div className="nav-divider" />
        {nav("progress", "Mijn voortgang", ChartNoAxesCombined)}
        {nav("mistakes", "Fouten & herstel", Lightbulb)}
        {nav("sources", "Bronnenregister", BookOpen)}
        {nav("teacher", "Docentwerkplaats", Settings2)}
        {activeExam && nav("exam", "Actieve oefentoets", ClipboardCheck)}
        <div className="sidebar-bottom">
          <ShieldCheck size={18} />
          <div>
            <strong>Jouw leren, jouw apparaat</strong>
            <p>
              Geen account nodig.
              <br />
              Je voortgang blijft lokaal.
            </p>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="menu-overlay"
          aria-label="Menu sluiten"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-toggle"
            onClick={() => setMobile(true)}
            aria-label="Menu openen"
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            BEDRIJFSECONOMIE <span>/</span>
            <b>5 HAVO</b>
          </div>
          <div className="topbar-right">
            <span className="local-indicator">
              <i />
              {storage === "Opslaan…" ? "Opslaan…" : "Lokale voortgang"}
            </span>
            <span className="avatar" title={p.alias || "Leerling"}>
              {p.alias ? p.alias.slice(0, 2).toUpperCase() : "5H"}
            </span>
          </div>
        </header>
        <main ref={main} tabIndex={-1} id="main-content">
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Melding sluiten"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {activeExam && page !== "exam" ? (
            <section className="panel">
              <h1>Er staat een oefentoets open</h1>
              <p>
                De antwoorden en andere onderdelen blijven gesloten tot je
                inlevert.
              </p>
              <button className="button primary" onClick={() => go("exam")}>
                Oefentoets hervatten
                <ArrowRight size={18} />
              </button>
            </section>
          ) : (
            <>
              {page === "home" && (
                <>
                  <div className="page-heading home-heading">
                    <div>
                      <p className="eyebrow">JOUW VOLGENDE STAP BEGINT HIER</p>
                      <h1>
                        Welkom
                        {p.alias ? `, ${p.alias}` : " bij bedrijfseconomie"}.
                      </h1>
                      <p>
                        Van je eerste investering tot een sluitende eindbalans.
                      </p>
                    </div>
                    <span className="year-tag">
                      <GraduationCap size={17} />5 havo
                    </span>
                  </div>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="hero-tag">
                        <span />
                        HOOFDSTUK 3 · DE EENMANSZAAK
                      </span>
                      <h2>
                        Je onderneming.
                        <br />
                        <em>Jouw inzicht.</em>
                      </h2>
                      <p>
                        Leer wat er achter de cijfers gebeurt. Reken, probeer en
                        ontdek hoe een onderneming financieel in elkaar zit.
                      </p>
                      <button
                        className="button light"
                        onClick={() => go("3.1")}
                      >
                        {done.size
                          ? "Verder met oefenen"
                          : "Start met de beginbalans"}
                        <ArrowRight size={18} />
                      </button>
                      <span className="hero-footnote">
                        <CheckCircle2 size={14} />
                        Op jouw tempo · Met uitleg bij iedere stap
                      </span>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="art-orbit one" />
                      <div className="art-orbit two" />
                      <div className="art-card">
                        <div className="art-card-top">
                          <span className="mini-icon">
                            <ChartNoAxesCombined size={22} />
                          </span>
                          <span>
                            Financieel overzicht
                            <br />
                            <b>Studio Sole</b>
                          </span>
                          <span className="art-dots">•••</span>
                        </div>
                        <div className="art-value">
                          Een helder inzicht<span>van begin tot eind</span>
                        </div>
                        <div className="chart-bars">
                          {[32, 49, 40, 65, 56, 85, 76, 100].map((h, i) => (
                            <i key={i} style={{ height: `${h}%` }} />
                          ))}
                        </div>
                        <div className="art-months">
                          <span>INVESTEREN</span>
                          <span>ONDERNEMEN</span>
                          <span>BEGRIJPEN</span>
                        </div>
                      </div>
                      <div className="floating-chip">
                        <span>
                          <Check size={19} />
                        </span>
                        <div>
                          De balans klopt.<b>Jij begrijpt waarom.</b>
                        </div>
                      </div>
                    </div>
                  </section>
                  <div className="stats-grid">
                    <div>
                      <span className="stat-icon teal">
                        <BookOpen size={21} />
                      </span>
                      <div>
                        <strong>4 modules</strong>
                        <span>Een complete leerroute</span>
                      </div>
                    </div>
                    <div>
                      <span className="stat-icon blue">
                        <ClipboardCheck size={21} />
                      </span>
                      <div>
                        <strong>{exercises().length} oefeningen</strong>
                        <span>Zelf doen, echt begrijpen</span>
                      </div>
                    </div>
                    <div>
                      <span className="stat-icon amber">
                        <CheckCircle2 size={21} />
                      </span>
                      <div>
                        <strong>{done.size} afgerond</strong>
                        <span>Iedere stap telt</span>
                      </div>
                    </div>
                    <div>
                      <span className="stat-icon purple">
                        <Target size={21} />
                      </span>
                      <div>
                        <strong>
                          {p.attempts.length ? `${score}%` : "Jouw tempo"}
                        </strong>
                        <span>
                          {p.attempts.length
                            ? "Punten over alle pogingen"
                            : "Oefen zo vaak als je wilt"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="dashboard-columns">
                    <section>
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">STAP VOOR STAP</p>
                          <h2>Jouw leerroute</h2>
                        </div>
                        <span className="small muted">4 paragrafen</span>
                      </div>
                      <div className="modules-grid">
                        {modules.map((m, i) => {
                          const Icon = icons[i],
                            es = moduleExercises(p, m.id),
                            count = es.filter((x) => done.has(x.id)).length;
                          return (
                            <button
                              className="module-card"
                              key={m.id}
                              onClick={() => go(m.id)}
                            >
                              <div className="module-card-top">
                                <span className={"module-icon color-" + i}>
                                  <Icon size={25} />
                                </span>
                                <span className="module-number">{m.id}</span>
                              </div>
                              <span className="small muted">{m.short}</span>
                              <h3>
                                {m.title}
                                <ArrowUpRight size={18} />
                              </h3>
                              <p>{m.description}</p>
                              <div className="progress-line">
                                <i
                                  style={{
                                    width: `${(100 * count) / es.length}%`,
                                  }}
                                />
                              </div>
                              <div className="module-card-bottom">
                                <span>
                                  {count} van {es.length} afgerond
                                </span>
                                <span>
                                  {count ? "Verder oefenen" : "Begin hier"}
                                  <ArrowRight size={14} />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                    <aside className="dashboard-side">
                      <section className="panel learning-tip">
                        <span className="tip-icon">
                          <Lightbulb size={22} />
                        </span>
                        <p className="eyebrow">DE KERN VAN DIT HOOFDSTUK</p>
                        <h3>Winst is niet hetzelfde als geld.</h3>
                        <p>
                          Een verkoop kan al winst opleveren, terwijl je klant
                          nog niet heeft betaald.
                        </p>
                        <div className="tip-equation">
                          <span>Opbrengst</span>
                          <b>≠</b>
                          <span>Ontvangst</span>
                        </div>
                        <button className="text-link" onClick={() => go("3.2")}>
                          Ontdek het verschil
                          <ArrowRight size={16} />
                        </button>
                      </section>
                      <section className="chain-card">
                        <h3>Alles hangt samen</h3>
                        <p className="small muted">Volg de weg van het geld.</p>
                        <div>
                          <span>
                            <Scale size={16} />
                            Beginbalans
                          </span>
                          <ArrowDown size={17} />
                          <span>
                            <TrendingUp size={16} />
                            Financiële gebeurtenissen
                          </span>
                          <ArrowDown size={17} />
                          <span>
                            <ChartNoAxesCombined size={16} />
                            Resultaat & liquiditeit
                          </span>
                          <ArrowDown size={17} />
                          <span>
                            <CheckCircle2 size={16} />
                            Eindbalans
                          </span>
                        </div>
                      </section>
                    </aside>
                  </div>
                  <section className="simulation-banner">
                    <div className="sim-symbol">
                      <Store size={32} />
                    </div>
                    <div>
                      <span className="eyebrow">BRENG ALLES SAMEN</span>
                      <h2>Run je eigen sneakerzaak.</h2>
                      <p>
                        18 gebeurtenissen. Eén onderneming. Van beginbalans tot
                        eindbalans.
                      </p>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => go("sim")}
                    >
                      Naar Studio Sole
                      <ArrowRight size={18} />
                    </button>
                  </section>
                  <footer className="home-footer">
                    <span>
                      Eigen parallelopgaven bij Cumulus Bedrijfseconomie ·
                      Hoofdstuk 3
                    </span>
                    <button onClick={() => go("sources")}>
                      Bekijk de bronnen
                      <ArrowUpRight size={14} />
                    </button>
                  </footer>
                </>
              )}
              {module && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">
                        HOOFDSTUK 3 · PARAGRAAF {module.id}
                      </p>
                      <h1>{module.title}</h1>
                      <p>{module.description}</p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => startExam(module.id)}
                    >
                      <ClipboardCheck size={17} />
                      Start oefentoets
                    </button>
                  </div>
                  <div
                    className="tabs"
                    role="tablist"
                    aria-label="Moduleonderdelen"
                  >
                    {[
                      ["oefenen", "Zelf oefenen"],
                      ["theorie", "Theorie & leerdoelen"],
                      ["video", "Uitlegvideo’s"],
                    ].map(([id, label]) => (
                      <button
                        role="tab"
                        aria-selected={tab === id}
                        id={`tab-${id}`}
                        aria-controls="module-panel"
                        tabIndex={tab === id ? 0 : -1}
                        key={id}
                        className={tab === id ? "selected" : ""}
                        onClick={() => setTab(id)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                            e.preventDefault();
                            const ids = ["oefenen", "theorie", "video"];
                            const next =
                              ids[
                                (ids.indexOf(id) +
                                  (e.key === "ArrowRight" ? 1 : 2)) %
                                  3
                              ];
                            setTab(next);
                            document.getElementById(`tab-${next}`)?.focus();
                          }
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div
                    role="tabpanel"
                    id="module-panel"
                    aria-labelledby={`tab-${tab}`}
                  >
                    {tab === "theorie" && (
                      <div className="theory-layout">
                        <section className="panel">
                          <h2>Begrijp de gedachte achter de cijfers</h2>
                          <Accordion.Root type="multiple" defaultValue={["0"]}>
                            {module.theory.map(([title, text], i) => (
                              <Accordion.Item
                                className="accordion-item"
                                key={title}
                                value={String(i)}
                              >
                                <Accordion.Header>
                                  <Accordion.Trigger>
                                    {title}
                                    <ChevronDown size={18} />
                                  </Accordion.Trigger>
                                </Accordion.Header>
                                <Accordion.Content>
                                  <p>{text}</p>
                                </Accordion.Content>
                              </Accordion.Item>
                            ))}
                          </Accordion.Root>
                          <button
                            className="button primary"
                            onClick={() => setTab("oefenen")}
                          >
                            Zelf aan de slag
                            <ArrowRight size={17} />
                          </button>
                        </section>
                        <section className="panel">
                          <h3>Hier werk je naartoe</h3>
                          {module.goals.map((g) => (
                            <div className="goal-mini" key={g}>
                              <Target size={17} />
                              <span>{goals[g]}</span>
                            </div>
                          ))}
                        </section>
                      </div>
                    )}
                    {tab === "video" && (
                      <section className="panel">
                        <h2>OSSAcademie-uitlegvideo’s</h2>
                        <p>
                          Er zijn nog geen actuele videolinks inhoudelijk
                          geverifieerd. Daarom tonen we geen verzonnen links of
                          embeds. Je kunt voor ieder leerdoel alvast de theorie
                          en oefeningen gebruiken.
                        </p>
                        {videos
                          .filter((v) => module.goals.includes(v.goal))
                          .map((v) => (
                            <VideoCard key={v.goal} video={v} />
                          ))}
                      </section>
                    )}
                    {tab === "oefenen" && (
                      <>
                        <div className="practice-intro">
                          <span>
                            <Sparkles size={17} />
                            Oefenmodus · hints en feedback beschikbaar
                          </span>
                          <button
                            className="text-link"
                            onClick={() => {
                              setP((s) => ({
                                ...s,
                                variants: {
                                  ...s.variants,
                                  [page]: (s.variants[page] ?? 1) + 1,
                                },
                              }));
                              setNotice(
                                "Nieuwe bedragen geladen. Je eerdere resultaten blijven bewaard.",
                              );
                            }}
                          >
                            <RotateCcw size={15} />
                            Nieuwe vergelijkbare opgaven
                          </button>
                        </div>
                        <div className="workspace">
                          <nav
                            className="exercise-list"
                            aria-label="Oefeningen"
                          >
                            {all.map((ex, i) => (
                              <button
                                key={ex.id}
                                className={selected === i ? "selected" : ""}
                                onClick={() => setSelected(i)}
                              >
                                <span>{String(i + 1).padStart(2, "0")}</span>
                                <span>{ex.title}</span>
                                {done.has(ex.id) && <CheckCircle2 size={15} />}
                              </button>
                            ))}
                          </nav>
                          <div>
                            {current && (
                              <ExerciseView
                                key={`${current.id}@${variant}`}
                                exercise={current}
                                answers={
                                  p.drafts[`${current.id}@${variant}`] ?? {}
                                }
                                onChange={(id, value) =>
                                  answer(current, id, value)
                                }
                                onCheck={(r) =>
                                  attempt(
                                    current,
                                    r,
                                    p.drafts[`${current.id}@${variant}`] ?? {},
                                  )
                                }
                                onNext={
                                  selected < all.length - 1
                                    ? () => setSelected(selected + 1)
                                    : undefined
                                }
                              />
                            )}
                            <div className="exercise-pager">
                              <button
                                className="button secondary"
                                disabled={selected === 0}
                                onClick={() => setSelected(selected - 1)}
                              >
                                <ChevronLeft size={16} />
                                Vorige
                              </button>
                              <span className="small muted">
                                {selected + 1} / {all.length} · variant{" "}
                                {variant}
                              </span>
                              <button
                                className="button secondary"
                                disabled={selected >= all.length - 1}
                                onClick={() => setSelected(selected + 1)}
                              >
                                Volgende
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
              {page === "sim" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">VAN BEGINBALANS TOT EINDBALANS</p>
                      <h1>Welkom bij Studio Sole.</h1>
                      <p>
                        Jouw sneakerzaak, van eerste investering tot
                        eindcontrole.
                      </p>
                    </div>
                    <span className="pill">18 financiële gebeurtenissen</span>
                  </div>
                  <div className="notice">
                    <Store size={20} />
                    Werk de stappen op volgorde af. De begroting en de
                    werkelijkheid verschillen; let op het hogere loon en de
                    laatste verkoop. Iedere stap wordt lokaal bewaard.
                  </div>
                  <div className="workspace">
                    <nav
                      className="exercise-list"
                      aria-label="Simulatiestappen"
                    >
                      {simulationExercises.map((ex, i) => (
                        <button
                          key={ex.id}
                          disabled={i > p.simulationIndex}
                          className={selected === i ? "selected" : ""}
                          onClick={() => setSelected(i)}
                        >
                          <span>
                            {i <= p.simulationIndex
                              ? String(i + 1).padStart(2, "0")
                              : "○"}
                          </span>
                          <span>{ex.title}</span>
                          {done.has(ex.id) && <CheckCircle2 size={15} />}
                        </button>
                      ))}
                    </nav>
                    <div>
                      {current && (
                        <ExerciseView
                          key={current.id}
                          exercise={current}
                          answers={p.drafts[`${current.id}@1`] ?? {}}
                          onChange={(id, value) => answer(current, id, value)}
                          onCheck={(r) =>
                            attempt(
                              current,
                              r,
                              p.drafts[`${current.id}@1`] ?? {},
                              1,
                            )
                          }
                          onNext={
                            selected < p.simulationIndex
                              ? () => setSelected(selected + 1)
                              : undefined
                          }
                        />
                      )}
                      <div className="exercise-pager">
                        <button
                          className="button secondary"
                          onClick={() => setSelected(Math.max(0, selected - 1))}
                          disabled={selected === 0}
                        >
                          Vorige stap
                        </button>
                        <span className="small muted">
                          Stap {selected + 1} van {simulationExercises.length}
                        </span>
                        <button
                          className="button secondary"
                          onClick={() => setSelected(selected + 1)}
                          disabled={selected >= p.simulationIndex}
                        >
                          Volgende stap
                        </button>
                      </div>
                      {selected === simulationExercises.length - 1 &&
                        done.has(current?.id) && (
                          <div className="feedback success">
                            <h2>Je hebt Studio Sole doorgerekend.</h2>
                            <p>
                              Je begroting, resultaat en eindbalans sluiten op
                              elkaar aan. Bekijk nu welke leerdoelen je
                              zelfstandig beheerst.
                            </p>
                            <button
                              className="button primary"
                              onClick={() => go("progress")}
                            >
                              Bekijk mijn voortgang
                              <ArrowRight size={17} />
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </>
              )}
              {page === "exam" &&
                p.exam &&
                (() => {
                  const exam = p.exam,
                    ex = exam.exercises[examIndex] ?? exam.exercises[0];
                  const r = exam.exercises.flatMap((e) =>
                      grade(e, exam.answers[e.id] ?? {}),
                    ),
                    count = r.filter((x) => x.correct).length;
                  return (
                    <>
                      <div className="page-heading">
                        <div>
                          <p className="eyebrow">
                            FORMATIEVE OEFENTOETS · {exam.module}
                          </p>
                          <h1>
                            {exam.submitted
                              ? "Je beoordeling"
                              : "Laat zien wat je al kunt."}
                          </h1>
                          <p>
                            {exam.submitted
                              ? `${count} van ${r.length} punten. Bekijk het model en oefen de lastige onderdelen opnieuw.`
                              : "Geen hints of feedback tussendoor. Iedere deelvraag is één punt."}
                          </p>
                        </div>
                        {exam.submitted ? (
                          <button
                            className="button primary"
                            onClick={() => {
                              setPage(exam.module);
                              setSelected(0);
                              setTab("oefenen");
                            }}
                          >
                            Opnieuw oefenen
                            <ArrowRight size={17} />
                          </button>
                        ) : (
                          <button
                            className="button primary"
                            onClick={submitExam}
                          >
                            Definitief inleveren
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                      </div>
                      <div className="notice">
                        Dit is een onbeveiligde oefentoets. Antwoorden en
                        voortgang staan op dit apparaat. Deze website is niet
                        geschikt voor beveiligde summatieve toetsafname.
                      </div>
                      <div className="exam-question-nav">
                        {exam.exercises.map((e, i) => (
                          <button
                            key={e.id}
                            className={examIndex === i ? "selected" : ""}
                            aria-label={`Vraag ${i + 1}: ${e.title}`}
                            onClick={() => setExamIndex(i)}
                          >
                            {i + 1}
                            {exam.submitted && (
                              <span>
                                {" "}
                                ·{" "}
                                {
                                  grade(e, exam.answers[e.id] ?? {}).filter(
                                    (g) => g.correct,
                                  ).length
                                }
                                /{e.fields.length}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <ExerciseView
                        key={`${ex.id}-${exam.submitted}`}
                        exercise={ex}
                        answers={exam.answers[ex.id] ?? {}}
                        exam={!exam.submitted}
                        review={exam.submitted}
                        onChange={(id, value) =>
                          setP((s) =>
                            s.exam && !s.exam.submitted
                              ? {
                                  ...s,
                                  exam: {
                                    ...s.exam,
                                    answers: {
                                      ...s.exam.answers,
                                      [ex.id]: {
                                        ...s.exam.answers[ex.id],
                                        [id]: value,
                                      },
                                    },
                                  },
                                }
                              : s,
                          )
                        }
                      />
                      <div className="exercise-pager">
                        <button
                          className="button secondary"
                          disabled={examIndex === 0}
                          onClick={() => setExamIndex(examIndex - 1)}
                        >
                          Vorige vraag
                        </button>
                        <span>
                          {examIndex + 1} / {exam.exercises.length}
                        </span>
                        <button
                          className="button secondary"
                          disabled={examIndex === exam.exercises.length - 1}
                          onClick={() => setExamIndex(examIndex + 1)}
                        >
                          Volgende vraag
                        </button>
                      </div>
                    </>
                  );
                })()}
              {page === "progress" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">INZICHT IN JE ONTWIKKELING</p>
                      <h1>Iedere poging brengt je verder.</h1>
                      <p>
                        Beheersing telt zelfstandigheid, verschillende opgaven
                        en werkvormen mee.
                      </p>
                    </div>
                  </div>
                  <section className="panel">
                    <div className="toolbar">
                      <label>
                        Leerlingalias (optioneel)
                        <input
                          maxLength={60}
                          value={p.alias}
                          placeholder="Bijvoorbeeld: Sole5H"
                          onChange={(e) =>
                            setP((s) => ({ ...s, alias: e.target.value }))
                          }
                        />
                      </label>
                      <button
                        className="button secondary"
                        onClick={() => download("unic-voortgang.json", p)}
                      >
                        <Download size={17} />
                        Exporteer voortgang
                      </button>
                      <label className="button secondary">
                        <Upload size={17} />
                        Importeer voortgang
                        <input
                          type="file"
                          className="file-hidden"
                          accept=".json"
                          onChange={(e) => {
                            loadProgress(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <p className="small muted">
                      {storage}. Browsergegevens wissen verwijdert ook je
                      voortgang. Een export bevat je alias, antwoorden,
                      resultaten en eigen oefeningen. Bewaar het bestand zelf.
                    </p>
                  </section>
                  <section className="panel">
                    <h2>Je leerdoelen</h2>
                    <p className="small muted">
                      Redelijk: twee verschillende opgaven volledig goed. Goed:
                      drie verschillende opgaven zelfstandig in de eerste
                      poging, zonder hints, verspreid over minstens twee
                      werkvormen.
                    </p>
                    <div className="mastery-list">
                      {Object.entries(goals).map(([id, label]) => {
                        const m = mastery(p.attempts, id);
                        return (
                          <div key={id}>
                            <span>{label}</span>
                            <div className="progress-line">
                              <i style={{ width: `${m.percent}%` }} />
                            </div>
                            <span
                              className={"mastery-label level-" + m.percent}
                            >
                              {m.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                  <section className="panel">
                    <h2>Recente pogingen</h2>
                    {!p.attempts.length ? (
                      <p>
                        Je hebt nog niet geoefend. Begin bij de beginbalans.
                      </p>
                    ) : (
                      <div className="history-table">
                        {p.attempts
                          .slice(-20)
                          .reverse()
                          .map((a) => (
                            <div key={a.id}>
                              <span>
                                {[
                                  ...exercises(a.variant),
                                  ...simulationExercises,
                                  ...p.custom,
                                ].find((e) => e.id === a.exercise)?.title ??
                                  a.exercise}
                                <small>
                                  {new Date(a.at).toLocaleString("nl-NL")} ·
                                  poging {a.try} · {a.hints} hints
                                </small>
                              </span>
                              <b>
                                {a.correct}/{a.total}
                              </b>
                              <span>
                                {a.correct === a.total
                                  ? "Volledig goed"
                                  : "Verder oefenen"}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>
                </>
              )}
              {page === "mistakes" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">FOUTEN ZIJN INFORMATIE</p>
                      <h1>Begrijp het. Herstel het.</h1>
                      <p>
                        {mistakes.length} veelgemaakte misvattingen, met uitleg
                        en een nieuwe herstelvraag.
                      </p>
                    </div>
                  </div>
                  <div className="workspace">
                    <nav className="exercise-list" aria-label="Misvattingen">
                      {mistakes.map((m) => {
                        const count = p.attempts
                          .flatMap((a) => a.mistakes)
                          .filter((id) => id === m.id).length;
                        return (
                          <button
                            className={errorId === m.id ? "selected" : ""}
                            key={m.id}
                            onClick={() => setErrorId(m.id)}
                          >
                            <span>
                              <Lightbulb size={16} />
                            </span>
                            <span>
                              {m.title}
                              {count > 0 && (
                                <small>{count} keer teruggekomen</small>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                    <section className="panel">
                      <h2>Maak ruimte voor een nieuwe gedachte.</h2>
                      <p>
                        Een typefout is geen misvatting. Gebruik deze uitleg als
                        je twijfelt over het begrip achter je antwoord.
                      </p>
                      <Repair
                        key={errorId ?? mistakes[0].id}
                        id={errorId ?? mistakes[0].id}
                      />
                    </section>
                  </div>
                </>
              )}
              {page === "sources" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">BRONNEN & VERANTWOORDING</p>
                      <h1>Een controleerbare basis.</h1>
                      <p>
                        Alle 46 bronopgaven uit hoofdstuk 3, met de
                        oorspronkelijke nummering.
                      </p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() =>
                        download("cumulus-opgavenregister.json", register)
                      }
                    >
                      <Download size={17} />
                      Exporteer register
                    </button>
                  </div>
                  <div className="notice">
                    De oefeningen op deze website zijn eigen parallelopgaven. De
                    twee aangeleverde Cumulus-PDF’s zijn gebruikt voor
                    inhoudelijke analyse en controle en worden hier niet
                    gedeeld. Paginanummers hieronder zijn gedrukte pagina’s. De
                    fysieke PDF-pagina’s staan in de export.
                  </div>
                  <label className="search-label">
                    Zoek op nummer, titel of leerdoel
                    <input
                      placeholder="Bijvoorbeeld: 3.22 of interest"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <section className="panel source-list">
                    {register
                      .filter((r) =>
                        `${r.number} ${r.title} ${r.goal}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((r) => (
                        <details key={r.number}>
                          <summary>
                            <span className="source-number">{r.number}</span>
                            <strong>{r.title}</strong>
                            <span className="small muted">
                              § {r.module} · werkboek p. {r.workbookPage} ·
                              antwoorden p. {r.answerPage}
                            </span>
                            <ChevronDown size={16} />
                          </summary>
                          <dl>
                            <dt>Leerdoel</dt>
                            <dd>{r.goal}</dd>
                            <dt>Voorkennis</dt>
                            <dd>{r.prerequisites.join("; ")}</dd>
                            <dt>Berekening / redenering</dt>
                            <dd>{r.reasoning}</dd>
                            <dt>Voorgestelde werkvorm</dt>
                            <dd>{r.interaction}</dd>
                            <dt>Niveau (eigen indeling)</dt>
                            <dd>{r.level}</dd>
                            <dt>Gebruik</dt>
                            <dd>{r.sourceDisplay}</dd>
                            <dt>Controle</dt>
                            <dd>{r.verified}</dd>
                          </dl>
                        </details>
                      ))}
                  </section>
                </>
              )}
              {page === "teacher" && (
                <Teacher
                  custom={p.custom}
                  onSave={(custom) => setP((s) => ({ ...s, custom }))}
                />
              )}
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>UniC · Leren door te doen</span>
          <span>
            <ShieldCheck size={13} />
            {storage}
          </span>
        </footer>
      </div>
    </div>
  );
}
export default App;
