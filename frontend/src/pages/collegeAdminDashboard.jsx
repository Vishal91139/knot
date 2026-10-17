import { useState, useEffect, useRef, useCallback } from "react"
import "./admin.css"

/* ─────────────────────────────────────────────────────────────
   KNOT — College Admin Dashboard
   Pages: Overview · Events · Organizers · Faculty · Students · Profile
   Usage: <Route path="/admin" element={<CollegeAdminDashboard />} />
───────────────────────────────────────────────────────────── */

// ── MOCK DATA ────────────────────────────────────────────────

const ADMIN = {
  id: "ca-001", full_name: "Dr. Priya Sharma", email: "priya.sharma@rvce.edu.in",
  role: "college_admin", college_name: "R.V. College of Engineering",
  college_id: "rvce-001", branch: "Administration", is_verified: true,
  is_active: true, points: 0, created_at: "2024-09-01T10:00:00Z",
  last_login: "2025-04-30T09:15:00Z", updated_at: "2025-04-01T08:00:00Z",
  avatar_url: null,
}

const INITIAL_ORGANIZERS = [
  { id:"o1", full_name:"Prof. Kavita Nair",    email:"kavita@rvce.edu.in",  department:"CSE",         events_managed:8,  is_active:true,  created_at:"2024-10-01" },
  { id:"o2", full_name:"Prof. Rajan Pillai",   email:"rajan@rvce.edu.in",   department:"ECE",         events_managed:5,  is_active:true,  created_at:"2024-10-12" },
  { id:"o3", full_name:"Prof. Sunita Rao",     email:"sunita@rvce.edu.in",  department:"Mech",        events_managed:3,  is_active:false, created_at:"2024-11-05" },
  { id:"o4", full_name:"Prof. Anil Kumar",     email:"anil@rvce.edu.in",    department:"Civil",       events_managed:2,  is_active:true,  created_at:"2025-01-08" },
  { id:"o5", full_name:"Prof. Deepa Menon",    email:"deepa@rvce.edu.in",   department:"IS",          events_managed:6,  is_active:true,  created_at:"2025-02-14" },
]

const INITIAL_FACULTY = [
  { id:"f1", full_name:"Dr. Ramesh Babu",      email:"ramesh@rvce.edu.in",  branch:"CSE",  year_of_study:null, roll_number:null, is_verified:true,  is_active:true,  created_at:"2024-09-10" },
  { id:"f2", full_name:"Dr. Anitha Reddy",     email:"anitha@rvce.edu.in",  branch:"ECE",  year_of_study:null, roll_number:null, is_verified:true,  is_active:true,  created_at:"2024-09-15" },
  { id:"f3", full_name:"Prof. Suresh Nair",    email:"suresh@rvce.edu.in",  branch:"Mech", year_of_study:null, roll_number:null, is_verified:false, is_active:true,  created_at:"2024-11-20" },
  { id:"f4", full_name:"Dr. Lalitha Iyer",     email:"lalitha@rvce.edu.in", branch:"IS",   year_of_study:null, roll_number:null, is_verified:true,  is_active:false, created_at:"2025-01-05" },
  { id:"f5", full_name:"Prof. Mohan Das",      email:"mohan@rvce.edu.in",   branch:"Civil",year_of_study:null, roll_number:null, is_verified:true,  is_active:true,  created_at:"2025-02-18" },
  { id:"f6", full_name:"Dr. Rekha Verma",      email:"rekha@rvce.edu.in",   branch:"CSE",  year_of_study:null, roll_number:null, is_verified:true,  is_active:true,  created_at:"2025-03-01" },
]

const INITIAL_STUDENTS = [
  { id:"s1",  full_name:"Arjun Menon",       email:"arjun@rvce.edu.in",    branch:"CSE",  year_of_study:3, roll_number:"1RV21CS045", is_verified:true,  is_active:true,  points:320, created_at:"2025-01-12" },
  { id:"s2",  full_name:"Priya Krishnan",    email:"priya@rvce.edu.in",    branch:"ECE",  year_of_study:2, roll_number:"1RV22EC021", is_verified:true,  is_active:true,  points:150, created_at:"2025-01-15" },
  { id:"s3",  full_name:"Rahul Sharma",      email:"rahul@rvce.edu.in",    branch:"Mech", year_of_study:4, roll_number:"1RV20ME012", is_verified:false, is_active:true,  points:0,   created_at:"2025-02-01" },
  { id:"s4",  full_name:"Sneha Patel",       email:"sneha@rvce.edu.in",    branch:"IS",   year_of_study:1, roll_number:"1RV24IS008", is_verified:true,  is_active:true,  points:80,  created_at:"2025-03-10" },
  { id:"s5",  full_name:"Kiran Bhat",        email:"kiran@rvce.edu.in",    branch:"CSE",  year_of_study:3, roll_number:"1RV21CS067", is_verified:true,  is_active:false, points:210, created_at:"2025-01-20" },
  { id:"s6",  full_name:"Divya Nair",        email:"divya@rvce.edu.in",    branch:"Civil",year_of_study:2, roll_number:"1RV22CV033", is_verified:true,  is_active:true,  points:95,  created_at:"2025-02-25" },
  { id:"s7",  full_name:"Aakash Singh",      email:"aakash@rvce.edu.in",   branch:"ECE",  year_of_study:4, roll_number:"1RV20EC044", is_verified:true,  is_active:true,  points:440, created_at:"2025-01-08" },
  { id:"s8",  full_name:"Meera Subramaniam", email:"meera@rvce.edu.in",    branch:"IS",   year_of_study:3, roll_number:"1RV21IS029", is_verified:true,  is_active:true,  points:175, created_at:"2025-01-18" },
]

const INITIAL_EVENTS = [
  { id:"e1", title:"InnovateFest Hackathon", organizer:"Prof. Kavita Nair", department:"CSE",  tag:"Hackathon",  date:"2025-02-14", status:"approved",  registrations:240, capacity:300 },
  { id:"e2", title:"Spring Culturals 2025",  organizer:"Prof. Rajan Pillai",department:"ECE",  tag:"Cultural",   date:"2025-03-01", status:"approved",  registrations:580, capacity:600 },
  { id:"e3", title:"UX Design Sprint",       organizer:"Prof. Deepa Menon", department:"IS",   tag:"Workshop",   date:"2025-01-30", status:"pending",   registrations:18,  capacity:60  },
  { id:"e4", title:"Inter-College Debate",   organizer:"Prof. Sunita Rao",  department:"Mech", tag:"Academic",   date:"2025-02-08", status:"approved",  registrations:32,  capacity:32  },
  { id:"e5", title:"Robotics Expo '25",      organizer:"Prof. Anil Kumar",  department:"Civil",tag:"Exhibition", date:"2025-03-12", status:"pending",   registrations:0,   capacity:500 },
  { id:"e6", title:"Open Mic Night",         organizer:"Prof. Deepa Menon", department:"IS",   tag:"Cultural",   date:"2025-02-05", status:"rejected",  registrations:0,   capacity:150 },
  { id:"e7", title:"ML Bootcamp",            organizer:"Prof. Kavita Nair", department:"CSE",  tag:"Workshop",   date:"2025-01-28", status:"completed", registrations:62,  capacity:80  },
  { id:"e8", title:"Basketball Tournament",  organizer:"Prof. Rajan Pillai",department:"ECE",  tag:"Sports",     date:"2025-02-22", status:"approved",  registrations:84,  capacity:120 },
]

