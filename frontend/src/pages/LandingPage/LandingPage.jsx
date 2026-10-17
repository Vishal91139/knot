import { useEffect, useRef, useState } from "react"
import "./landingPage.css"
import CurvedLoop from './CurvedLoop';
import { Link } from "react-router-dom";


const STAMP_STYLES = {
  live: { color: "#E1493A", label: "LIVE NOW" },
  closing: { color: "#F2B134", label: "CLOSING SOON" },
  open: { color: "#2E6E9E", label: "OPEN" },
  waitlist: { color: "#8B6F4E", label: "WAITLIST" },
  new: { color: "#3F8F5F", label: "NEW" },
}

function scrollToSection(event, sectionId) {
  event.preventDefault()
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })
}

function Stamp({ status, className = "" }) {
  const stamp = STAMP_STYLES[status] || STAMP_STYLES.open

  return (
    <span className={`cc-stamp ${className}`} style={{ color: stamp.color, borderColor: stamp.color }}>
      {status === "live" && <span className="cc-dot" style={{ background: stamp.color }} />}
      {stamp.label}
    </span>
  )
}

function Flyer({ ev }) {
  const percentage = Math.min(100, Math.round((ev.filled / ev.capacity) * 100))

  return (
    <article className="cc-flyer lp-pin-card" style={{ borderTopColor: ev.accent }}>
      <span className="cc-pinhead" aria-hidden="true" />
      <span className="cc-tape" style={{ transform: `rotate(${ev.tapeRotate}deg)` }} aria-hidden="true" />
      <div className="cc-flyer-top">
        <span className="cc-mono cc-flyer-cat" style={{ color: ev.accent }}>{ev.category}</span>
        <Stamp status={ev.status} />
      </div>
      <h3 className="cc-display cc-flyer-title">{ev.title}</h3>
      <p className="cc-flyer-meta cc-mono">{ev.college}</p>
      <p className="cc-flyer-meta cc-mono">{ev.date}</p>
      <div className="cc-capacity" aria-label={`${percentage}% of spots filled`}>
        <div className="cc-capacity-fill" style={{ width: `${percentage}%`, background: ev.accent }} />
      </div>
      <p className="cc-mono cc-capacity-label">{ev.filled}/{ev.capacity} spots pinned</p>
      <a href="#board" onClick={(event) => scrollToSection(event, "board")} className="cc-flyer-cta" style={{ color: ev.accent }}>
        Reserve a spot <span aria-hidden="true">&#8594;</span>
      </a>
    </article>
  )
}

