import { Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'
import CreateEventForm from '../pages/organizer/CreateEventFrom.jsx'

function dashboardPathForRole(role) {
  switch (role) {
    case 'student':
    case 'faculty':
      return '/dashboard/student'
    case 'organizer':
      return '/dashboard/organizer'
    case 'college_admin':
      return '/dashboard/college-admin'
    case 'super_admin':
      return '/dashboard/admin'
    default:
      return '/login'
  }
}

export function DashboardIndex() {
  const { user, loading } = useUser()

  if (loading) return null
  if (!user?.role) return <Navigate to="/login" replace />
  return <Navigate to={dashboardPathForRole(user.role)} replace />
}

export function CreateEventRoute() {
  const navigate = useNavigate()
  return (
    <CreateEventForm
      onSuccess={() => navigate('/dashboard/organizer/events')}
      onCancel={() => navigate('/dashboard/organizer/events')}
    />
  )
}
