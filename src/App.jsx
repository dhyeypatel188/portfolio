import { useEffect, useRef, useState } from 'react';
import Earth from './Earth';
import { PROFILE, STATS, SKILLS, PROJECTS, TIMELINE } from './data';

function Reveal({ children, className = '', as: Tag = 'div', delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

// Types a phrase, pauses, deletes it, then moves on to the next one.
function Typer({ words }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[i];
    let ms = del ? 35 : 75;
    if (!del && text === word) ms = 1600;
    const id = setTimeout(() => {
      if (!del && text === word) setDel(true);
      else if (del && text === '') { setDel(false); setI((i + 1) % words.length); }
      else setText(word.slice(0, text.length + (del ? -1 : 1)));
    }, ms);
    return () => clearTimeout(id);
  }, [text, del, i, words]);
  return <span className="typer">{text}<b className="caret" /></span>;
}

// Pen path that runs through the glyphs of "hello" in Great Vibes (260px at x=50,y=260).
// A thick stroke along it is used as a mask over the real text, so the word is
// revealed as one continuous pen stroke, like the iPhone's "hello".
const PEN = 'M138 100 L45 258 L76 205 C95 185 125 172 140 180 C148 195 122 240 105 258 C120 264 140 255 150 240 C158 195 205 150 212 185 C210 220 165 225 156 235 C150 248 160 264 182 260 C205 256 215 245 226 238 C245 190 265 130 275 102 C282 90 296 96 291 116 C281 160 256 215 243 252 C246 264 266 262 282 240 C302 190 322 130 332 102 C339 90 353 96 348 116 C338 160 313 215 300 252 C303 264 323 262 339 240 C335 195 355 165 375 168 C398 172 398 230 372 252 C352 268 332 250 345 228 C355 262 400 262 420 210';
const WRITE_SECONDS = 4;

function Hello() {
  const end = 0.8 + WRITE_SECONDS;
  return (
    <section className="hero" id="top">
      <h1 className="hello" aria-label="hello">
        <svg viewBox="20 70 430 220" aria-hidden="true">
          <defs>
            <mask id="hello-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="400">
              <path className="pen" d={PEN} pathLength="1" style={{ animationDuration: `${WRITE_SECONDS}s` }} />
            </mask>
          </defs>
          <text x="50" y="260" mask="url(#hello-mask)">hello</text>
        </svg>
      </h1>
      <p className="hero-intro" style={{ animationDelay: `${end + 0.4}s` }}>{PROFILE.intro}<br /><Typer words={PROFILE.builds} /></p>
      <a className="scroll-cue" href="#about" style={{ animationDelay: `${end + 1.5}s` }}>
        <span>scroll</span><i />
      </a>
    </section>
  );
}

export default function App() {
  return (
    <>
      <Earth />
      <header className="nav">
        <a href="#top" className="brand">{PROFILE.name}</a>
        <nav>
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#path">Path</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <Hello />

        <section id="about" className="section">
          <Reveal as="p" className="eyebrow">01 — About</Reveal>
          <Reveal as="h2" className="big">{PROFILE.role}</Reveal>
          <div className="stats">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}><b>{s.value}</b><span>{s.label}</span></Reveal>
            ))}
          </div>
          <div className="about-grid">
            <Reveal delay={100}>{PROFILE.about.map((t) => <p key={t} className="lead">{t}</p>)}</Reveal>
            <Reveal delay={200} className="skills">
              {SKILLS.map((g) => (
                <div key={g.group}>
                  <h3>{g.group}</h3>
                  <ul>{g.items.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section id="work" className="section">
          <Reveal as="p" className="eyebrow">02 — Selected work</Reveal>
          <div className="projects">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.title} className="project" delay={i * 80}>
                <div className="project-top"><span>{p.category}</span><span>{p.year}</span></div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <div className="tags">{p.tags.map((t) => <em key={t}>{t}</em>)}</div>
                <div className="links">
                  {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer">Live ↗</a>}
                  {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noreferrer">Code ↗</a>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="path" className="section">
          <Reveal as="p" className="eyebrow">03 — Path</Reveal>
          <ol className="timeline">
            {TIMELINE.map((e, i) => (
              <Reveal as="li" key={e.when} delay={i * 100}>
                <span className="when">{e.when}</span>
                <div><h3>{e.title} <small>· {e.place}</small></h3><p>{e.text}</p></div>
              </Reveal>
            ))}
          </ol>
        </section>

        <section id="contact" className="section contact">
          <Reveal as="p" className="eyebrow">04 — Contact</Reveal>
          <Reveal as="h2" className="big">Let's make something<br /><span>worth looking at.</span></Reveal>
          <Reveal delay={150}>
            <a className="mail" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
            <a className="phone" href={`tel:${PROFILE.phone.replace(/\s/g, '')}`}>{PROFILE.phone}</a>
            <div className="links center">
              {PROFILE.links.map((l) => <a key={l.label} href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="footer">© {new Date().getFullYear()} {PROFILE.name} · {PROFILE.location}</footer>
    </>
  );
}
