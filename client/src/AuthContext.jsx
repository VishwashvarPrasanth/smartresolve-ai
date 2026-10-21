import { createContext, useContext, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export const homePath = (user) => {
  if (user.role === 'admin') return '/admin/routing'
  if (user.role === 'staff') return '/queue'
  return '/my-issues'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })

  const save = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    save(data)
    return data.user
  }

  const register = async (name, email, password) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    })
    save(data)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}