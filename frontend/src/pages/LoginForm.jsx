import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LoginForm = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Please enter email and password')
      return
    }

    try {
      setError('')
      setIsSubmitting(true)
      console.log("chala")
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password
        })
      })

      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok || !payload?.data) {
        setError(payload?.message || 'Login failed. Please check your credentials.')
        return
      }

      const role = payload?.data?.user?.role

      if (role === 'student' || role === 'faculty') {
        navigate('/home', { replace: true })
        return
      }

      if (role === 'super_admin') {
        navigate('/admin-dashboard', { replace: true })
        return
      }

      setError('Your account role is not allowed to login here.')
    } catch {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
            <div
                style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                className="bg-gray-800 rounded-lg shadow-xl overflow-hidden"
            >
                <div className="p-8">
                    <h2 className="text-center text-3xl font-extrabold text-white">
                        Welcome Back
                    </h2>
                    <p className="mt-4 text-center text-gray-400">Sign in to continue</p>
                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        <div className="rounded-md shadow-sm">
                            <div>
                                <label className="sr-only" htmlFor="email">Email address</label>
                                <input
                                    placeholder="Email address"
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    required=""
                                    autoComplete="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {setEmail(e.target.value)}}
                                />
                            </div>
                            <div className="mt-4">
                                <label className="sr-only" htmlFor="password">Password</label>
                                <input
                                    placeholder="Password"
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    required=""
                                    autoComplete="current-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => {setPassword(e.target.value)}}
                                />
                            </div>
                            {error && (
                              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {error}
                              </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center">
                                <input
                                    className="h-4 w-4 text-indigo-500 focus:ring-indigo-400 border-gray-600 rounded"
                                    type="checkbox"
                                    name="remember-me"
                                />
                                <label className="ml-2 block text-sm text-gray-400" htmlFor="remember-me">Remember me</label>
                            </div>

                            <div className="text-sm">
                                <a className="font-medium text-indigo-500 hover:text-indigo-400" href="#"> Forgot your password?</a>
                            </div>
                        </div>

                        <div>
                            <button
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                type="submit"
                                disabled={isSubmitting}
                                >
                                {isSubmitting ? 'Signing in...' : 'Login'}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="px-8 py-4 bg-gray-700 text-center">
                    <span className="text-gray-400">Don't have an account?</span>
                    <a className="font-medium text-indigo-500 hover:text-indigo-400" href="#">Sign up</a>
                </div>
            </div>
        </div>
    </div>
  )
}

export default LoginForm