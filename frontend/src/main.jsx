import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProfilePage from './pages/profilePage/ProfilePage.jsx'
import CollegeAdminDashboard from './pages/collegeAdminDashboard.jsx'
import OrganizerDashboard from './pages/organizer/OrganizerDashboard.jsx'
import StudentDashboard from './pages/studentDashboard/StudentDashboard.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { CreateEventRoute, DashboardIndex } from './routes/routeComponents.jsx'
import EventPage from './pages/EventPage.jsx'
import KnotAuth from './pages/AuthPage/KnotAuth.jsx'


const router = createBrowserRouter([
  {
    path: '',
    element: <LandingPage />
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'dashboard/student',
        element: <StudentDashboard />
      },
      {
        path: 'event/:eventId',
        element: <EventPage />
      },
      {
        path: 'dashboard/organizer',
        element: <Navigate to="/dashboard/organizer/overview" replace />,
      },
      {
        path: 'dashboard/organizer/:section',
        element: <OrganizerDashboard />,
      },
      {
        path: 'profile',
        element: <ProfilePage />
      },
      {
        path: 'dashboard',
        element: <DashboardIndex />
      },
      {
        path: 'home',
        element: <Navigate to="/dashboard/student" replace />
      }
    ]
  },
  {
    path:'/login',
    element: <KnotAuth />
  },
  {
    path:'/signup',
    element: <KnotAuth initialMode="signup" />
  },
  {
    path: '/dashboard/admin',
    element: <AdminDashboard />,
  },
  {
    path: '/admin-dashboard',
    element: <Navigate to="/dashboard/admin" replace />,
  },
  {
    path: '/dashboard/college-admin',
    element: <CollegeAdminDashboard />,
  },
  {
    path: '/college-Admin',
    element: <Navigate to="/dashboard/college-admin" replace />,
  },
  {
    path: '/organizer',
    element: <Navigate to="/dashboard/organizer/overview" replace />,
  },
  {
    path: '/organizer-eventform',
    element: <CreateEventRoute />,
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  </StrictMode>,
)
