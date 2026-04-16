import { useState } from "react"

const NAV = [
  { icon: "◈", label: "Discover",  id: "discover" },
  { icon: "◎", label: "My Events", id: "myevents" },
  { icon: "⬡", label: "Calendar",  id: "calendar"  },
  { icon: "◇", label: "Leaderboard", id: "leaderboard" },
]

const FILTERS = ["All", "Hackathon", "Cultural", "Workshop", "Sports", "Academic", "Exhibition"]

const ALL_EVENTS = [
  { id:1, title:"InnovateFest Hackathon", org:"CSE & IT Club", tag:"Hackathon",  date:"Feb 14–15", seats:"240", accent:"#F0A500", sym:"⬡", desc:"48-hour build competition open to all branches. Cash prizes + internship referrals." },
  { id:2, title:"Spring Culturals 2025",  org:"Student Council",tag:"Cultural",  date:"Mar 1–3",  seats:"Open",  accent:"#FF5A5A", sym:"◈", desc:"The biggest campus festival of the year. Dance, drama, music and more." },
  { id:3, title:"UX Design Sprint",       org:"Design Lab",    tag:"Workshop",   date:"Jan 30",  seats:"60",    accent:"#00BFA5", sym:"◎", desc:"Two-day sprint on product design, Figma prototyping, and user research." },
  { id:4, title:"Inter-College Debate",   org:"English Dept",  tag:"Academic",   date:"Feb 8",   seats:"32",    accent:"#7B8FFF", sym:"◇", desc:"Represent your college in the annual parliamentary debate championship." },
  { id:5, title:"Robotics Expo '25",      org:"ECE & Mech",    tag:"Exhibition", date:"Mar 12",  seats:"Open",  accent:"#FF8C42", sym:"⬟", desc:"Showcase autonomous bots, drone projects, and embedded systems work." },
  { id:6, title:"Basketball Tournament",  org:"Sports Dept",   tag:"Sports",     date:"Feb 22",  seats:"120",   accent:"#E85D75", sym:"◉", desc:"Annual inter-department basketball championship. Teams of 5." },
  { id:7, title:"Open Mic Night",         org:"Lit & Arts Club",tag:"Cultural",  date:"Feb 5",   seats:"150",   accent:"#FF5A5A", sym:"◈", desc:"Perform spoken word, music, or comedy for an audience of 150." },
  { id:8, title:"ML Bootcamp",            org:"Data Science Club",tag:"Workshop",date:"Jan 28", seats:"80",    accent:"#00BFA5", sym:"◎", desc:"Hands-on 3-day bootcamp on neural networks, Sklearn, and PyTorch." },
]

const MY_EVENTS = [
  { id:1, title:"InnovateFest Hackathon", date:"Feb 14–15", status:"confirmed", tag:"Hackathon", accent:"#F0A500", daysLeft:18 },
  { id:3, title:"UX Design Sprint",       date:"Jan 30",    status:"confirmed", tag:"Workshop",  accent:"#00BFA5", daysLeft:3 },
  { id:7, title:"Open Mic Night",         date:"Feb 5",     status:"waitlist",  tag:"Cultural",  accent:"#FF5A5A", daysLeft:9 },
]