const EVENTS = [
  {
    title: "CodeStorm '26",
    category: "Hackathon",
    college: "Nova Institute of Technology",
    date: "Aug 14–15",
    status: "live",
    filled: 240,
    capacity: 300,
    accent: "#2E6E9E",
    tapeRotate: -8,
  },
  {
    title: "Kalakriti Fest",
    category: "Cultural",
    college: "Meridian College of Arts",
    date: "Aug 20–22",
    status: "closing",
    filled: 1850,
    capacity: 2000,
    accent: "#E1493A",
    tapeRotate: 6,
  },
  {
    title: "FinLeap Summit",
    category: "Workshop",
    college: "Ashoka School of Business",
    date: "Sep 2",
    status: "new",
    filled: 90,
    capacity: 150,
    accent: "#F2B134",
    tapeRotate: -5,
  },
  {
    title: "RoboRush Finals",
    category: "Competition",
    college: "Vantage Engineering College",
    date: "Aug 18",
    status: "waitlist",
    filled: 60,
    capacity: 60,
    accent: "#3F8F5F",
    tapeRotate: 7,
  },
  {
    title: "Founders' Circle",
    category: "Meetup",
    college: "Ridgeview University",
    date: "Aug 29",
    status: "open",
    filled: 40,
    capacity: 60,
    accent: "#2E6E9E",
    tapeRotate: -6,
  },
  {
    title: "Hueistry Workshop",
    category: "Design",
    college: "Lotus Institute of Design",
    date: "Sep 5",
    status: "open",
    filled: 25,
    capacity: 40,
    accent: "#F2B134",
    tapeRotate: 5,
  },
]

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("cc-in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const boardHeadRef = useReveal();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24)

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="lp-root">
      <nav className={`lp-nav ${isScrolled ? "lp-nav-scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <a href="#top" onClick={(event) => scrollToSection(event, "top")} className="lp-nav-logo" aria-label="Knot home">
            knot<span>.</span>
          </a>

          <div className="lp-nav-links">
            <a href="#board" onClick={(event) => scrollToSection(event, "board")}>Browse events</a>
            <a href="#how-it-works" onClick={(event) => scrollToSection(event, "how-it-works")}>How it works</a>
            <a href="#roles" onClick={(event) => scrollToSection(event, "roles")}>For colleges</a>
          </div>

          <div className="lp-nav-buttons">
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="lp-nav-signup">Create an account</Link>
            <button
              className="lp-menu-btn"
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="lp-mobile-menu">
          <a href="#board" onClick={(event) => { setMenuOpen(false); scrollToSection(event, "board") }}>Browse events</a>
          <a href="#how-it-works" onClick={(event) => { setMenuOpen(false); scrollToSection(event, "how-it-works") }}>How it works</a>
          <a href="#roles" onClick={(event) => { setMenuOpen(false); scrollToSection(event, "roles") }}>For colleges</a>
        </div>
      )}

      <header className="lp-hero" id="top">
        <div className="lp-hero-inner lp-reveal lp-in-view">
          <h1 className="lp-display lp-hero-title">
            Nothing worth going to<br />gets lost in a <span>group chat</span> again.
          </h1>
          <p className="lp-hero-sub">
            Knot pins every fest, hackathon and workshop from every college onto one board — so
            registrations, teams and leaderboards live in one place instead of forty screenshots.
          </p>
          <div className="lp-hero-ctas">
            <a href="#board" onClick={(event) => scrollToSection(event, "board")} className="lp-btn lp-btn-solid">
              Browse what&apos;s live <span aria-hidden="true">&#8594;</span>
            </a>
            <a href="#roles" onClick={(event) => scrollToSection(event, "roles")} className="lp-btn lp-btn-ghost">List your college</a>
          </div>
        </div>

        <div className="lp-pin-row" id="board">
          {EVENTS.slice(0, 4).map((ev) => (
            <Flyer key={ev.title} ev={ev} />
          ))}
        </div>
      </header>

      

      <section className="lp-proof" id="how-it-works">
        <CurvedLoop 
          marqueeText="Hackathons-------------"
          speed={1}
          curveAmount={-50}
          direction="right"
          interactive
          className="custom-text-style"
        />

        <p className="lp-mono lp-proof-label">One board - Every campus</p>
        <h2 className="lp-display">Find your next thing to show up for.</h2>
        <p className="lp-proof-copy">
          From first-year mixers to final-round hackathons, discover what is happening around you
          and keep every detail in one place.
        </p>
        <div className="lp-stat-row">
          <div>
            <strong className="lp-display">120+</strong>
            <span className="lp-mono">campuses</span>
          </div>
          <div>
            <strong className="lp-display">4.8k</strong>
            <span className="lp-mono">events pinned</span>
          </div>
          <div>
            <strong className="lp-display">32k</strong>
            <span className="lp-mono">people showing up</span>
          </div>
        </div>
      </section>
      
       {/* BOARD */}
      <section className="cc-section" id="board" style={{ background: "var(--paper-dark)", maxWidth: "none", padding: "5rem 1.5rem" }}>
        <div className="cc-section-head" ref={boardHeadRef}>
          <span className="cc-kicker">This week's board</span>
          <h2 className="cc-display cc-section-title">Freshly pinned</h2>
          <p className="cc-section-body">A slice of what's live across the network right now.</p>
        </div>
        <div className="cc-board-grid" style={{ maxWidth: 1180, margin: "0 auto" }}>
          {EVENTS.map((ev) => (
            <Flyer key={ev.title} ev={ev} />
          ))}
        </div>
      </section>

        <section className="lp-steps-section">
          <div className="lp-section-heading lp-section-heading-light">
            <div>
              <p className="lp-mono lp-kicker">How it works</p>
              <h2 className="lp-display">Three quick ways to get plugged in.</h2>
            </div>
          </div>

          <div className="lp-steps-grid">
            <article>
              <span className="lp-step-number">01</span>
              <h3 className="lp-display">Browse the board</h3>
              <p>Find events by vibe, timing, and campus so the next thing you plan is already in focus.</p>
            </article>
            <article>
              <span className="lp-step-number">02</span>
              <h3 className="lp-display">Save your spot</h3>
              <p>Keep the date, venue, team size, and registration link together. No more screenshot archaeology.</p>
            </article>
            <article>
              <span className="lp-step-number">03</span>
              <h3 className="lp-display">Show up ready</h3>
              <p>Bring the right people, the right gear, and the small thrill of knowing where to be.</p>
            </article>
          </div>
        </section>

        <section className="lp-role-strip" id="roles">
          <div>
            <p className="lp-mono lp-kicker">For organisers</p>
            <h2 className="lp-display">Your event deserves more than a forwarded poster.</h2>
          </div>
          <a href="mailto:hello@knot.events" className="lp-btn lp-btn-solid">
            Start listing <span aria-hidden="true">&#8594;</span>
          </a>
        </section>

      {/* FOOTER CTA */}
      <div className="cc-cork cc-footer-cta">
        <h2 className="cc-display cc-footer-stamp">Get pinned up</h2>
        <p className="cc-footer-sub">Your college isn't on the board yet. Fifteen minutes and it will be.</p>
        <form className="cc-signup" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="you@college.edu" />
          <button type="submit" className="cc-btn cc-btn-solid">Join the board</button>
        </form>
      </div>
 
      {/* FOOTER */}
      <footer className="cc-footer">
        <div className="cc-footer-grid">
          <div>
            <span className="cc-logo" style={{ color: "var(--paper)" }}>
               Knot
            </span>
            <p style={{ color: "rgba(250,243,228,.65)", fontSize: ".85rem", marginTop: ".8rem", maxWidth: 240 }}>
              The board where every college's events end up, whether you're looking or listing.
            </p>
          </div>
          <div>
            <h5>Explore</h5>
            <a href="#board" onClick={(event) => scrollToSection(event, "board")}>Live events</a>
            <a href="#board" onClick={(event) => scrollToSection(event, "board")}>Colleges</a>
            <a href="#board" onClick={(event) => scrollToSection(event, "board")}>Categories</a>
          </div>
          <div>
            <h5>Organize</h5>
            <a href="#how-it-works" onClick={(event) => scrollToSection(event, "how-it-works")}>Create an event</a>
            <a href="#roles" onClick={(event) => scrollToSection(event, "roles")}>Register your college</a>
            <a href="#how-it-works" onClick={(event) => scrollToSection(event, "how-it-works")}>Leaderboards</a>
          </div>
          <div>
            <h5>Company</h5>
            <button type="button">About</button>
            <button type="button">Support</button>
            <button type="button">Privacy</button>
          </div>
        </div>
        <div className="cc-footer-bottom">
          <span>© 2026 KNOT</span>
          <span className="cc-mono">MADE FOR EVERY NOTICE BOARD, EVERYWHERE</span>
        </div>
      </footer>
    </div>
  )
}