const ACTIVITY_LOG = [
  { id:1, type:"event",     color:"#1B4D3E", text:"InnovateFest Hackathon was approved",             time:"2 hours ago" },
  { id:2, type:"user",      color:"#6B4EFF", text:"New faculty Dr. Rekha Verma joined CSE dept",     time:"Yesterday" },
  { id:3, type:"event",     color:"#D4840A", text:"UX Design Sprint is pending your review",          time:"2 days ago" },
  { id:4, type:"organizer", color:"#E8390C", text:"Prof. Deepa Menon assigned as IS organizer",       time:"3 days ago" },
  { id:5, type:"user",      color:"#0A5299", text:"8 new students registered this week",              time:"4 days ago" },
  { id:6, type:"event",     color:"#E8390C", text:"Open Mic Night was rejected — venue conflict",     time:"1 week ago" },
]

const DEPARTMENTS = ["CSE","ECE","Mech","Civil","IS","EEE","Bio-Tech","MBA"]
const BRANCHES    = ["Computer Science & Engineering","Electronics & Communication","Mechanical Engineering","Civil Engineering","Information Science","Electrical Engineering"]
const YEARS       = ["1st Year","2nd Year","3rd Year","4th Year"]

// ── HELPERS ─────────────────────────────────────────────────

const initials = n => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()
const fmtDate  = s => { if(!s)return"—"; return new Date(s).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) }
const pct      = (a,b) => b > 0 ? Math.min(100, Math.round((a/b)*100)) : 0

const EVENT_STATUS_STYLE = {
  approved:  "pill-green",
  pending:   "pill-amber",
  rejected:  "pill-red",
  completed: "pill-ink",
}

const TAG_STYLE = {
  Hackathon:  "pill-red",
  Cultural:   "pill-purple",
  Workshop:   "pill-blue",
  Academic:   "pill-ink",
  Exhibition: "pill-amber",
  Sports:     "pill-green",
}

// ── SMALL REUSABLE COMPONENTS ────────────────────────────────

function Cursor() {
  const dot  = useRef(null)
  const ring = useRef(null)
  const p    = useRef({ mx:300, my:300, rx:300, ry:300 })
  useEffect(() => {
    const onMove = e => { p.current.mx = e.clientX; p.current.my = e.clientY }
    document.addEventListener("mousemove", onMove)
    let raf
    const loop = () => {
      const c = p.current
      c.rx += (c.mx - c.rx) * 0.11
      c.ry += (c.my - c.ry) * 0.11
      if (dot.current)  { dot.current.style.left  = c.mx+"px"; dot.current.style.top  = c.my+"px" }
      if (ring.current) { ring.current.style.left = c.rx+"px"; ring.current.style.top = c.ry+"px" }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { document.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf) }
  }, [])
  return (
    <>
      <div id="cur-dot" ref={dot} />
      <div id="cur-ring" ref={ring} />
    </>
  )
}

function Toast({ msg, color, show }) {
  return (
    <div className={`toast flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#141414] text-[#F4EEE3] text-sm font-semibold shadow-xl ${show?"show":""}`}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {msg}
    </div>
  )
}

function Modal({ open, onClose, eyebrow="Manage", title, wide=false, children }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [onClose])
  return (
    <div className={`modal-overlay ${open?"open":""}`} onClick={e => e.target===e.currentTarget && onClose()}>
      <div className={`modal-box bg-[#F4EEE3] rounded-2xl w-full max-h-[90vh] overflow-y-auto custom-scroll ${wide?"max-w-2xl":"max-w-lg"}`}>
        <div className="flex items-start justify-between px-7 pt-7 mb-5">
          <div>
            <p className="font-mono text-[0.56rem] font-bold tracking-[0.12em] uppercase text-[#E8390C] mb-1.5">{eyebrow}</p>
            <h3 className="font-serif font-bold text-[1.5rem] tracking-[-0.025em] leading-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/40 text-sm hover:bg-[#141414] hover:text-[#F4EEE3] transition-all flex-shrink-0 mt-1">✕</button>
        </div>
        <div className="px-7 pb-7">{children}</div>
      </div>
    </div>
  )
}

function Inp({ label, note, className="", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="field-label">{label}</label>}
      <input className={`field-input ${className}`} {...props} />
      {note && <span className="text-[0.68rem] text-black/35">{note}</span>}
    </div>
  )
}

function Sel({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="field-label">{label}</label>}
      <select className="field-input appearance-none" {...props}>{children}</select>
    </div>
  )
}

function Textarea({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="field-label">{label}</label>}
      <textarea className="field-input field-textarea" {...props} />
    </div>
  )
}

function BtnRed({ children, onClick, small=false, className="" }) {
  return (
    <button onClick={onClick}
      className={`rounded-full bg-[#E8390C] text-white font-bold hover:bg-[#c42d08] hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(232,57,12,0.3)] transition-all ${small?"text-[0.76rem] px-4 py-2":"text-[0.82rem] px-5 py-2.5"} ${className}`}>
      {children}
    </button>
  )
}

function BtnGhost({ children, onClick, small=false, className="" }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border border-black/20 text-black/40 font-semibold hover:border-[#141414] hover:text-[#141414] transition-all ${small?"text-[0.76rem] px-4 py-2":"text-[0.82rem] px-5 py-2.5"} ${className}`}>
      {children}
    </button>
  )
}

function SearchBar({ value, onChange, placeholder="Search…" }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
        <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <input value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-[0.85rem] text-[#141414] w-full focus:outline-none focus:border-[#E8390C] transition-colors placeholder-black/25"/>
    </div>
  )
}

function ConfirmModal({ open, onClose, onConfirm, title, message, danger=true }) {
  return (
    <Modal open={open} onClose={onClose} eyebrow={danger?"Danger":"Confirm"} title={title}>
      <p className="text-[0.88rem] text-black/50 leading-relaxed mb-6">{message}</p>
      <div className="flex gap-2">
        <BtnGhost onClick={onClose} className="flex-1">Cancel</BtnGhost>
        <button onClick={()=>{onConfirm();onClose()}}
          className={`flex-1 py-2.5 rounded-full font-bold text-[0.85rem] transition-all ${danger?"bg-[#E8390C] text-white hover:bg-[#c42d08]":"bg-[#141414] text-[#F4EEE3] hover:bg-[#2d2d2d]"}`}>
          {danger ? "Yes, delete" : "Confirm"}
        </button>
      </div>
    </Modal>
  )
}

// ── SIDEBAR ──────────────────────────────────────────────────

const NAV_ITEMS = [
  { section:"Main" },
  { id:"overview",   icon:"◈",  label:"Overview"    },
  { id:"events",     icon:"📅", label:"Events",      badge: INITIAL_EVENTS.filter(e=>e.status==="pending").length },
  { section:"People" },
  { id:"organizers", icon:"⬡",  label:"Organizers"  },
  { id:"faculty",    icon:"📋", label:"Faculty"      },
  { id:"students",   icon:"🎓", label:"Students"     },
  { section:"Account" },
  { id:"profile",    icon:"◎",  label:"My Profile"   },
]

