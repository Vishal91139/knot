import { useState } from "react"
import CollegeModal from "../components/modals/CollegeModal"
import AuthModal from "../components/modals/AuthModal"
import { Link } from "react-router-dom"

const TICKER = [
  "Hackathon", "Cultural Fest", "Workshop", "Sports Meet", "Quiz Night",
  "Art Exhibition", "Music Night", "Startup Pitch", "Dance Battle", "Tech Talk",
  "Photography Contest", "Debate Night", "Robotics Expo", "Film Screening", "Open Mic",
  "Hackathon", "Cultural Fest", "Workshop", "Sports Meet", "Quiz Night",
  "Art Exhibition", "Music Night", "Startup Pitch", "Dance Battle", "Tech Talk",
  "Photography Contest", "Debate Night", "Robotics Expo", "Film Screening", "Open Mic",
]

const HERO_CARDS = [
  { title: "National Hackathon '25", dept: "CSE Dept", tag: "Competition", date: "Feb 14", cls: "float-1", pos: "top-[14%] right-[6%]", rot: "-rotate-2", accent: "#F0A500" },
  { title: "Culturals 2025",         dept: "Student Affairs", tag: "Cultural", date: "Mar 1", cls: "float-2", pos: "top-[42%] right-[18%]", rot: "rotate-3",  accent: "#FF5A5A" },
  { title: "Design Sprint",          dept: "Architecture",    tag: "Workshop", date: "Jan 30", cls: "float-3", pos: "top-[68%] right-[4%]", rot: "-rotate-1", accent: "#00BFA5" },
]

const SAMPLE_EVENTS = [
  { title: "InnovateFest Hackathon", org: "CSE & IT Club", tag: "Competition", date: "Feb 14–15", seats: "240 seats left", accent: "#F0A500", pattern: "⬡" },
  { title: "Spring Culturals",       org: "Student Council",  tag: "Cultural",  date: "Mar 1–3",  seats: "Register free",   accent: "#FF5A5A", pattern: "◈" },
  { title: "UX Design Sprint",       org: "Design Lab",       tag: "Workshop",  date: "Jan 30",   seats: "60 seats left",   accent: "#00BFA5", pattern: "◎" },
  { title: "Inter-College Debate",   org: "English Dept",     tag: "Academic",  date: "Feb 8",    seats: "32 seats left",   accent: "#7B8FFF", pattern: "◇" },
  { title: "Robotics Expo '25",      org: "ECE & Mech",       tag: "Exhibition",date: "Mar 12",   seats: "Open entry",      accent: "#FF8C42", pattern: "⬟" },
]

const FEATURES = [
  {
    icon: "◈", label: "Explore", big: "Hundreds of events, one feed.",
    desc: "From department workshops to inter-college fests — every event at your college lives on KNOT. Filter by type, date, or department.",
    span: "col-span-2", bg: "bg-[#0D1526]",
  },
  {
    icon: "⚡", label: "Register", big: "One tap. You're in.",
    desc: "No forms, no paperwork. Register for events instantly and get your confirmation right away.",
    span: "col-span-1", bg: "bg-[#0A1A14]",
  },
  {
    icon: "◎", label: "Discover", big: "Find things you didn't know existed.",
    desc: "Competitions, open mics, startup pitches — KNOT surfaces events across every corner of your campus.",
    span: "col-span-1", bg: "bg-[#16100A]",
  },
  {
    icon: "⬡", label: "Organise", big: "Built for creators too.",
    desc: "Faculty and department heads can create and publish events. Everything from approvals to registrations, handled.",
    span: "col-span-2", bg: "bg-[#0D1526]",
  },
]

