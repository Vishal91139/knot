import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LandingPage from './pages/LandingPage.jsx'
import StudentHome from './pages/StudentHome.jsx'
import LoginForm from './pages/LoginForm.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import HeroSection from './pages/HeroSection.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/home',
    element: <StudentHome />,
  },
  {
    path: '/admin-dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/hero',
    element: <HeroSection />,
  }
])


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
