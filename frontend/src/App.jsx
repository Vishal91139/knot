import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import Topbar from './components/navBar/Topbar'
import Sidebar from './components/navBar/Sidebar'
import { useUser } from './context/UserContext.jsx'

function roleKey(role) {
  const normalized = String(role || '').toLowerCase()
  if (normalized === 'super_admin' || normalized === 'college_admin') return 'admin'
  if (normalized === 'organizer' || normalized === 'faculty') return 'organizer'
  if (normalized === 'student') return 'student'
  return null
}

function activePageFromPath(pathname) {
  if (pathname === '/profile') return 'profile'

  if (pathname.startsWith('/dashboard/organizer')) {
    const parts = pathname.split('/').filter(Boolean)
    return parts[2] || 'overview' // /dashboard/organizer/:section
  }

  return 'overview'
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useUser()
  const currentRoleKey = roleKey(user?.role)

  if (loading) {
    return null
  }

  if (!currentRoleKey) {
    return <Navigate to="/login" replace />
  }

  const activePage = activePageFromPath(location.pathname)

  const handleNav = page => {
    if (page === 'profile') {
      navigate('/profile')
      return
    }

    if (currentRoleKey === 'organizer') {
      navigate(`/dashboard/organizer/${page || 'overview'}`)
      return
    }

    if (currentRoleKey === 'admin') {
      navigate('/dashboard/admin')
      return
    }

    navigate('/dashboard/student')
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0B1222] flex">
      <Sidebar activePage={activePage} onNav={handleNav} />
      <div className="flex-1 min-w-0 h-screen overflow-hidden flex flex-col">
        <Topbar page={activePage} />
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#080D18]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default App