function Sidebar({ activePage, onNav, admin }) {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-[#141414] text-[#F4EEE3] flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-7 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-[4px] bg-[#F4EEE3] flex items-center justify-center flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="4" cy="4" r="2" fill="#141414"/>
            <circle cx="12" cy="4" r="2" fill="#141414"/>
            <circle cx="8" cy="12" r="2" fill="#141414"/>
            <line x1="4" y1="4" x2="12" y2="4" stroke="#141414" strokeWidth="1.5"/>
            <line x1="4" y1="4" x2="8" y2="12" stroke="#141414" strokeWidth="1.5"/>
            <line x1="12" y1="4" x2="8" y2="12" stroke="#141414" strokeWidth="1.5"/>
          </svg>
        </div>
        <div>
          <div className="font-mono font-bold text-[0.88rem] tracking-[0.06em]">KNOT</div>
          <div className="font-mono text-[0.5rem] text-white/25 tracking-[0.06em] uppercase">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto custom-scroll">
        {NAV_ITEMS.map((item, i) =>
          item.section ? (
            <p key={i} className="font-mono text-[0.5rem] font-bold tracking-[0.14em] uppercase text-white/20 px-3 pt-4 pb-1.5">{item.section}</p>
          ) : (
            <button key={item.id} onClick={() => onNav(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.84rem] font-medium transition-all relative text-left w-full ${
                activePage === item.id
                  ? "bg-white/10 text-[#F4EEE3]"
                  : "text-white/40 hover:bg-white/[0.06] hover:text-white/70"
              }`}>
              {activePage === item.id && <span className="nav-active-line" />}
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-white/[0.04] flex-shrink-0">{item.icon}</span>
              {item.label}
              {item.badge > 0 && (
                <span className="ml-auto font-mono text-[0.55rem] font-bold bg-[#E8390C] text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          )
        )}
      </nav>

      {/* Profile mini */}
      <div className="border-t border-white/[0.06] p-3">
        <button onClick={() => onNav("profile")}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition-colors w-full text-left">
          <div className="w-8 h-8 rounded-full bg-[#E8390C] flex items-center justify-center font-mono text-[0.62rem] font-bold text-white flex-shrink-0 relative">
            {initials(admin.full_name)}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#141414]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.82rem] font-semibold text-white/75 leading-tight truncate">{admin.full_name}</p>
            <p className="text-[0.66rem] text-white/28">College Admin</p>
          </div>
        </button>
      </div>
    </aside>
  )
}

// ── TOPBAR ───────────────────────────────────────────────────

function Topbar({ page, onToast }) {
  const PAGE_LABELS = {
    overview:"Overview", events:"Events", organizers:"Organizers",
    faculty:"Faculty", students:"Students", profile:"My Profile",
  }
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-8 h-[58px] bg-[#F4EEE3]/93 backdrop-blur-md border-b border-black/10 sticky top-0 z-20">
      <div className="flex items-center gap-2 text-[0.82rem] text-black/40">
        KNOT <span className="text-black/20">›</span>
        <span className="text-[#141414] font-semibold">{PAGE_LABELS[page] || page}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 rounded-full bg-[#EAE1D0] border border-black/10 flex items-center justify-center text-black/40 hover:border-black/20 transition-all">
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E8390C] border border-[#F4EEE3]" />
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 00-4 4c0 3-1.5 4-1.5 4h11S12 9 12 6a4 4 0 00-4-4zM6.5 12a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3"/></svg>
        </div>
        <span className="text-[0.75rem] text-black/30 font-mono">RVCE</span>
      </div>
    </header>
  )
}

// ── PAGE: OVERVIEW ───────────────────────────────────────────

function Overview({ organizers, faculty, students, events, onNav }) {
  const pending   = events.filter(e => e.status === "pending")
  const approved  = events.filter(e => e.status === "approved")
  const totalRegs = events.reduce((s,e) => s + e.registrations, 0)

  const STATS = [
    { label:"Total Events",    val: events.length,      sub:`${pending.length} pending review`, color:"#E8390C",  icon:"📅" },
    { label:"Organizers",      val: organizers.length,  sub:`${organizers.filter(o=>o.is_active).length} active`, color:"#D4840A", icon:"⬡" },
    { label:"Faculty",         val: faculty.length,     sub:`${faculty.filter(f=>f.is_verified).length} verified`, color:"#6B4EFF", icon:"📋" },
    { label:"Students",        val: students.length,    sub:`${totalRegs} total registrations`, color:"#1B4D3E",  icon:"🎓" },
  ]

  return (
    <div className="p-8">
      {/* Heading */}
      <div className="mb-8 au">
        <h1 className="font-serif font-bold tracking-[-0.035em] leading-tight mb-1" style={{ fontSize:"clamp(2rem,3.5vw,3rem)" }}>
          Good morning, <em className="font-light italic text-black/40">Dr. Sharma.</em>
        </h1>
        <p className="text-[0.9rem] text-black/40">{pending.length} event{pending.length!==1?"s":""} waiting for your review today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STATS.map((s,i) => (
          <div key={s.label} className={`stat-card bg-white border border-black/10 rounded-2xl p-6 cursor-pointer au${i}`} onClick={()=>onNav(["events","organizers","faculty","students"][i])}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-2xl">{s.icon}</span>
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.08em] text-black/25">{s.label}</span>
            </div>
            <div className="stat-num mb-1" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[0.75rem] text-black/35">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 au2">

        {/* Pending events */}
        <div className="col-span-2 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]">
            <div>
              <span className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-black/40">Pending Review</span>
              {pending.length > 0 && <span className="ml-2 font-mono text-[0.55rem] font-bold bg-[#E8390C]/10 text-[#E8390C] px-2 py-0.5 rounded-full">{pending.length}</span>}
            </div>
            <button onClick={()=>onNav("events")} className="text-[0.75rem] font-semibold text-[#E8390C] hover:opacity-70 transition-opacity">See all →</button>
          </div>
          {pending.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✓</div><p className="text-[0.88rem] text-black/40">All caught up — no pending events</p></div>
          ) : (
            <table className="data-table">
              <thead><tr>
                <th>Event</th><th>Organizer</th><th>Dept</th><th>Date</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {pending.map(ev => (
                  <tr key={ev.id}>
                    <td className="font-semibold max-w-[180px] truncate">{ev.title}</td>
                    <td className="text-black/50 text-[0.8rem]">{ev.organizer.split(" ").slice(-1)[0]}</td>
                    <td><span className="pill pill-ink">{ev.department}</span></td>
                    <td className="font-mono text-[0.72rem] text-black/40">{fmtDate(ev.date)}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button className="px-3 py-1.5 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] text-[0.7rem] font-bold hover:bg-[#1B4D3E]/20 transition-colors">Approve</button>
                        <button className="px-3 py-1.5 rounded-full bg-[#E8390C]/10 text-[#E8390C] text-[0.7rem] font-bold hover:bg-[#E8390C]/20 transition-colors">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity */}
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.05]">
            <span className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-black/40">Recent Activity</span>
          </div>
          <div className="timeline p-5 pt-4">
            {ACTIVITY_LOG.map((a,i) => (
              <div key={a.id} className="tl-item relative mb-0">
                <div className="tl-dot" style={{ background: a.color }} />
                <div className="mb-3">
                  <p className="text-[0.8rem] text-[#141414] leading-snug">{a.text}</p>
                  <p className="font-mono text-[0.58rem] text-black/30 mt-1">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Event breakdown */}
      <div className="mt-5 grid grid-cols-2 gap-5 au3">
        <div className="bg-white border border-black/10 rounded-2xl p-6">
          <p className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-black/40 mb-5">Events by Status</p>
          {[
            { label:"Approved",  val: approved.length,                        max: events.length, color:"#1B4D3E" },
            { label:"Pending",   val: pending.length,                         max: events.length, color:"#D4840A" },
            { label:"Rejected",  val: events.filter(e=>e.status==="rejected").length, max: events.length, color:"#E8390C" },
            { label:"Completed", val: events.filter(e=>e.status==="completed").length,max: events.length, color:"#6B4EFF" },
          ].map(s => (
            <div key={s.label} className="mb-4">
              <div className="flex justify-between text-[0.78rem] mb-1.5">
                <span className="text-black/50">{s.label}</span>
                <span className="font-semibold" style={{ color:s.color }}>{s.val}</span>
              </div>
              <div className="prog-track"><div className="prog-fill" style={{ width:`${pct(s.val,s.max)}%`, background:s.color }} /></div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-black/10 rounded-2xl p-6">
          <p className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-black/40 mb-5">Top Events by Registrations</p>
          {[...events].sort((a,b)=>b.registrations-a.registrations).slice(0,4).map((ev,i) => (
            <div key={ev.id} className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[0.6rem] text-black/20 w-4 flex-shrink-0">0{i+1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.82rem] font-semibold truncate">{ev.title}</p>
                <div className="prog-track mt-1"><div className="prog-fill" style={{ width:`${pct(ev.registrations,ev.capacity)}%`, background:"#E8390C" }} /></div>
              </div>
              <span className="font-mono text-[0.68rem] text-black/40 flex-shrink-0">{ev.registrations}/{ev.capacity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── PAGE: EVENTS ─────────────────────────────────────────────

function Events({ events, setEvents, onToast }) {
  const [q, setQ]           = useState("")
  const [filt, setFilt]     = useState("all")
  const [viewEv, setViewEv] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const STATUS_FILTERS = ["all","pending","approved","rejected","completed"]

  const filtered = events.filter(ev => {
    const matchQ = ev.title.toLowerCase().includes(q.toLowerCase()) || ev.organizer.toLowerCase().includes(q.toLowerCase())
    const matchF = filt==="all" || ev.status===filt
    return matchQ && matchF
  })

  const changeStatus = (id, status) => {
    setEvents(prev => prev.map(e => e.id===id ? {...e, status} : e))
    onToast(`Event ${status}`, status==="approved"?"#1B4D3E":"#E8390C")
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-7 au">
        <div>
          <h1 className="font-serif font-bold tracking-[-0.035em] mb-1" style={{ fontSize:"clamp(1.9rem,3vw,2.8rem)" }}>
            Events <em className="font-light italic text-black/40">management.</em>
          </h1>
          <p className="text-[0.88rem] text-black/40">{events.filter(e=>e.status==="pending").length} pending · {events.length} total</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 mb-5 flex-wrap au1">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={()=>setFilt(f)}
              className={`px-3.5 py-2 rounded-full text-[0.76rem] font-semibold border capitalize transition-all ${
                filt===f ? "bg-[#141414] text-[#F4EEE3] border-[#141414]" : "border-black/20 text-black/40 hover:border-[#141414] hover:text-[#141414]"
              }`}>
              {f}
              {f!=="all" && <span className="ml-1.5 font-mono text-[0.6em] opacity-70">{events.filter(e=>e.status===f).length}</span>}
            </button>
          ))}
        </div>
        <div className="ml-auto w-60"><SearchBar value={q} onChange={setQ} placeholder="Search events…"/></div>
      </div>

      {/* Table */}
      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden au2">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📅</div><p className="font-serif text-lg font-bold mb-1">No events found</p><p className="text-sm text-black/40">Try adjusting your filters</p></div>
        ) : (
          <table className="data-table">
            <thead><tr>
              <th>Event</th><th>Organizer</th><th>Dept</th><th>Type</th><th>Date</th><th>Registrations</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <button onClick={()=>setViewEv(ev)} className="font-semibold text-[0.88rem] hover:text-[#E8390C] transition-colors text-left">
                      {ev.title}
                    </button>
                  </td>
                  <td className="text-black/50 text-[0.8rem]">{ev.organizer}</td>
                  <td><span className="pill pill-ink">{ev.department}</span></td>
                  <td><span className={`pill ${TAG_STYLE[ev.tag]||"pill-ink"}`}>{ev.tag}</span></td>
                  <td className="font-mono text-[0.72rem] text-black/40 whitespace-nowrap">{fmtDate(ev.date)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.72rem]">{ev.registrations}/{ev.capacity}</span>
                      <div className="w-16 prog-track"><div className="prog-fill" style={{ width:`${pct(ev.registrations,ev.capacity)}%`, background:"#E8390C" }} /></div>
                    </div>
                  </td>
                  <td><span className={`pill ${EVENT_STATUS_STYLE[ev.status]}`}>{ev.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {ev.status==="pending" && <>
                        <button onClick={()=>changeStatus(ev.id,"approved")} className="px-3 py-1 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] text-[0.68rem] font-bold hover:bg-[#1B4D3E]/20 transition-colors whitespace-nowrap">Approve</button>
                        <button onClick={()=>changeStatus(ev.id,"rejected")} className="px-3 py-1 rounded-full bg-[#E8390C]/10 text-[#E8390C] text-[0.68rem] font-bold hover:bg-[#E8390C]/20 transition-colors">Reject</button>
                      </>}
                      {ev.status!=="pending" && (
                        <button onClick={()=>setViewEv(ev)} className="px-3 py-1 rounded-full border border-black/15 text-black/40 text-[0.68rem] font-semibold hover:border-black/30 hover:text-black transition-colors">View</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View event modal */}
      {viewEv && (
        <Modal open={!!viewEv} onClose={()=>setViewEv(null)} eyebrow="Event Detail" title={viewEv.title} wide>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[
              { l:"Organizer",      v: viewEv.organizer },
              { l:"Department",     v: viewEv.department },
              { l:"Event Type",     v: viewEv.tag },
              { l:"Date",           v: fmtDate(viewEv.date) },
              { l:"Registrations",  v: `${viewEv.registrations} / ${viewEv.capacity}` },
              { l:"Status",         v: viewEv.status },
            ].map(f => (
              <div key={f.l}>
                <label className="field-label">{f.l}</label>
                <p className="text-[0.9rem] font-semibold mt-1 capitalize">{f.v}</p>
              </div>
            ))}
          </div>
          <div className="mb-5">
            <label className="field-label">Registration Progress</label>
            <div className="prog-track mt-2 h-2"><div className="prog-fill" style={{ width:`${pct(viewEv.registrations,viewEv.capacity)}%`, background:"#E8390C" }} /></div>
            <p className="text-[0.75rem] text-black/40 mt-1">{pct(viewEv.registrations,viewEv.capacity)}% full</p>
          </div>
          {viewEv.status==="pending" && (
            <div className="flex gap-2 mt-2">
              <button onClick={()=>{changeStatus(viewEv.id,"approved");setViewEv(null)}} className="flex-1 py-3 rounded-full bg-[#1B4D3E] text-white font-bold text-[0.85rem] hover:opacity-90 transition-opacity">Approve Event</button>
              <button onClick={()=>{changeStatus(viewEv.id,"rejected");setViewEv(null)}} className="flex-1 py-3 rounded-full bg-[#E8390C] text-white font-bold text-[0.85rem] hover:opacity-90 transition-opacity">Reject Event</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

// ── PAGE: ORGANIZERS ─────────────────────────────────────────

function Organizers({ organizers, setOrganizers, onToast }) {
  const [q, setQ]               = useState("")
  const [addOpen, setAddOpen]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const [form, setForm]         = useState({ full_name:"", email:"", department:DEPARTMENTS[0] })

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const filtered = organizers.filter(o =>
    o.full_name.toLowerCase().includes(q.toLowerCase()) ||
    o.email.toLowerCase().includes(q.toLowerCase()) ||
    o.department.toLowerCase().includes(q.toLowerCase())
  )

  const openAdd = () => { setForm({ full_name:"", email:"", department:DEPARTMENTS[0] }); setAddOpen(true) }
  const openEdit = o => { setForm({ full_name:o.full_name, email:o.email, department:o.department }); setEditItem(o) }

  const saveAdd = () => {
    if (!form.full_name || !form.email) return
    setOrganizers(p => [...p, { id:"o"+Date.now(), ...form, events_managed:0, is_active:true, created_at:new Date().toISOString().split("T")[0] }])
    setAddOpen(false)
    onToast("Organizer added successfully", "#1B4D3E")
  }
  const saveEdit = () => {
    setOrganizers(p => p.map(o => o.id===editItem.id ? {...o,...form} : o))
    setEditItem(null)
    onToast("Organizer updated", "#6B4EFF")
  }
  const toggleActive = id => {
    setOrganizers(p => p.map(o => o.id===id ? {...o, is_active:!o.is_active} : o))
    onToast("Status updated", "#D4840A")
  }
  const remove = id => {
    setOrganizers(p => p.filter(o => o.id!==id))
    onToast("Organizer removed", "#E8390C")
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-7 au">
        <div>
          <h1 className="font-serif font-bold tracking-[-0.035em] mb-1" style={{ fontSize:"clamp(1.9rem,3vw,2.8rem)" }}>
            Organizers <em className="font-light italic text-black/40">management.</em>
          </h1>
          <p className="text-[0.88rem] text-black/40">{organizers.filter(o=>o.is_active).length} active · {organizers.length} total</p>
        </div>
        <BtnRed onClick={openAdd}>+ Add Organizer</BtnRed>
      </div>

      <div className="flex items-center gap-3 mb-5 au1">
        <div className="w-72"><SearchBar value={q} onChange={setQ} placeholder="Search organizers…"/></div>
        <div className="ml-auto font-mono text-[0.7rem] text-black/30">{filtered.length} result{filtered.length!==1?"s":""}</div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden au2">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">⬡</div><p className="font-serif text-lg font-bold mb-1">No organizers found</p><p className="text-sm text-black/40">Add your first organizer to get started</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Events</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#D4840A] flex items-center justify-center font-mono text-[0.58rem] font-bold text-white flex-shrink-0">{initials(o.full_name)}</div>
                      <span className="font-semibold text-[0.88rem]">{o.full_name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-[0.72rem] text-black/50">{o.email}</td>
                  <td><span className="pill pill-amber">{o.department}</span></td>
                  <td className="font-semibold text-[0.88rem]">{o.events_managed}</td>
                  <td><span className={`pill ${o.is_active?"pill-green":"pill-ink"}`}>{o.is_active?"Active":"Inactive"}</span></td>
                  <td className="font-mono text-[0.72rem] text-black/35">{fmtDate(o.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>openEdit(o)} className="px-3 py-1 rounded-full border border-black/15 text-[0.68rem] font-semibold text-black/40 hover:border-black/30 hover:text-black transition-all">Edit</button>
                      <button onClick={()=>toggleActive(o.id)} className={`px-3 py-1 rounded-full text-[0.68rem] font-semibold transition-all ${o.is_active?"border border-[#E8390C]/30 text-[#E8390C] hover:bg-[#E8390C]/10":"border border-[#1B4D3E]/30 text-[#1B4D3E] hover:bg-[#1B4D3E]/10"}`}>
                        {o.is_active?"Deactivate":"Activate"}
                      </button>
                      <button onClick={()=>setConfirm({id:o.id,name:o.full_name})} className="px-3 py-1 rounded-full bg-[#E8390C]/8 text-[#E8390C] text-[0.68rem] font-semibold hover:bg-[#E8390C]/15 transition-colors">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add modal */}
      <Modal open={addOpen} onClose={()=>setAddOpen(false)} eyebrow="Organizer" title="Add new organizer">
        <div className="flex flex-col gap-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Full Name" placeholder="Prof. Kavita Nair" value={form.full_name} onChange={e=>set("full_name",e.target.value)}/>
            <Sel label="Department" value={form.department} onChange={e=>set("department",e.target.value)}>
              {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
            </Sel>
          </div>
          <Inp label="Official Email" type="email" placeholder="faculty@rvce.edu.in" value={form.email} onChange={e=>set("email",e.target.value)} note="They'll receive login credentials at this email."/>
        </div>
        <div className="flex gap-2">
          <BtnGhost onClick={()=>setAddOpen(false)} className="flex-1">Cancel</BtnGhost>
          <BtnRed onClick={saveAdd} className="flex-1">Add Organizer</BtnRed>
        </div>
      </Modal>

      {/* Edit modal */}
      {editItem && (
        <Modal open={!!editItem} onClose={()=>setEditItem(null)} eyebrow="Organizer" title="Edit organizer">
          <div className="flex flex-col gap-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Full Name" value={form.full_name} onChange={e=>set("full_name",e.target.value)}/>
              <Sel label="Department" value={form.department} onChange={e=>set("department",e.target.value)}>
                {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
              </Sel>
            </div>
            <Inp label="Email" type="email" value={form.email} onChange={e=>set("email",e.target.value)}/>
          </div>
          <div className="flex gap-2">
            <BtnGhost onClick={()=>setEditItem(null)} className="flex-1">Cancel</BtnGhost>
            <BtnRed onClick={saveEdit} className="flex-1">Save Changes</BtnRed>
          </div>
        </Modal>
      )}

      {/* Confirm remove */}
      {confirm && (
        <ConfirmModal open={!!confirm} onClose={()=>setConfirm(null)} onConfirm={()=>remove(confirm.id)}
          title={`Remove ${confirm.name}?`}
          message="This organizer will be removed from your college. All their events will remain but they'll lose organizer access."/>
      )}
    </div>
  )
}

// ── PAGE: FACULTY ────────────────────────────────────────────

function Faculty({ faculty, setFaculty, onToast }) {
  const [q, setQ]               = useState("")
  const [filt, setFilt]         = useState("all")
  const [addOpen, setAddOpen]   = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const [form, setForm]         = useState({ full_name:"", email:"", branch:BRANCHES[0] })

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const filtered = faculty.filter(f => {
    const matchQ = f.full_name.toLowerCase().includes(q.toLowerCase()) || f.email.toLowerCase().includes(q.toLowerCase()) || f.branch.toLowerCase().includes(q.toLowerCase())
    const matchF = filt==="all" || (filt==="verified"&&f.is_verified) || (filt==="unverified"&&!f.is_verified) || (filt==="inactive"&&!f.is_active)
    return matchQ && matchF
  })

  const toggleVerified = id => { setFaculty(p=>p.map(f=>f.id===id?{...f,is_verified:!f.is_verified}:f)); onToast("Verification updated","#6B4EFF") }
  const toggleActive   = id => { setFaculty(p=>p.map(f=>f.id===id?{...f,is_active:!f.is_active}:f));  onToast("Status updated","#D4840A") }
  const remove         = id => { setFaculty(p=>p.filter(f=>f.id!==id)); onToast("Faculty removed","#E8390C") }
  const saveAdd = () => {
    if (!form.full_name||!form.email) return
    setFaculty(p=>[...p,{id:"f"+Date.now(),...form,year_of_study:null,roll_number:null,is_verified:false,is_active:true,created_at:new Date().toISOString().split("T")[0]}])
    setAddOpen(false); setForm({full_name:"",email:"",branch:BRANCHES[0]})
    onToast("Faculty added successfully","#1B4D3E")
  }

  const FACULTY_FILTERS = ["all","verified","unverified","inactive"]

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-7 au">
        <div>
          <h1 className="font-serif font-bold tracking-[-0.035em] mb-1" style={{ fontSize:"clamp(1.9rem,3vw,2.8rem)" }}>
            Faculty <em className="font-light italic text-black/40">accounts.</em>
          </h1>
          <p className="text-[0.88rem] text-black/40">{faculty.filter(f=>f.is_verified).length} verified · {faculty.length} total</p>
        </div>
        <BtnRed onClick={()=>setAddOpen(true)}>+ Add Faculty</BtnRed>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap au1">
        <div className="flex gap-1.5">
          {FACULTY_FILTERS.map(f => (
            <button key={f} onClick={()=>setFilt(f)} className={`px-3.5 py-2 rounded-full text-[0.76rem] font-semibold border capitalize transition-all ${filt===f?"bg-[#141414] text-[#F4EEE3] border-[#141414]":"border-black/20 text-black/40 hover:border-[#141414] hover:text-[#141414]"}`}>{f}</button>
          ))}
        </div>
        <div className="ml-auto w-60"><SearchBar value={q} onChange={setQ} placeholder="Search faculty…"/></div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden au2">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><p className="font-serif text-lg font-bold mb-1">No faculty found</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>Verified</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#6B4EFF] flex items-center justify-center font-mono text-[0.58rem] font-bold text-white flex-shrink-0">{initials(f.full_name)}</div>
                      <button onClick={()=>setViewItem(f)} className="font-semibold text-[0.88rem] hover:text-[#E8390C] transition-colors text-left">{f.full_name}</button>
                    </div>
                  </td>
                  <td className="font-mono text-[0.72rem] text-black/50">{f.email}</td>
                  <td><span className="pill pill-purple">{f.branch.split(" ")[0]}</span></td>
                  <td><span className={`pill ${f.is_verified?"pill-green":"pill-amber"}`}>{f.is_verified?"Verified":"Pending"}</span></td>
                  <td><span className={`pill ${f.is_active?"pill-green":"pill-ink"}`}>{f.is_active?"Active":"Inactive"}</span></td>
                  <td className="font-mono text-[0.72rem] text-black/35">{fmtDate(f.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {!f.is_verified && <button onClick={()=>toggleVerified(f.id)} className="px-3 py-1 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] text-[0.68rem] font-bold hover:bg-[#1B4D3E]/20 transition-colors whitespace-nowrap">Verify</button>}
                      <button onClick={()=>toggleActive(f.id)} className={`px-3 py-1 rounded-full text-[0.68rem] font-semibold border transition-all ${f.is_active?"border-[#E8390C]/25 text-[#E8390C] hover:bg-[#E8390C]/8":"border-[#1B4D3E]/25 text-[#1B4D3E] hover:bg-[#1B4D3E]/8"}`}>
                        {f.is_active?"Deactivate":"Activate"}
                      </button>
                      <button onClick={()=>setConfirm({id:f.id,name:f.full_name})} className="px-3 py-1 rounded-full bg-[#E8390C]/8 text-[#E8390C] text-[0.68rem] font-semibold hover:bg-[#E8390C]/15 transition-colors">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={addOpen} onClose={()=>setAddOpen(false)} eyebrow="Faculty" title="Add faculty member">
        <div className="flex flex-col gap-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Full Name" placeholder="Dr. Kavita Nair" value={form.full_name} onChange={e=>set("full_name",e.target.value)}/>
            <Sel label="Branch" value={form.branch} onChange={e=>set("branch",e.target.value)}>
              {BRANCHES.map(b=><option key={b}>{b}</option>)}
            </Sel>
          </div>
          <Inp label="Official Email" type="email" placeholder="faculty@rvce.edu.in" value={form.email} onChange={e=>set("email",e.target.value)} note="They'll receive an OTP verification email."/>
        </div>
        <div className="flex gap-2">
          <BtnGhost onClick={()=>setAddOpen(false)} className="flex-1">Cancel</BtnGhost>
          <BtnRed onClick={saveAdd} className="flex-1">Add Faculty</BtnRed>
        </div>
      </Modal>

      {viewItem && (
        <Modal open={!!viewItem} onClose={()=>setViewItem(null)} eyebrow="Faculty" title={viewItem.full_name}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[
              {l:"Email",   v:viewItem.email},
              {l:"Branch",  v:viewItem.branch},
              {l:"Verified",v:viewItem.is_verified?"Yes":"No"},
              {l:"Status",  v:viewItem.is_active?"Active":"Inactive"},
              {l:"Joined",  v:fmtDate(viewItem.created_at)},
            ].map(r=><div key={r.l}><label className="field-label">{r.l}</label><p className="text-[0.9rem] font-semibold mt-1">{r.v}</p></div>)}
          </div>
          <div className="flex gap-2">
            {!viewItem.is_verified && <button onClick={()=>{toggleVerified(viewItem.id);setViewItem(null)}} className="flex-1 py-2.5 rounded-full bg-[#1B4D3E] text-white font-bold text-[0.85rem] hover:opacity-90 transition-opacity">Verify Account</button>}
          </div>
        </Modal>
      )}

      {confirm && <ConfirmModal open={!!confirm} onClose={()=>setConfirm(null)} onConfirm={()=>remove(confirm.id)} title={`Remove ${confirm.name}?`} message="This faculty account will be removed from your college."/>}
    </div>
  )
}

// ── PAGE: STUDENTS ───────────────────────────────────────────

function Students({ students, setStudents, onToast }) {
  const [q, setQ]           = useState("")
  const [branch, setBranch] = useState("all")
  const [year, setYear]     = useState("all")
  const [viewItem, setViewItem] = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const [selected, setSelected] = useState(new Set())

  const toggleSelect = id => setSelected(p => { const s=new Set(p); s.has(id)?s.delete(id):s.add(id); return s })
  const selectAll    = () => setSelected(new Set(filtered.map(s=>s.id)))
  const clearSelect  = () => setSelected(new Set())

  const filtered = students.filter(s => {
    const matchQ = s.full_name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()) || (s.roll_number||"").toLowerCase().includes(q.toLowerCase())
    const matchB = branch==="all" || s.branch===branch
    const matchY = year==="all"   || String(s.year_of_study)===year
    return matchQ && matchB && matchY
  })

  const toggleActive   = id => { setStudents(p=>p.map(s=>s.id===id?{...s,is_active:!s.is_active}:s)); onToast("Status updated","#D4840A") }
  const toggleVerified = id => { setStudents(p=>p.map(s=>s.id===id?{...s,is_verified:!s.is_verified}:s)); onToast("Verification updated","#6B4EFF") }
  const remove         = id => { setStudents(p=>p.filter(s=>s.id!==id)); onToast("Student removed","#E8390C") }
  const bulkDeactivate = () => {
    setStudents(p=>p.map(s=>selected.has(s.id)?{...s,is_active:false}:s))
    onToast(`${selected.size} students deactivated`,"#D4840A")
    clearSelect()
  }

  const BRANCH_OPTS = ["all",...DEPARTMENTS]

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-7 au">
        <div>
          <h1 className="font-serif font-bold tracking-[-0.035em] mb-1" style={{ fontSize:"clamp(1.9rem,3vw,2.8rem)" }}>
            Students <em className="font-light italic text-black/40">directory.</em>
          </h1>
          <p className="text-[0.88rem] text-black/40">{students.filter(s=>s.is_active).length} active · {students.length} total</p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-white border border-black/10 rounded-xl px-4 py-2.5">
            <span className="font-mono text-[0.7rem] font-bold text-black/50">{selected.size} selected</span>
            <button onClick={bulkDeactivate} className="text-[0.75rem] font-bold text-[#E8390C] hover:opacity-70 transition-opacity">Deactivate all</button>
            <button onClick={clearSelect} className="text-[0.75rem] font-semibold text-black/30 hover:text-black/60 transition-colors">Clear</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap au1">
        <div className="w-64"><SearchBar value={q} onChange={setQ} placeholder="Name, roll number, email…"/></div>
        <select value={branch} onChange={e=>setBranch(e.target.value)} className="px-3 py-2.5 bg-white border border-black/10 rounded-xl text-[0.82rem] text-[#141414] focus:outline-none focus:border-[#E8390C] transition-colors">
          {BRANCH_OPTS.map(b=><option key={b} value={b}>{b==="all"?"All Branches":b}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(e.target.value)} className="px-3 py-2.5 bg-white border border-black/10 rounded-xl text-[0.82rem] text-[#141414] focus:outline-none focus:border-[#E8390C] transition-colors">
          <option value="all">All Years</option>
          {[1,2,3,4].map(y=><option key={y} value={String(y)}>{YEARS[y-1]}</option>)}
        </select>
        <div className="ml-auto font-mono text-[0.7rem] text-black/30">{filtered.length} student{filtered.length!==1?"s":""}</div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden au2">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🎓</div><p className="font-serif text-lg font-bold mb-1">No students found</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" className="w-3.5 h-3.5 accent-[#E8390C]" onChange={e=>e.target.checked?selectAll():clearSelect()} checked={selected.size===filtered.length&&filtered.length>0}/></th>
                <th>Student</th><th>Roll No.</th><th>Branch</th><th>Year</th><th>Points</th><th>Verified</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className={selected.has(s.id)?"selected":""}>
                  <td><input type="checkbox" className="w-3.5 h-3.5 accent-[#E8390C]" checked={selected.has(s.id)} onChange={()=>toggleSelect(s.id)}/></td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#E8390C] flex items-center justify-center font-mono text-[0.58rem] font-bold text-white flex-shrink-0">{initials(s.full_name)}</div>
                      <div>
                        <button onClick={()=>setViewItem(s)} className="font-semibold text-[0.88rem] hover:text-[#E8390C] transition-colors block text-left">{s.full_name}</button>
                        <span className="font-mono text-[0.65rem] text-black/35">{s.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-[0.72rem] text-black/50">{s.roll_number||"—"}</td>
                  <td><span className="pill pill-ink">{s.branch.split(" ")[0]}</span></td>
                  <td className="text-[0.82rem] font-medium">{YEARS[(s.year_of_study||1)-1]}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[0.88rem]">{s.points}</span>
                      {s.points > 200 && <span className="text-[0.6rem]">🏅</span>}
                    </div>
                  </td>
                  <td><span className={`pill ${s.is_verified?"pill-green":"pill-amber"}`}>{s.is_verified?"Verified":"Pending"}</span></td>
                  <td><span className={`pill ${s.is_active?"pill-green":"pill-ink"}`}>{s.is_active?"Active":"Inactive"}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {!s.is_verified && <button onClick={()=>toggleVerified(s.id)} className="px-3 py-1 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] text-[0.68rem] font-bold hover:bg-[#1B4D3E]/20 transition-colors">Verify</button>}
                      <button onClick={()=>toggleActive(s.id)} className={`px-3 py-1 rounded-full text-[0.68rem] font-semibold border transition-all ${s.is_active?"border-[#E8390C]/25 text-[#E8390C] hover:bg-[#E8390C]/8":"border-[#1B4D3E]/25 text-[#1B4D3E] hover:bg-[#1B4D3E]/8"}`}>
                        {s.is_active?"Deactivate":"Activate"}
                      </button>
                      <button onClick={()=>setConfirm({id:s.id,name:s.full_name})} className="px-3 py-1 rounded-full bg-[#E8390C]/8 text-[#E8390C] text-[0.68rem] font-semibold hover:bg-[#E8390C]/15 transition-colors">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View student modal */}
      {viewItem && (
        <Modal open={!!viewItem} onClose={()=>setViewItem(null)} eyebrow="Student" title={viewItem.full_name} wide>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {l:"Email",       v:viewItem.email},
              {l:"College Email",v:viewItem.college_email||"—"},
              {l:"Roll Number", v:viewItem.roll_number||"—"},
              {l:"Branch",      v:viewItem.branch},
              {l:"Year",        v:YEARS[(viewItem.year_of_study||1)-1]},
              {l:"Points",      v:viewItem.points},
              {l:"Verified",    v:viewItem.is_verified?"Yes":"No"},
              {l:"Status",      v:viewItem.is_active?"Active":"Inactive"},
              {l:"Joined",      v:fmtDate(viewItem.created_at)},
            ].map(r=><div key={r.l}><label className="field-label">{r.l}</label><p className="text-[0.9rem] font-semibold mt-0.5">{String(r.v)}</p></div>)}
          </div>
          <div className="flex gap-2">
            {!viewItem.is_verified && (
              <button onClick={()=>{toggleVerified(viewItem.id);setViewItem(null)}} className="flex-1 py-2.5 rounded-full bg-[#1B4D3E] text-white font-bold text-[0.85rem] hover:opacity-90 transition-opacity">Verify Student</button>
            )}
            <button onClick={()=>{toggleActive(viewItem.id);setViewItem(null)}} className={`flex-1 py-2.5 rounded-full font-bold text-[0.85rem] transition-opacity hover:opacity-90 ${viewItem.is_active?"bg-[#E8390C] text-white":"bg-[#141414] text-[#F4EEE3]"}`}>
              {viewItem.is_active?"Deactivate":"Activate"}
            </button>
          </div>
        </Modal>
      )}

      {confirm && <ConfirmModal open={!!confirm} onClose={()=>setConfirm(null)} onConfirm={()=>remove(confirm.id)} title={`Remove ${confirm.name}?`} message="This student account will be permanently removed from your college. All their registrations will also be cancelled."/>}
    </div>
  )
}

// ── PAGE: ADMIN PROFILE ──────────────────────────────────────

function AdminProfile({ admin, onToast }) {
  const [tab, setTab]       = useState("overview")
  const [form, setForm]     = useState({ full_name:admin.full_name, email:admin.email, branch:admin.branch })
  const [dirty, setDirty]   = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setDirty(true) }

  const save = () => { setDirty(false); onToast("Profile updated successfully","#22C55E") }
  const discard = () => {
    setForm({ full_name:admin.full_name, email:admin.email, branch:admin.branch })
    setDirty(false)
  }

  const OVERVIEW_ROWS = [
    {icon:"👤",l:"Full Name",    v: admin.full_name},
    {icon:"📧",l:"Email",        v: admin.email},
    {icon:"🏛️",l:"College",      v: admin.college_name},
    {icon:"🛡️",l:"Role",         v: "College Admin"},
    {icon:"✅",l:"Verified",     v: admin.is_verified?"Yes — Email OTP":"No"},
    {icon:"🟢",l:"Status",       v: admin.is_active?"Active":"Inactive"},
    {icon:"🕐",l:"Last Login",   v: fmtDate(admin.last_login)},
    {icon:"📆",l:"Member Since", v: fmtDate(admin.created_at)},
  ]

  return (
    <div className="p-8">
      {/* Cover */}
      <div className="cover-bg rounded-2xl h-[190px] mb-14 relative au">
        <div className="cover-grid rounded-2xl"/>
        <div className="cover-diagonal rounded-2xl"/>
        <div className="cover-watermark">{admin.full_name.split(" ").slice(-1)[0]}</div>
        <div className="absolute bottom-5 right-6 flex gap-5">
          {[{v:"Admin",l:"Role"},{v:fmtDate(admin.created_at),l:"Joined"}].map(s=>(
            <div key={s.l} className="text-right">
              <div className="font-serif font-bold text-[1.5rem] leading-none text-white/80">{s.v}</div>
              <div className="font-mono text-[0.58rem] uppercase tracking-[0.08em] text-white/30 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
        {/* Avatar */}
        <div className="absolute -bottom-10 left-8 w-20 h-20 rounded-[16px] bg-[#E8390C] flex items-center justify-center font-mono text-[1.6rem] font-bold text-white border-4 border-[#F4EEE3] shadow-xl">
          {initials(admin.full_name)}
        </div>
      </div>

      {/* Name row */}
      <div className="flex items-end justify-between mb-6 au1">
        <div>
          <h2 className="font-serif font-bold text-[2rem] tracking-[-0.03em] leading-tight">{admin.full_name}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="pill pill-red">College Admin</span>
            <span className="pill pill-green">✓ Verified</span>
            <span className="text-[0.82rem] text-black/40">{admin.college_name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <BtnGhost onClick={()=>setPwdOpen(true)} small>Change Password</BtnGhost>
          <BtnRed onClick={()=>setTab("edit")} small>Edit Profile</BtnRed>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/10 mb-7 au2">
        {["overview","edit"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-5 py-3 text-[0.85rem] font-semibold border-b-2 -mb-px transition-all capitalize ${t===tab?"text-[#141414] border-[#E8390C]":"text-black/40 border-transparent hover:text-[#141414]"}`}>
            {t==="overview"?"Overview":"Edit Profile"}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab==="overview" && (
        <div className="grid grid-cols-2 gap-5 ai au3">
          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.05]"><span className="font-mono text-[0.6rem] font-bold tracking-[0.12em] uppercase text-black/40">Account Details</span></div>
            {OVERVIEW_ROWS.map((r,i)=>(
              <div key={r.l} className={`flex items-center justify-between px-5 py-3 ${i<OVERVIEW_ROWS.length-1?"border-b border-black/[0.04]":""} hover:bg-black/[0.02] transition-colors`}>
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-md bg-black/[0.04] flex items-center justify-center text-sm flex-shrink-0">{r.icon}</span>
                  <span className="text-[0.82rem] text-black/40">{r.l}</span>
                </div>
                <span className="text-[0.82rem] font-semibold">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.05]"><span className="font-mono text-[0.6rem] font-bold tracking-[0.12em] uppercase text-black/40">System IDs (Read only)</span></div>
            <div className="p-5 flex flex-col gap-3">
              {[{l:"User ID",v:admin.id},{l:"College ID",v:admin.college_id}].map(r=>(
                <div key={r.l}>
                  <label className="field-label">{r.l}</label>
                  <input className="field-input ro font-mono text-[0.72rem] mt-1" value={r.v} disabled/>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit */}
      {tab==="edit" && (
        <div className="ai au3">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.05]">
                <p className="font-serif font-bold text-[1.1rem] tracking-[-0.02em]">Personal Info</p>
                <p className="text-[0.78rem] text-black/40 mt-0.5">Your name and contact details</p>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="field-label">Full Name</label>
                  <input className="field-input" value={form.full_name} onChange={e=>set("full_name",e.target.value)} placeholder="Full name"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="field-label">Email</label>
                  <input className="field-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="field-label">Department</label>
                  <input className="field-input" value={form.branch} onChange={e=>set("branch",e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="col-span-2 bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
                <p className="font-serif font-bold text-[1.1rem] tracking-[-0.02em]">System Information</p>
                <span className="font-mono text-[0.55rem] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full bg-black/[0.05] text-black/35">Read only</span>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                {[{l:"User ID",v:admin.id.slice(0,16)+"…"},{l:"Role",v:"college_admin"},{l:"Status",v:"Active"},{l:"Verified",v:"OTP"},{l:"Last Login",v:fmtDate(admin.last_login)},{l:"Created At",v:fmtDate(admin.created_at)},{l:"Updated At",v:fmtDate(admin.updated_at)},{l:"College ID",v:admin.college_id}].map(f=>(
                  <div key={f.l} className="flex flex-col gap-1.5">
                    <label className="field-label">{f.l}</label>
                    <input className="field-input ro font-mono text-[0.72rem]" value={f.v} disabled/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save bar */}
          <div className={`save-bar flex items-center justify-between px-8 py-4 bg-[#F4EEE3]/95 backdrop-blur-md border-t border-black/10 mx-[-40px] mt-5 ${dirty?"visible":""}`}>
            <p className="text-[0.85rem] text-black/40">You have <strong className="text-[#141414]">unsaved changes</strong></p>
            <div className="flex gap-2">
              <BtnGhost onClick={discard} small>Discard</BtnGhost>
              <BtnRed onClick={save} small>Save changes</BtnRed>
            </div>
          </div>
        </div>
      )}

      {/* Password modal */}
      <Modal open={pwdOpen} onClose={()=>setPwdOpen(false)} eyebrow="Security" title="Change password">
        <div className="flex flex-col gap-3 mb-5">
          <Inp label="Current Password" type="password" placeholder="Enter current password"/>
          <Inp label="New Password" type="password" placeholder="Min 8 chars, 1 number, 1 symbol"/>
          <Inp label="Confirm New Password" type="password" placeholder="Repeat new password"/>
        </div>
        <div className="flex gap-2">
          <BtnGhost onClick={()=>setPwdOpen(false)} className="flex-1">Cancel</BtnGhost>
          <BtnRed onClick={()=>{setPwdOpen(false);onToast("Password updated","#22C55E")}} className="flex-1">Update password</BtnRed>
        </div>
      </Modal>
    </div>
  )
}

// ── ROOT COMPONENT ───────────────────────────────────────────

export default function CollegeAdminDashboard() {
  const [page,       setPage]       = useState("overview")
  const [organizers, setOrganizers] = useState(INITIAL_ORGANIZERS)
  const [faculty,    setFaculty]    = useState(INITIAL_FACULTY)
  const [students,   setStudents]   = useState(INITIAL_STUDENTS)
  const [events,     setEvents]     = useState(INITIAL_EVENTS)
  const [toast,      setToast]      = useState({ msg:"", color:"", show:false })
  const mainRef = useRef(null)

  const showToast = useCallback((msg, color="#141414") => {
    setToast({ msg, color, show:true })
    setTimeout(() => setToast(t => ({ ...t, show:false })), 2800)
  }, [])

  const navigate = id => {
    setPage(id)
    mainRef.current?.scrollTo({ top:0, behavior:"smooth" })
  }

  return (
    <div className="flex h-screen bg-[#F4EEE3] overflow-hidden">
      <Cursor />
      <Toast {...toast} />

      <Sidebar activePage={page} onNav={navigate} admin={ADMIN} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar page={page} onToast={showToast} />

        <div ref={mainRef} className="flex-1 overflow-y-auto custom-scroll">
          {page === "overview"   && <Overview   organizers={organizers} faculty={faculty} students={students} events={events} onNav={navigate}/>}
          {page === "events"     && <Events     events={events}     setEvents={setEvents}     onToast={showToast}/>}
          {page === "organizers" && <Organizers organizers={organizers} setOrganizers={setOrganizers} onToast={showToast}/>}
          {page === "faculty"    && <Faculty    faculty={faculty}    setFaculty={setFaculty}    onToast={showToast}/>}
          {page === "students"   && <Students   students={students}  setStudents={setStudents}  onToast={showToast}/>}
          {page === "profile"    && <AdminProfile admin={ADMIN}      onToast={showToast}/>}
        </div>
      </div>
    </div>
  )
}