export default function LandingPage() {
  const [modal, setModal] = useState(null) // "college" | "auth"

  return (
    <div className="min-h-screen bg-[#080D18] text-[#E8E4DC] overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-10 py-4"
        style={{ background: "rgba(8,13,24,0.8)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F0A500]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="4" r="2" fill="#080D18"/>
              <circle cx="12" cy="4" r="2" fill="#080D18"/>
              <circle cx="8" cy="12" r="2" fill="#080D18"/>
              <line x1="4" y1="4" x2="12" y2="4" stroke="#080D18" strokeWidth="1.4"/>
              <line x1="4" y1="4" x2="8" y2="12" stroke="#080D18" strokeWidth="1.4"/>
              <line x1="12" y1="4" x2="8" y2="12" stroke="#080D18" strokeWidth="1.4"/>
            </svg>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-[#E8E4DC]">KNOT</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#7A8494]">
          <a href="#events" className="hover:text-[#E8E4DC] transition-colors">Events</a>
          <a href="#about"  className="hover:text-[#E8E4DC] transition-colors">About</a>
          <a href="#join"   className="hover:text-[#E8E4DC] transition-colors">Get started</a>
        </div>
        <Link
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#F0A500] text-[#080D18] hover:bg-[#FFB820] transition-colors active:scale-95"
          to={"/login"}
        >
          Login
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center px-6 md:px-10 pt-24 pb-12 overflow-hidden grain-overlay">

        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.125) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.125) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage: "radial-gradient(ellipse 80% 70% at 40% 50%, black 20%, transparent 100%)"
          }} />

        {/* Glow blobs */}
        <div className="absolute top-20 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(240,165,0,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,191,165,0.10) 0%, transparent 70%)" }} />

        {/* Text */}
        <div className="relative z-10 max-w-2xl">
          <div className="a0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 text-[#F0A500]"
            style={{ background: "rgba(240,165,0,0.1)", border: "1px solid rgba(240,165,0,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F0A500] animate-pulse" />
            Your campus events platform
          </div>

          <h1 className="a1 font-display font-bold leading-[1.05] tracking-[-0.03em] mb-6"
            style={{ fontSize: "clamp(2.8rem, 5.5vw, 5rem)", fontFamily: "'Playfair Display', serif" }}>
            Everything<br />happening on<br /><em style={{ fontStyle: "italic", fontWeight: 400, color: "#F0A500" }}>your campus.</em>
          </h1>

          <p className="a2 text-[#7A8494] leading-relaxed mb-8 max-w-md" style={{ fontSize: "1.05rem" }}>
            KNOT is where your college comes alive. Discover fests, hackathons, workshops and more — then register in seconds.
          </p>

          <div className="a3 flex flex-wrap gap-3">
            <button onClick={() => setModal("auth")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[0.9rem] bg-[#F0A500] text-[#080D18] hover:bg-[#FFB820] transition-all active:scale-95 hover:-translate-y-0.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="#080D18" strokeWidth="1.5"/><path d="M2.5 13.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="#080D18" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Create Account
            </button>
            <button onClick={() => setModal("college")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-[0.9rem] text-[#E8E4DC] hover:-translate-y-0.5 transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="8" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4"/></svg>
              Add your College
            </button>
          </div>

          <div className="a4 flex items-center gap-6 mt-10">
            {["500+ events", "40+ colleges", "Free to join"].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#7A8494]">
                <span className="w-1 h-1 rounded-full bg-[#3A4455]" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Floating event cards — hidden on small screens */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[480px] pointer-events-none">
          {HERO_CARDS.map((c, i) => (
            <div key={i}
              className={`absolute ${c.pos} ${c.cls} ${c.rot} w-52 rounded-2xl p-3.5`}
              style={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)` }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${c.accent}18`, color: c.accent }}>
                  {c.tag}
                </span>
                <span className="text-[0.7rem] text-[#3A4455]">{c.date}</span>
              </div>
              <div className="font-semibold text-[0.875rem] text-[#E8E4DC] mb-1 leading-tight">{c.title}</div>
              <div className="text-[0.75rem] text-[#4A5568]">{c.dept}</div>
              <div className="mt-3 h-[1px] bg-white/5" />
              <button className="mt-2.5 w-full py-1.5 rounded-lg text-[0.75rem] font-semibold transition-colors"
                style={{ background: `${c.accent}18`, color: c.accent }}>
                Register →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="relative overflow-hidden py-4 border-y border-white/6"
        style={{ background: "#080D18" }}>
        <div className="marquee-track">
          {TICKER.map((item, i) => (
            <span key={i} className="flex items-center">
              <span className="px-5 text-sm font-medium text-[#7A8494] whitespace-nowrap hover:text-[#E8E4DC] transition-colors cursor-default">{item}</span>
              <span className="text-[#1E2D46]">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── WHAT KNOT IS ── */}
      <section id="about" className="px-6 md:px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#00BFA5] mb-3">What is KNOT</p>
            <h2 className="font-display font-bold leading-tight max-w-xl"
              style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontFamily: "'Playfair Display', serif" }}>
              Your college has more<br />going on than you <em style={{ fontStyle: "italic", fontWeight: 400, color: "#00BFA5" }}>think.</em>
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Big left card */}
            <div className="md:col-span-2 rounded-2xl p-7 border border-white/6 relative overflow-hidden group hover:border-white/12 transition-colors"
              style={{ background: "#0D1526" }}>
              <div className="text-3xl mb-4 text-[#F0A500]">◈</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#F0A500] mb-2">Explore</div>
              <h3 className="font-display font-bold text-xl text-[#E8E4DC] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>Hundreds of events, one feed.</h3>
              <p className="text-[#7A8494] text-sm leading-relaxed max-w-sm">
                From department hackathons to campus-wide cultural fests — every event your college runs is on KNOT. Filter by type, date, or department and find what excites you.
              </p>
              <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #F0A500 0%, transparent 70%)" }} />
            </div>

            {/* Register */}
            <div className="rounded-2xl p-7 border border-white/6 relative overflow-hidden group hover:border-white/12 transition-colors"
              style={{ background: "#0A1A14" }}>
              <div className="text-3xl mb-4 text-[#00BFA5]">⚡</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#00BFA5] mb-2">Register</div>
              <h3 className="font-display font-bold text-xl text-[#E8E4DC] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>One tap. You're in.</h3>
              <p className="text-[#7A8494] text-sm leading-relaxed">
                No long forms. Register for events instantly and get your confirmation right in your dashboard.
              </p>
            </div>

            {/* Discover */}
            <div className="rounded-2xl p-7 border border-white/6 relative overflow-hidden hover:border-white/12 transition-colors"
              style={{ background: "#16100A" }}>
              <div className="text-3xl mb-4 text-[#FF5A5A]">◎</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#FF5A5A] mb-2">Discover</div>
              <h3 className="font-display font-bold text-xl text-[#E8E4DC] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>Things you didn't know existed.</h3>
              <p className="text-[#7A8494] text-sm leading-relaxed">
                Startup pitches, open mics, robotics expos — KNOT surfaces events across every corner of your campus.
              </p>
            </div>

            {/* Organise — big right */}
            <div className="md:col-span-2 rounded-2xl p-7 border border-white/6 relative overflow-hidden hover:border-white/12 transition-colors"
              style={{ background: "#0D1526" }}>
              <div className="text-3xl mb-4 text-[#7B8FFF]">⬡</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#7B8FFF] mb-2">For faculty & organizers too</div>
              <h3 className="font-display font-bold text-xl text-[#E8E4DC] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>Built for both sides of the stage.</h3>
              <p className="text-[#7A8494] text-sm leading-relaxed max-w-sm">
                Faculty can create and publish events, assign student coordinators, and manage registrations — all without touching a spreadsheet.
              </p>
              <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #7B8FFF 0%, transparent 70%)" }} />
            </div>

          </div>
        </div>
      </section>

      {/* ── EVENTS PREVIEW ── */}
      <section id="events" className="px-6 md:px-10 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F0A500] mb-2">Live on KNOT</p>
              <h2 className="font-display font-bold"
                style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontFamily: "'Playfair Display', serif" }}>
                What's waiting for you
              </h2>
            </div>
            <button onClick={() => setModal("auth")}
              className="hidden md:block text-sm text-[#7A8494] hover:text-[#E8E4DC] transition-colors">
              See all events →
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
            {SAMPLE_EVENTS.map((ev, i) => (
              <div key={i} className="flex-shrink-0 w-56 rounded-2xl p-4 border border-white/6 hover:border-white/14 transition-all hover:-translate-y-1 cursor-pointer group"
                style={{ background: "#0D1526" }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${ev.accent}18`, color: ev.accent }}>
                    {ev.tag}
                  </span>
                  <span className="text-2xl opacity-20" style={{ color: ev.accent }}>{ev.pattern}</span>
                </div>
                <div className="font-semibold text-sm text-[#E8E4DC] leading-snug mb-1">{ev.title}</div>
                <div className="text-xs text-[#4A5568] mb-3">{ev.org}</div>
                <div className="h-[1px] bg-white/5 mb-3" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#4A5568]">{ev.date}</span>
                  <span className="text-xs font-medium" style={{ color: ev.accent }}>{ev.seats}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN SPLIT ── */}
      <section id="join" className="px-6 md:px-10 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8494] mb-3">Get started</p>
            <h2 className="font-display font-bold"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontFamily: "'Playfair Display', serif" }}>
              Who are you on campus?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3">

            {/* Student / Faculty */}
            <div className="rounded-2xl p-8 border border-white/6 hover:border-[#00BFA5]/30 transition-all group cursor-pointer"
              style={{ background: "#0A1A14" }}
              onClick={() => setModal("auth")}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-6"
                style={{ background: "rgba(0,191,165,0.12)" }}>
                🎓
              </div>
              <h3 className="font-display font-bold text-2xl text-[#E8E4DC] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Student or Faculty
              </h3>
              <p className="text-[#7A8494] text-sm leading-relaxed mb-6">
                Your college is already on KNOT. Create your account with your college email and start discovering events happening around you — right now.
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {["Browse events", "Register instantly", "Get notifications", "Build your CV"].map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full border border-white/8 text-[#7A8494]">{f}</span>
                ))}
              </div>
              <button className="w-full py-3 rounded-xl font-semibold text-sm text-[#080D18] transition-all active:scale-95 bg-[#00BFA5] hover:bg-[#00D4B8]">
                Create Account →
              </button>
            </div>

            {/* College Admin */}
            <div className="rounded-2xl p-8 border border-white/6 hover:border-[#F0A500]/30 transition-all group cursor-pointer"
              style={{ background: "#16100A" }}
              onClick={() => setModal("college")}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-6"
                style={{ background: "rgba(240,165,0,0.12)" }}>
                🏛️
              </div>
              <h3 className="font-display font-bold text-2xl text-[#E8E4DC] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                College Admin
              </h3>
              <p className="text-[#7A8494] text-sm leading-relaxed mb-6">
                Want to bring KNOT to your institution? Submit a request and we'll set up a dedicated space for your college — students can start joining the same day.
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {["Full college workspace", "Manage departments", "Track registrations", "Zero paperwork"].map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full border border-white/8 text-[#7A8494]">{f}</span>
                ))}
              </div>
              <button className="w-full py-3 rounded-xl font-semibold text-sm text-[#080D18] transition-all active:scale-95 bg-[#F0A500] hover:bg-[#FFB820]">
                Request College Access →
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/6 px-6 md:px-10 py-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#F0A500]">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="4" r="2" fill="#080D18"/>
              <circle cx="12" cy="4" r="2" fill="#080D18"/>
              <circle cx="8" cy="12" r="2" fill="#080D18"/>
              <line x1="4" y1="4" x2="12" y2="4" stroke="#080D18" strokeWidth="1.5"/>
              <line x1="4" y1="4" x2="8" y2="12" stroke="#080D18" strokeWidth="1.5"/>
              <line x1="12" y1="4" x2="8" y2="12" stroke="#080D18" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="font-display font-bold text-[#E8E4DC]" style={{ fontFamily: "'Playfair Display', serif" }}>KNOT</span>
          <span className="text-xs text-[#3A4455]">Knitting Networks Of Talent</span>
        </div>
        <div className="flex gap-5 text-xs text-[#3A4455]">
          <a href="#" className="hover:text-[#7A8494] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#7A8494] transition-colors">Terms</a>
          <a href="#" className="hover:text-[#7A8494] transition-colors">Contact</a>
        </div>
      </footer>

      {modal === "college" && <CollegeModal onClose={() => setModal(null)} />}
      {modal === "auth"    && <AuthModal    onClose={() => setModal(null)} />}
    </div>
  )
}