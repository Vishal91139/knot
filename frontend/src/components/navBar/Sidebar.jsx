import { useUser } from "../../context/UserContext.jsx"

const NAV_SETS = {
  admin: {
    title: "Admin Panel",
    items: [
      { section: "Main" },
      { id: "overview", icon: "◈", label: "Overview" },
      { id: "events", icon: "📅", label: "Events" },
      { section: "People" },
      { id: "organizers", icon: "⬡", label: "Organizers" },
      { id: "faculty", icon: "📋", label: "Faculty" },
      { id: "students", icon: "🎓", label: "Students" },
      { section: "Account" },
      { id: "profile", icon: "◎", label: "My Profile" },
    ],
  },
  organizer: {
    title: "Organizer",
    items: [
      { section: "Main" },
      { id: "overview", icon: "◈", label: "Overview" },
      { id: "events", icon: "📅", label: "My Events" },
      { id: "coordinators", icon: "⬡", label: "Coordinators" },
      { section: "Account" },
      { id: "profile", icon: "◎", label: "My Profile" },
    ],
  },
  student: {
    title: "Student Space",
    items: [
      { section: "Main" },
      { id: "overview", icon: "◈", label: "Overview" },
      { section: "Account" },
      { id: "profile", icon: "◎", label: "My Profile" },
    ],
  },
}

// Helper
const initials = n => (n || "User").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()

const getRoleKey = role => {
  const normalized = (role || "").toLowerCase()
  if (normalized === "super_admin" || normalized === "college_admin") return "admin"
  if (normalized === "organizer") return "organizer"
  if (normalized === "student" || normalized === "faculty") return "student"
  return "student"
}

export default function Sidebar({ activePage, onNav, user, admin, organizer, eventCount, pendingCount }) {
  const { user: contextUser } = useUser()
  const resolvedUser = contextUser || user || admin || organizer || {}
  const roleKey = getRoleKey(resolvedUser.role)
  const navConfig = NAV_SETS[roleKey] || NAV_SETS.admin
  const handleNav = onNav || (() => {})

  const navItems = navConfig.items.map(item => {
    if (roleKey === "organizer" && item.id === "events") {
      return { ...item, badge: eventCount || undefined }
    }

    if (roleKey === "organizer" && item.id === "coordinators") {
      return { ...item, badge: pendingCount || undefined }
    }

    return item
  })

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[#141414] text-[#F4EEE3] flex flex-col h-screen">
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
          <div className="font-mono text-[0.5rem] text-white/25 tracking-[0.06em] uppercase">{navConfig.title}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto custom-scroll">
        {navItems.map((item, i) =>
          item.section ? (
            <p key={i} className="font-mono text-[0.5rem] font-bold tracking-[0.14em] uppercase text-white/20 px-3 pt-4 pb-1.5">{item.section}</p>
          ) : (
            <button key={item.id} onClick={() => handleNav(item.id)}
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
        <button onClick={() => handleNav("profile")}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition-colors w-full text-left">
          <div className="w-8 h-8 rounded-full bg-[#E8390C] flex items-center justify-center font-mono text-[0.62rem] font-bold text-white flex-shrink-0 relative">
            {initials(resolvedUser.full_name)}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#141414]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.82rem] font-semibold text-white/75 leading-tight truncate">{resolvedUser.full_name || "Guest"}</p>
            <p className="text-[0.66rem] text-white/28">{resolvedUser.role || ""}</p>
          </div>
        </button>
      </div>
    </aside>
  )
}