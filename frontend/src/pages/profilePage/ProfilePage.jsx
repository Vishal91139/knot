import { useState, useEffect, useRef } from "react"
import "./profile.css"
import { useUser } from "../../context/UserContext"

// ─── MOCK USER DATA (replace with API call) ───────────────────────────────────

const BADGES = [
  { id: 1, icon: "⚡", name: "Early Bird",   desc: "Among first 10 to register",         earned: true,  date: "Jan 2025", progress: 100 },
  { id: 2, icon: "◈",  name: "Explorer",    desc: "Attended 5 or more events",           earned: true,  date: "Feb 2025", progress: 100 },
  { id: 3, icon: "⬡",  name: "Team Player", desc: "Participated in a team event",        earned: true,  date: "Jan 2025", progress: 100 },
  { id: 4, icon: "🔥", name: "Streak",      desc: "Attended 3 events in one semester",   earned: true,  date: "Mar 2025", progress: 100 },
  { id: 5, icon: "💡", name: "Innovator",   desc: "Attended a Hackathon event",          earned: true,  date: "Feb 2025", progress: 100 },
  { id: 6, icon: "🏆", name: "Champion",    desc: "Win a competitive event",             earned: false, progress: 0,    target: "Win any event" },
  { id: 7, icon: "🌐", name: "Networker",   desc: "Attend events from 3 departments",   earned: false, progress: 66,   target: "2 / 3 depts" },
  { id: 8, icon: "🎤", name: "Performer",   desc: "Perform at a cultural event",        earned: false, progress: 0,    target: "Not started" },
  { id: 9, icon: "📸", name: "Shutterbug",  desc: "Upload photos to 3 events",          earned: false, progress: 33,   target: "1 / 3 events" },
  { id:10, icon: "🤝", name: "Coordinator", desc: "Volunteer as student coordinator",   earned: false, progress: 0,    target: "Not started" },
  { id:11, icon: "🧠", name: "Scholar",     desc: "Attend 5 academic/workshop events",  earned: false, progress: 40,   target: "2 / 5 events" },
  { id:12, icon: "🥇", name: "Gold Member", desc: "Reach 1000 KNOT Points",             earned: false, progress: 32,   target: "320 / 1000 pts" },
]

const ACTIVITY = [
  { id:1, type:"registration", color:"#E8390C", action:"Registered for", subject:"InnovateFest Hackathon", detail:"CSE & IT Club · Feb 14–15 · Innovation Hub, Block C", tag:"Hackathon", time:"Today · 2:18 PM" },
  { id:2, type:"points",       color:"#6B4EFF", action:"Earned +50 KNOT Points", subject:"", detail:"Awarded for attending ML Bootcamp — Data Science Club", tag:"Points", time:"Yesterday · 5:40 PM" },
  { id:3, type:"badge",        color:"#D4840A", action:"Earned 🔥 Streak badge", subject:"", detail:"Attended 3 events in one semester — keep it up!", tag:"Badge unlocked", time:"Mar 18 · 10:00 AM" },
  { id:4, type:"registration", color:"#1B4D3E", action:"Attended", subject:"Spring Culturals 2025", detail:"Student Council · Main Auditorium · Check-in confirmed via QR", tag:"Attended ✓", time:"Mar 3 · 8:00 PM" },
  { id:5, type:"registration", color:"#6B4EFF", action:"Registered for", subject:"UX Design Sprint", detail:"Design Lab · Jan 30 · Studio A204", tag:"Workshop", time:"Jan 26 · 11:33 AM" },
  { id:6, type:"badge",        color:"#D4840A", action:"Earned 💡 Innovator badge", subject:"", detail:"Attended your first Hackathon — InnovateFest 2024", tag:"Badge unlocked", time:"Feb 16 · 9:12 AM" },
  { id:7, type:"points",       color:"#6B4EFF", action:"Earned +80 KNOT Points", subject:"", detail:"Completing InnovateFest Hackathon 2024", tag:"Points", time:"Feb 15 · 6:00 PM" },
  { id:8, type:"registration", color:"rgba(20,20,20,0.2)", action:"Account created on KNOT", subject:"", detail:"Verified via OTP · R.V. College of Engineering · CSE", tag:"Account", time:"Jan 12, 2025 · 3:45 PM" },
]

