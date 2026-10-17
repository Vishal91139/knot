import { createContext, useContext, useEffect, useState } from "react"

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
    } finally {
      setUser(null)
    }
  }

  useEffect(() => {
    let alive = true

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        const payload = await response.json().catch(() => null)

        if (!alive) return

        if (!response.ok) {
          setUser(null)
          return
        }

        setUser(payload?.data || null)
      } catch {
        if (alive) setUser(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    fetchCurrentUser()

    return () => {
      alive = false
    }
  }, [])

  return <UserContext.Provider value={{ user, loading, setUser, logout }}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext) || { user: null, loading: false, setUser: () => {}, logout: async () => {} }
}