function EventCard({ ev, registered, onRegister, onUnregister }) {
  return (
    <div className="rounded-2xl border border-white/7 overflow-hidden group hover:border-white/15 transition-all hover:-translate-y-0.5 cursor-pointer"
      style={{ background: "#0D1526" }}>
      {/* colour bar */}
      <div className="h-1" style={{ background: ev.accent }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${ev.accent}18`, color: ev.accent }}>{ev.tag}</span>
          <span className="text-xl opacity-15 group-hover:opacity-30 transition-opacity"
            style={{ color: ev.accent }}>{ev.sym}</span>
        </div>
        <h3 className="font-semibold text-[0.9rem] text-[#E8E4DC] leading-snug mb-1">{ev.title}</h3>
        <p className="text-xs text-[#4A5568] mb-2">{ev.org}</p>
        <p className="text-xs text-[#7A8494] leading-relaxed mb-4 line-clamp-2">{ev.desc}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[#4A5568]">{ev.date}</span>
            <span className="mx-2 text-[#1E2D46]">·</span>
            <span className="text-xs" style={{ color: ev.seats === "Open" ? "#00BFA5" : "#7A8494" }}>
              {ev.seats === "Open" ? "Open entry" : `${ev.seats} seats`}
            </span>
          </div>
          {registered
            ? <button onClick={() => onUnregister(ev.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-red-900/20"
                style={{ borderColor: "rgba(255,90,90,0.3)", color: "#FF5A5A" }}>
                Registered ✓
              </button>
            : <button onClick={() => onRegister(ev.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                style={{ background: `${ev.accent}22`, color: ev.accent, border: `1px solid ${ev.accent}30` }}>
                Register →
              </button>
          }
        </div>
      </div>
    </div>
  )
}

export default function StudentHome() {
  const [activeNav, setActiveNav] = useState("discover")
  const [filter, setFilter] = useState("All")
  const [registered, setRegistered] = useState(new Set([1, 3, 7]))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filtered = filter === "All" ? ALL_EVENTS : ALL_EVENTS.filter(e => e.tag === filter)

  const register   = id => setRegistered(prev => new Set([...prev, id]))
  const unregister = id => setRegistered(prev => { const s = new Set(prev); s.delete(id); return s })

  const myEventsData = ALL_EVENTS.filter(e => registered.has(e.id))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="min-h-screen flex bg-[#080D18] text-[#E8E4DC]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`
        .fd{font-family:'Playfair Display',serif}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        input,select,textarea{color:#E8E4DC !important}
        input::placeholder{color:#3A4455 !important}
        input:focus{border-color:#F0A500 !important;outline:none !important}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1E2D46;border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .45s ease both}
        .au1{animation:fadeUp .45s .06s ease both;opacity:0}
        .au2{animation:fadeUp .45s .12s ease both;opacity:0}
        .au3{animation:fadeUp .45s .18s ease both;opacity:0}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .pulse{animation:pulse 2s ease infinite}
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-56 flex flex-col border-r border-white/6 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#080D18" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/6">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#F0A500]">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="4" r="2" fill="#080D18"/><circle cx="12" cy="4" r="2" fill="#080D18"/><circle cx="8" cy="12" r="2" fill="#080D18"/>
              <line x1="4" y1="4" x2="12" y2="4" stroke="#080D18" strokeWidth="1.5"/>
              <line x1="4" y1="4" x2="8" y2="12" stroke="#080D18" strokeWidth="1.5"/>
              <line x1="12" y1="4" x2="8" y2="12" stroke="#080D18" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="fd font-bold text-[#E8E4DC]">KNOT</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setActiveNav(n.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeNav === n.id
                  ? "bg-[#F0A500]/10 text-[#F0A500]"
                  : "text-[#7A8494] hover:text-[#E8E4DC] hover:bg-white/4"
              }`}>
              <span className="text-base">{n.icon}</span>
              {n.label}
              {n.id === "myevents" && registered.size > 0 && (
                <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#F0A500]/15 text-[#F0A500]">
                  {registered.size}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-3 py-4 border-t border-white/6">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/4 transition-colors cursor-pointer">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#080D18] bg-[#F0A500]">
              AR
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#E8E4DC] truncate">Arjun Menon</div>
              <div className="text-[0.65rem] text-[#4A5568]">CSE · 3rd Year</div>
            </div>
          </div>
        </div>
      </aside>

      {/* overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/6 sticky top-0 z-20"
          style={{ background: "rgba(8,13,24,0.92)", backdropFilter: "blur(12px)" }}>
          <button className="lg:hidden text-[#7A8494] hover:text-[#E8E4DC]" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><line x1="2" y1="5" x2="18" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="15" x2="18" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <div className="flex-1 max-w-xs mx-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3A4455]" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.4"/><line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              <input className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/5 border border-white/8 placeholder-[#3A4455]"
                placeholder="Search events..." />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-8 h-8 rounded-xl flex items-center justify-center text-[#7A8494] hover:text-[#E8E4DC] hover:bg-white/6 transition-all">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 00-4 4c0 3-1.5 4-1.5 4h11S12 9 12 6a4 4 0 00-4-4zM6.5 12a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/></svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#F0A500] rounded-full pulse" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-[#080D18] bg-[#F0A500] cursor-pointer">
              AR
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── DISCOVER ── */}
          {activeNav === "discover" && (
            <div className="max-w-4xl mx-auto">

              {/* Greeting */}
              <div className="au mb-8">
                <p className="text-sm text-[#4A5568] mb-1">{greeting},</p>
                <h1 className="fd font-bold text-3xl text-[#E8E4DC] leading-tight" style={{ fontFamily: "'Playfair Display',serif" }}>
                  Arjun. <em className="font-normal italic text-[#F0A500]">What's on?</em>
                </h1>
              </div>

              {/* Stats row */}
              <div className="au1 grid grid-cols-3 gap-3 mb-8">
                {[
                  { label: "Registered", val: registered.size, accent: "#F0A500" },
                  { label: "This month", val: "5",             accent: "#00BFA5" },
                  { label: "Points",     val: "320",           accent: "#7B8FFF" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-4 border border-white/6 text-center" style={{ background: "#0D1526" }}>
                    <div className="fd font-bold text-2xl mb-0.5" style={{ color: s.accent, fontFamily: "'Playfair Display',serif" }}>{s.val}</div>
                    <div className="text-xs text-[#4A5568]">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Upcoming — horizontal strip */}
              {MY_EVENTS.length > 0 && (
                <div className="au2 mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#4A5568]">Coming up</p>
                    <button className="text-xs text-[#7A8494] hover:text-[#E8E4DC] transition-colors" onClick={() => setActiveNav("myevents")}>See all →</button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    {MY_EVENTS.map(ev => (
                      <div key={ev.id} className="flex-shrink-0 w-64 rounded-2xl p-4 border border-white/6" style={{ background: "#0D1526" }}>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${ev.accent}18`, color: ev.accent }}>{ev.tag}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            ev.status === "confirmed" ? "bg-[#00BFA5]/10 text-[#00BFA5]" : "bg-[#7B8FFF]/10 text-[#7B8FFF]"
                          }`}>
                            {ev.status === "confirmed" ? "Confirmed ✓" : "Waitlisted"}
                          </span>
                        </div>
                        <div className="font-semibold text-sm text-[#E8E4DC] mb-1">{ev.title}</div>
                        <div className="text-xs text-[#4A5568]">{ev.date}</div>
                        <div className="mt-3 flex items-center gap-1.5">
                          <div className="flex-1 h-1 rounded-full bg-white/5">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(5, 100 - ev.daysLeft * 5)}%`, background: ev.accent }} />
                          </div>
                          <span className="text-xs text-[#4A5568]">{ev.daysLeft}d</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="au3 flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filter === f
                        ? "bg-[#F0A500] text-[#080D18]"
                        : "text-[#7A8494] hover:text-[#E8E4DC] hover:bg-white/6 border border-white/8"
                    }`}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Events grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map((ev, i) => (
                  <div key={ev.id} style={{ animation: `fadeUp .35s ${i * 0.05}s ease both`, opacity: 0 }}>
                    <EventCard ev={ev} registered={registered.has(ev.id)} onRegister={register} onUnregister={unregister} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MY EVENTS ── */}
          {activeNav === "myevents" && (
            <div className="max-w-3xl mx-auto">
              <div className="au mb-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#4A5568] mb-1.5">My Events</p>
                <h1 className="fd font-bold text-3xl text-[#E8E4DC]" style={{ fontFamily: "'Playfair Display',serif" }}>
                  Your <em className="font-normal italic text-[#00BFA5]">registrations.</em>
                </h1>
              </div>

              {myEventsData.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4 opacity-20">◎</div>
                  <p className="text-[#4A5568] text-sm">You haven't registered for anything yet.</p>
                  <button onClick={() => setActiveNav("discover")}
                    className="mt-4 text-sm text-[#F0A500] hover:underline">Discover events →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myEventsData.map((ev, i) => (
                    <div key={ev.id} className="rounded-2xl border border-white/6 overflow-hidden hover:border-white/12 transition-colors"
                      style={{ background: "#0D1526", animation: `fadeUp .35s ${i * 0.06}s ease both`, opacity: 0 }}>
                      <div className="h-0.5" style={{ background: ev.accent }} />
                      <div className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${ev.accent}15` }}>
                          <span style={{ color: ev.accent }}>{ev.sym}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[0.9rem] text-[#E8E4DC] truncate">{ev.title}</div>
                          <div className="text-xs text-[#4A5568] mt-0.5">{ev.org} · {ev.date}</div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            ev.status === "confirmed" ? "bg-[#00BFA5]/10 text-[#00BFA5]" : "bg-[#7B8FFF]/10 text-[#7B8FFF]"
                          }`}>
                            {ev.status === "confirmed" ? "Confirmed ✓" : "Waitlisted"}
                          </span>
                          <button onClick={() => unregister(ev.id)}
                            className="text-xs text-[#3A4455] hover:text-[#FF5A5A] transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLACEHOLDER PAGES ── */}
          {(activeNav === "calendar" || activeNav === "leaderboard") && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="text-5xl mb-5 opacity-10">{NAV.find(n => n.id === activeNav)?.icon}</div>
              <h2 className="fd font-bold text-2xl text-[#E8E4DC] mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
                {NAV.find(n => n.id === activeNav)?.label}
              </h2>
              <p className="text-sm text-[#4A5568]">Coming soon</p>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}