const YEARS = ["1st Year","2nd Year","3rd Year","4th Year"]
const BRANCHES = ["Computer Science & Engineering","Electronics & Communication","Mechanical Engineering","Civil Engineering","Information Science","Electrical Engineering"]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmtDate = iso => {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
}
const fmtDateTime = iso => {
  if (!iso) return "—"
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })
  return isToday ? `Today · ${time}` : `${fmtDate(iso)} · ${time}`
}
const initials = name => (name || "User").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()

// ─── SUB COMPONENTS ──────────────────────────────────────────────────────────

function Toast({ msg, color, show }) {
  return (
    <div className={`toast flex items-center gap-2 px-5 py-3 rounded-full bg-[#141414] text-[#F4EEE3] text-sm font-semibold ${show?"show":""}`}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {msg}
    </div>
  )
}

function Modal({ id, open, onClose, title, eyebrow, children }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className={`modal-overlay ${open?"open":""}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box w-full max-w-md max-h-[90vh] overflow-y-auto custom-scroll bg-[#F4EEE3] rounded-2xl">
        <div className="flex items-start justify-between px-7 pt-7 pb-0 mb-5">
          <div>
            <p className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-[#E8390C] mb-1.5">{eyebrow}</p>
            <h3 className="font-serif text-2xl font-bold tracking-[-0.025em]">{title}</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/40 text-sm hover:bg-[#141414] hover:text-[#F4EEE3] transition-all flex-shrink-0">
            ✕
          </button>
        </div>
        <div className="px-7 pb-7 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children, note, noteType="default" }) {
  const noteColor = noteType==="ok" ? "text-[#1B4D3E]" : noteType==="warn" ? "text-[#D4840A]" : "text-black/30"
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[0.55rem] font-bold tracking-[0.1em] uppercase text-black/40">{label}</label>
      {children}
      {note && <span className={`text-[0.68rem] ${noteColor}`}>{note}</span>}
    </div>
  )
}

function Input({ className="", ...props }) {
  return (
    <input
      className={`px-3.5 py-2.5 bg-[#EFE8D9] border-[1.5px] border-black/10 rounded-lg text-[0.88rem] text-[#141414] transition-all focus:outline-none focus:border-[#E8390C] focus:bg-white placeholder-black/20 ${className}`}
      {...props}
    />
  )
}

function Select({ children, className="", ...props }) {
  return (
    <select
      className={`px-3.5 py-2.5 bg-[#EFE8D9] border-[1.5px] border-black/10 rounded-lg text-[0.88rem] text-[#141414] appearance-none transition-all focus:outline-none focus:border-[#E8390C] ${className}`}
      {...props}>
      {children}
    </select>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function OverviewTab({ user }) {
  return (
    <div className="animate-fade-in">
      {/* Points hero */}
      <div className="points-card-bg rounded-2xl p-7 mb-4 flex items-center justify-between gap-6">
        <div className="points-card-grid rounded-2xl" />
        <div className="relative z-10 flex-1">
          <p className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-[#F4EEE3]/35 mb-2">KNOT Points</p>
          <div className="points-num">{user.points}</div>
          <p className="text-[0.82rem] text-[#F4EEE3]/40 mt-1.5">
            Next reward at 500 points → <strong className="text-[#F4EEE3]/80">Silver badge</strong>
          </p>
          <div className="mt-4 max-w-sm">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(100,(user.points/500)*100)}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 font-mono text-[0.55rem] text-[#F4EEE3]/25">
              <span>Bronze · 0</span><span>Silver · 500</span><span>Gold · 1000</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-right flex-shrink-0">
          <div className="rank-num">#42</div>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.08em] text-[#F4EEE3]/30 mt-1">College Rank</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-0 bg-white border border-black/10 rounded-2xl overflow-hidden mb-4">
        {[
          { val:3,     label:"Registered",  color:"#E8390C" },
          { val:8,     label:"Attended",    color:"#1B4D3E" },
          { val:2,     label:"Teams led",   color:"#6B4EFF" },
          { val:BADGES.filter(b=>b.earned).length, label:"Badges", color:"#141414" },
        ].map((s,i) => (
          <div key={s.label} className={`py-6 text-center ${i<3?"border-r border-black/[0.06]":""} hover:bg-[#EFE8D9] transition-colors`}>
            <div className="font-serif font-bold text-[2.2rem] leading-none letter-spacing-[-0.04em] mb-1" style={{ color:s.color }}>
              {s.val}
            </div>
            <div className="text-[0.7rem] text-black/40 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Account info */}
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05]">
            <span className="font-mono text-[0.6rem] font-bold tracking-[0.12em] uppercase text-black/40">Account Info</span>
          </div>
          {[
            { icon:"👤", label:"Full Name",      val: user.full_name },
            { icon:"📧", label:"Email",          val: user.email, mono:true },
            { icon:"🎓", label:"College Email",   val: user.college_email||"—", mono:true },
            { icon:"🏛️", label:"College",         val: user.college_name },
            { icon:"🔑", label:"Roll Number",    val: user.roll_number||"—", mono:true },
            { icon:"🧬", label:"Branch",         val: user.branch||"—" },
            { icon:"📅", label:"Year of Study",  val: user.year_of_study ? YEARS[user.year_of_study-1] : "—" },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-md bg-black/[0.04] flex items-center justify-center text-sm flex-shrink-0">{row.icon}</span>
                <span className="text-[0.82rem] text-black/40">{row.label}</span>
              </div>
              <span className={`text-[0.82rem] font-semibold ${row.mono?"font-mono text-[0.72rem]":""}`}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Account status */}
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05]">
            <span className="font-mono text-[0.6rem] font-bold tracking-[0.12em] uppercase text-black/40">Account Status</span>
          </div>
          {[
            { icon:"🛡️", label:"Role",                val: <span className="text-[0.62rem] font-mono font-bold px-2.5 py-1 rounded-full bg-[#6B4EFF]/10 text-[#6B4EFF] uppercase tracking-wide">{user.role}</span> },
            { icon:"✅", label:"Verified",            val: user.is_verified
              ? <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-[#16A34A] bg-green-50 px-2.5 py-1 rounded-full">✓ Verified</span>
              : <span className="text-[0.7rem] font-semibold text-[#E8390C] bg-red-50 px-2.5 py-1 rounded-full">✗ Unverified</span> },
            { icon:"🔍", label:"Verification Method", val: user.verification_method||"—" },
            { icon:"🟢", label:"Account Status",      val: <span className="text-[0.7rem] font-semibold text-[#16A34A] bg-green-50 px-2.5 py-1 rounded-full">Active</span> },
            { icon:"🕐", label:"Last Login",          val: fmtDateTime(user.last_login), mono:true },
            { icon:"📆", label:"Member Since",        val: fmtDate(user.created_at), mono:true },
            { icon:"🔄", label:"Last Updated",        val: fmtDate(user.updated_at), mono:true },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-md bg-black/[0.04] flex items-center justify-center text-sm flex-shrink-0">{row.icon}</span>
                <span className="text-[0.82rem] text-black/40">{row.label}</span>
              </div>
              <span className={`text-[0.82rem] font-semibold ${row.mono?"font-mono text-[0.72rem] text-black/40":""}`}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditTab({ user, onChange, onToast }) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    email: user.email,
    college_email: user.college_email || "",
    roll_number: user.roll_number || "",
    branch: user.branch || BRANCHES[0],
    year_of_study: user.year_of_study || 1,
    cur_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [dirty, setDirty] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]:v })); setDirty(true); onChange(true) }

  const save = () => {
    onChange(false)
    setDirty(false)
    onToast("Profile updated successfully", "#22C55E")
  }
  const discard = () => {
    setForm({
      full_name: user.full_name, email: user.email,
      college_email: user.college_email||"", roll_number: user.roll_number||"",
      branch: user.branch||BRANCHES[0], year_of_study: user.year_of_study||1,
      cur_password:"", new_password:"", confirm_password:"",
    })
    setDirty(false)
    onChange(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 gap-4">

        {/* Avatar section */}
        <div className="col-span-2 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.05]">
            <p className="font-serif font-bold text-[1.1rem] tracking-[-0.02em]">Profile Photo</p>
            <p className="text-[0.78rem] text-black/40 mt-0.5">Shown on your tickets, events, and leaderboard</p>
          </div>
          <div className="flex items-center gap-5 px-6 py-5">
            <div className="w-[72px] h-[72px] rounded-xl bg-[#E8390C] flex items-center justify-center font-mono text-xl font-bold text-white flex-shrink-0 overflow-hidden border-2 border-black/10">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover"/>
                : initials(form.full_name)
              }
            </div>
            <div>
              <p className="text-[0.88rem] font-semibold mb-0.5">Upload a profile photo</p>
              <p className="text-[0.75rem] text-black/40">JPG, PNG or WebP · Max 2MB · Square works best</p>
              <div className="flex gap-2 mt-2.5">
                <button className="px-4 py-2 rounded-full bg-[#141414] text-[#F4EEE3] text-[0.75rem] font-bold hover:bg-[#E8390C] transition-colors">
                  Upload photo
                </button>
                <button className="px-4 py-2 rounded-full border border-black/20 text-[0.75rem] font-semibold text-black/40 hover:border-[#E8390C] hover:text-[#E8390C] transition-all">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.05]">
            <p className="font-serif font-bold text-[1.1rem] tracking-[-0.02em]">Personal Info</p>
            <p className="text-[0.78rem] text-black/40 mt-0.5">Your name and contact details</p>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <Field label="Full Name">
              <Input value={form.full_name} onChange={e=>set("full_name",e.target.value)} placeholder="Full name"/>
            </Field>
            <Field label="Personal Email" note={user.is_verified ? "✓ Email verified" : "Not verified — check inbox"} noteType={user.is_verified?"ok":"warn"}>
              <div className="relative">
                <Input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@gmail.com" className="pr-10 w-full"/>
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] ${user.is_verified?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>
                  {user.is_verified ? "✓" : "✗"}
                </span>
              </div>
            </Field>
            <Field label="College Email" note="Used for college-scoped event access">
              <div className="relative">
                <Input type="email" value={form.college_email} onChange={e=>set("college_email",e.target.value)} placeholder="you@college.edu.in" className="pr-10 w-full"/>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] bg-green-100 text-green-700">✓</span>
              </div>
            </Field>
          </div>
        </div>

        {/* Academic info */}
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.05]">
            <p className="font-serif font-bold text-[1.1rem] tracking-[-0.02em]">Academic Details</p>
            <p className="text-[0.78rem] text-black/40 mt-0.5">Department and study information</p>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <Field label="College" note="Contact your College Admin to change">
              <Input className="field-readonly" value={user.college_name} disabled/>
            </Field>
            <Field label="Roll Number / USN">
              <Input value={form.roll_number} onChange={e=>set("roll_number",e.target.value)} placeholder="e.g. 1RV21CS045"/>
            </Field>
            <Field label="Branch / Department">
              <Select value={form.branch} onChange={e=>set("branch",e.target.value)}>
                {BRANCHES.map(b => <option key={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="Year of Study">
              <Select value={form.year_of_study} onChange={e=>set("year_of_study",Number(e.target.value))}>
                {[1,2,3,4].map(y => <option key={y} value={y}>{YEARS[y-1]}</option>)}
              </Select>
            </Field>
          </div>
        </div>

        {/* System / read-only */}
        <div className="col-span-2 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]">
            <div>
              <p className="font-serif font-bold text-[1.1rem] tracking-[-0.02em]">System Information</p>
              <p className="text-[0.78rem] text-black/40 mt-0.5">Managed by the platform — cannot be edited</p>
            </div>
            <span className="font-mono text-[0.55rem] font-bold tracking-[0.08em] uppercase px-3 py-1 rounded-full bg-black/[0.05] text-black/40">Read only</span>
          </div>
          <div className="p-6 grid grid-cols-4 gap-4">
            {[
              { label:"User ID",             val: user.id.slice(0,18)+"…" },
              { label:"Role",                val: user.role },
              { label:"Account Status",      val: user.is_active ? "Active" : "Inactive" },
              { label:"Verification Method", val: user.verification_method||"—" },
              { label:"Points",              val: String(user.points) },
              { label:"Last Login",          val: fmtDateTime(user.last_login) },
              { label:"Created At",          val: fmtDate(user.created_at) },
              { label:"Last Updated",        val: fmtDate(user.updated_at) },
            ].map(f => (
              <Field key={f.label} label={f.label}>
                <Input className="field-readonly text-[0.75rem]" value={f.val} disabled/>
              </Field>
            ))}
          </div>
        </div>

        {/* Password */}
        <div className="col-span-2 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.05]">
            <p className="font-serif font-bold text-[1.1rem] tracking-[-0.02em]">Password & Security</p>
            <p className="text-[0.78rem] text-black/40 mt-0.5">Keep your account secure with a strong password</p>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            <Field label="Current Password">
              <Input type="password" value={form.cur_password} onChange={e=>set("cur_password",e.target.value)} placeholder="Enter current password"/>
            </Field>
            <Field label="New Password">
              <Input type="password" value={form.new_password} onChange={e=>set("new_password",e.target.value)} placeholder="Min 8 chars"/>
            </Field>
            <Field label="Confirm New Password" note="At least 8 characters with a number and symbol">
              <Input type="password" value={form.confirm_password} onChange={e=>set("confirm_password",e.target.value)} placeholder="Repeat new password"/>
            </Field>
          </div>
        </div>

        {/* Danger zone */}
        <div className="col-span-2 rounded-2xl border border-[#E8390C]/20 p-6">
          <p className="text-[0.9rem] font-bold text-[#E8390C] mb-2">Danger Zone</p>
          <p className="text-[0.82rem] text-black/40 leading-relaxed mb-4">
            Deactivating your account removes you from all registered events and cancels pending registrations.
            Your data is retained for 30 days before permanent deletion. This is reversible by contacting support within that window.
          </p>
          <button className="px-5 py-2.5 rounded-full border border-[#E8390C]/30 text-[#E8390C] text-[0.82rem] font-bold hover:bg-[#E8390C]/[0.06] hover:border-[#E8390C] transition-all">
            Deactivate account
          </button>
        </div>

      </div>

      {/* Save bar */}
      <div className={`save-bar flex items-center justify-between px-10 py-4 bg-[#F4EEE3]/95 backdrop-blur-md border-t border-black/10 mx-[-40px] mb-[-60px] ${dirty?"visible":""}`}>
        <p className="text-[0.85rem] text-black/40">You have <strong className="text-[#141414]">unsaved changes</strong></p>
        <div className="flex gap-2">
          <button onClick={discard} className="px-5 py-2 rounded-full border border-black/20 text-[0.82rem] font-semibold text-black/40 hover:border-[#141414] hover:text-[#141414] transition-all">
            Discard
          </button>
          <button onClick={save} className="px-6 py-2 rounded-full bg-[#E8390C] text-white text-[0.82rem] font-bold hover:bg-[#c42d08] hover:shadow-[0_6px_16px_rgba(232,57,12,0.3)] hover:-translate-y-px transition-all">
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

function BadgesTab({ user }) {
  const earned  = BADGES.filter(b => b.earned)
  const locked  = BADGES.filter(b => !b.earned)

  return (
    <div className="animate-fade-in">
      {/* Points hero */}
      <div className="points-card-bg rounded-2xl p-7 mb-7 flex items-center justify-between gap-6">
        <div className="points-card-grid rounded-2xl" />
        <div className="relative z-10 flex-1">
          <p className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-[#F4EEE3]/35 mb-2">Your KNOT Points</p>
          <div className="points-num">{user.points}</div>
          <p className="text-[0.82rem] text-[#F4EEE3]/40 mt-1.5">64% to Silver — attend 2 more events to unlock</p>
          <div className="mt-4 max-w-sm">
            <div className="progress-track">
              <div className="progress-fill" style={{ width:`${(user.points/500)*100}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 font-mono text-[0.55rem] text-[#F4EEE3]/25">
              <span>Bronze · 0</span><span>Silver · 500</span><span>Gold · 1000</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-right flex-shrink-0">
          <div className="rank-num">#42</div>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.08em] text-[#F4EEE3]/30 mt-1">College Rank</p>
        </div>
      </div>

      <p className="font-mono text-[0.6rem] font-bold tracking-[0.12em] uppercase text-black/40 mb-3">
        Earned · {earned.length} badge{earned.length!==1?"s":""}
      </p>
      <div className="grid grid-cols-4 gap-3 mb-7">
        {earned.map(b => (
          <div key={b.id} className="bg-white border border-black/10 rounded-2xl px-4 py-6 text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background:"radial-gradient(circle at 50% 0%,rgba(232,57,12,0.04),transparent 60%)" }} />
            <div className="text-[2.2rem] mb-2.5 relative z-10">{b.icon}</div>
            <div className="text-[0.88rem] font-bold mb-1 relative z-10">{b.name}</div>
            <div className="text-[0.72rem] text-black/40 leading-snug mb-3 relative z-10">{b.desc}</div>
            <span className="inline-flex items-center gap-1 font-mono text-[0.55rem] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full bg-[#E8390C]/10 text-[#E8390C] relative z-10">
              Earned · {b.date}
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono text-[0.6rem] font-bold tracking-[0.12em] uppercase text-black/40 mb-3">
        Locked · {locked.length} badge{locked.length!==1?"s":""}
      </p>
      <div className="grid grid-cols-4 gap-3">
        {locked.map(b => (
          <div key={b.id} className="bg-white border border-black/10 rounded-2xl px-4 py-6 text-center opacity-50 hover:opacity-70 transition-opacity">
            <div className="text-[2.2rem] mb-2.5 grayscale">{b.icon}</div>
            <div className="text-[0.88rem] font-bold mb-1 text-black/40">{b.name}</div>
            <div className="text-[0.72rem] text-black/25 leading-snug mb-3">{b.desc}</div>
            {b.progress > 0 && (
              <div className="badge-progress-track mb-2 mx-2">
                <div className="badge-progress-fill" style={{ width:`${b.progress}%` }} />
              </div>
            )}
            <span className="inline-flex items-center gap-1 font-mono text-[0.55rem] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full bg-black/[0.05] text-black/30">
              {b.target}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityTab() {
  const [filter, setFilter] = useState("all")
  const filters = ["all","registration","points","badge"]
  const visible = filter==="all" ? ACTIVITY : ACTIVITY.filter(a => a.type===filter)

  const tagColor = type => {
    if (type==="registration") return "bg-[#E8390C]/[0.07] text-[#E8390C]"
    if (type==="points")       return "bg-[#6B4EFF]/[0.07] text-[#6B4EFF]"
    if (type==="badge")        return "bg-[#D4840A]/10 text-[#D4840A]"
    return "bg-black/[0.05] text-black/40"
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="display-lg">
          Recent <em className="font-light italic text-black/40">activity.</em>
        </h2>
        <div className="flex gap-1.5">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-[0.75rem] font-semibold border transition-all capitalize ${
                filter===f
                  ? "bg-[#141414] text-[#F4EEE3] border-[#141414]"
                  : "border-black/20 text-black/40 hover:border-[#141414] hover:text-[#141414]"
              }`}>
              {f==="all"?"All":f==="registration"?"Events":f==="badge"?"Badges":"Points"}
            </button>
          ))}
        </div>
      </div>

      <div className="timeline">
        {visible.map((item, i) => (
          <div key={item.id} className="tl-item relative" style={{ animation:`fadeUp .4s ${i*.07}s cubic-bezier(0.16,1,0.3,1) both`, opacity:0 }}>
            <div className="tl-dot" style={{ background:item.color }} />
            <div className="bg-white border border-black/10 rounded-xl p-4 mb-3 hover:border-black/20 hover:translate-x-1 transition-all">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-[0.85rem] font-semibold leading-snug">
                  {item.action}
                  {item.subject && <strong> {item.subject}</strong>}
                </p>
                <span className="font-mono text-[0.6rem] text-black/30 ml-3 flex-shrink-0 pt-0.5">{item.time}</span>
              </div>
              <p className="text-[0.8rem] text-black/40 leading-relaxed mb-2">{item.detail}</p>
              <span className={`inline-block font-mono text-[0.58rem] font-bold tracking-[0.06em] uppercase px-2 py-1 rounded-md ${tagColor(item.type)}`}>
                {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [tab, setTab]       = useState("overview")
  const [isDirty, setDirty] = useState(false)
  const [toast, setToast]   = useState({ msg:"", color:"", show:false })
  const [pwdModal, setPwdModal] = useState(false)
  const mainRef = useRef(null)
  
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-full bg-[#F4EEE3] flex items-center justify-center p-8">
        <p className="text-sm text-black/40">Loading profile…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#F4EEE3] flex items-center justify-center p-8">
        <p className="text-sm text-black/40">Please log in to view your profile.</p>
      </div>
    )
  }

  const showToast = (msg, color) => {
    setToast({ msg, color, show:true })
    setTimeout(() => setToast(t => ({ ...t, show:false })), 2800)
  }

  const switchTab = t => {
    if (isDirty) { showToast("Save or discard your changes first", "#D4840A"); return }
    setTab(t)
    mainRef.current?.scrollTo({ top:0, behavior:"smooth" })
  }

  const TABS = [
    { id:"overview",  label:"Overview"       },
    { id:"edit",      label:"Edit Profile"   },
    { id:"badges",    label:"Badges & Points"},
    { id:"activity",  label:"Activity"       },
  ]

  return (
    <div className="flex h-screen bg-[#F4EEE3] overflow-hidden selection-red">
      <Toast {...toast} />

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-10 h-[58px] bg-[#F4EEE3]/93 backdrop-blur-md border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setPwdModal(true)}
              className="px-4 py-2 rounded-full border border-black/20 text-[0.8rem] font-semibold text-black/40 hover:border-[#141414] hover:text-[#141414] transition-all">
              Change Password
            </button>
            <button onClick={() => switchTab("edit")}
              className="px-5 py-2 rounded-full bg-[#E8390C] text-white text-[0.8rem] font-bold hover:bg-[#c42d08] hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(232,57,12,0.3)] transition-all">
              Edit Profile
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div ref={mainRef} className="flex-1 overflow-y-auto custom-scroll">

          {/* Cover */}
          <div className="cover-bg h-[210px] mx-0 relative">
            <div className="cover-grid-pattern" />
            <div className="cover-diagonal" />
            <div className="cover-watermark">{user.full_name?.split(" ")[0] || "Profile"}</div>
            <button onClick={() => switchTab("edit")}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/60 text-[0.75rem] font-semibold hover:bg-white/18 hover:text-white/90 transition-all backdrop-blur-sm">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
              Edit cover
            </button>
            {/* Cover stats */}
            <div className="absolute bottom-5 right-8 flex gap-5">
              {[
                { val:user.points, label:"Points" },
                { val:8,           label:"Events" },
                { val:"#42",       label:"Rank"   },
              ].map(s => (
                <div key={s.label} className="text-right">
                  <div className="font-serif font-bold text-[1.8rem] leading-none text-white/90">{s.val}</div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-white/35 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-10 pb-16">
            {/* Avatar row */}
            <div className="flex items-end justify-between mt-[-48px] mb-6 relative z-10 animate-fade-up">
              <div className="flex items-end gap-0">
                <div className="avatar-wrap relative">
                  <div className="w-24 h-24 rounded-[18px] bg-[#E8390C] flex items-center justify-center font-mono text-[1.8rem] font-bold text-white border-4 border-[#F4EEE3] avatar-ring overflow-hidden">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover"/>
                      : <span>{initials(user?.full_name)}</span>
                    }
                    <div className="avatar-overlay cursor-none">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 13V7M7 10l3-3 3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="2" width="16" height="16" rx="3" stroke="#fff" strokeWidth="1.5"/></svg>
                      <span className="text-white text-[0.6rem] font-semibold mt-0.5">Change photo</span>
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-[2.5px] border-[#F4EEE3]" />
                </div>
                <div className="ml-4 mb-1.5">
                  <h1 className="font-serif font-bold tracking-[-0.03em] text-[2rem] leading-tight">{user?.full_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full bg-[#6B4EFF]/12 text-[#6B4EFF]">{user.role}</span>
                    {user.is_verified
                      ? <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">✓ Verified</span>
                      : <span className="text-[0.7rem] font-semibold text-[#E8390C] bg-red-50 px-2.5 py-1 rounded-full">✗ Unverified</span>
                    }
                  </div>
                  <p className="text-[0.82rem] text-black/40 mt-1">{user.college_name}, Bengaluru</p>
                </div>
              </div>
              <div className="flex gap-2 mb-1.5">
                <button onClick={() => switchTab("badges")} className="px-4 py-2 rounded-full border border-black/20 text-[0.8rem] font-semibold text-black/40 hover:border-[#141414] hover:text-[#141414] transition-all">🏅 Badges</button>
                <button onClick={() => switchTab("activity")} className="px-4 py-2 rounded-full border border-black/20 text-[0.8rem] font-semibold text-black/40 hover:border-[#141414] hover:text-[#141414] transition-all">📋 Activity</button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-black/10 mb-8 animate-fade-up-1">
              {TABS.map(t => (
                <button key={t.id} onClick={() => switchTab(t.id)}
                  className={`px-5 py-3 text-[0.85rem] font-semibold border-b-2 -mb-px transition-all whitespace-nowrap ${
                    tab===t.id
                      ? "text-[#141414] border-[#E8390C]"
                      : "text-black/40 border-transparent hover:text-[#141414]"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="animate-fade-up-2">
              {tab === "overview"  && <OverviewTab user={user} />}
              {tab === "edit"      && <EditTab user={user} onChange={setDirty} onToast={showToast} />}
              {tab === "badges"    && <BadgesTab user={user} />}
              {tab === "activity"  && <ActivityTab />}
            </div>
          </div>
        </div>
      </div>

      {/* Password modal */}
      <Modal open={pwdModal} onClose={() => setPwdModal(false)} eyebrow="Security" title="Change password">
        <Field label="Current password">
          <Input type="password" placeholder="Enter current password"/>
        </Field>
        <Field label="New password">
          <Input type="password" placeholder="Min 8 chars, 1 number, 1 symbol"/>
        </Field>
        <Field label="Confirm new password">
          <Input type="password" placeholder="Repeat new password"/>
        </Field>
        <button onClick={() => { setPwdModal(false); showToast("Password updated successfully","#22C55E") }}
          className="w-full py-3.5 rounded-full bg-[#141414] text-[#F4EEE3] text-[0.88rem] font-bold hover:bg-[#E8390C] hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(232,57,12,0.25)] transition-all mt-1">
          Update password
        </button>
      </Modal>
    </div>
  )
}