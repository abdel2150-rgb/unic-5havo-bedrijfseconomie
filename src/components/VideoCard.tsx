import { useState } from "react";
import { Play, ArrowUpRight } from "lucide-react";
import type { Video } from "../content/videos";
export function videoEmbed(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    let id: string | null = null;
    if (["www.youtube.com", "youtube.com"].includes(u.hostname))
      id = u.searchParams.get("v");
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    if (id && /^[\w-]{11}$/.test(id))
      return `https://www.youtube-nocookie.com/embed/${id}`;
    return null;
  } catch {
    return null;
  }
}
export function VideoCard({ video }: { video: Video }) {
  const [answers, setAnswers] = useState<Record<number, string>>({}),
    [checked, setChecked] = useState(false);
  let url: string | null = null;
  try {
    if (
      video.url &&
      video.verifiedAt &&
      new URL(video.url).protocol === "https:"
    )
      url = video.url;
  } catch {
    /* A malformed configured link must never become active. */
  }
  const embed = url ? videoEmbed(url) : null;
  if (!url)
    return (
      <div className="video-row">
        <Play size={19} />
        <div>
          <strong>{video.title}</strong>
          <p className="small muted">Videokoppeling nog te verifiëren</p>
        </div>
        <span className="pill neutral">Nog niet beschikbaar</span>
      </div>
    );
  return (
    <article className="video-card">
      <h3>{video.title}</h3>
      {embed && (
        <iframe
          className="video-frame"
          src={embed}
          title={video.title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      <a className="text-link" href={url} target="_blank" rel="noreferrer">
        Bekijk de geverifieerde video
        <ArrowUpRight size={15} />
      </a>
      <p className="small muted">
        Link gecontroleerd op {video.verifiedAt}. Externe videoplatforms kunnen
        cookies gebruiken.
      </p>
      {video.questions.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setChecked(true);
          }}
        >
          <h3>Controleer wat je hebt begrepen</h3>
          {video.questions.map((q, i) => (
            <label key={q.question}>
              {q.question}
              <select
                value={answers[i] ?? ""}
                required
                onChange={(e) => {
                  setAnswers({ ...answers, [i]: e.target.value });
                  setChecked(false);
                }}
              >
                <option value="">Kies…</option>
                {q.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              {checked && (
                <span className="small">
                  {answers[i] === q.answer ? "Goed!" : `Correct: ${q.answer}`}
                </span>
              )}
            </label>
          ))}
          <button className="button primary" type="submit">
            Controleer mijn begrip
          </button>
        </form>
      )}
    </article>
  );
}
