import { createContext, useContext, useState } from 'react'
import { MANAGER_PIN } from '../lib/constants'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  function verifyPin(pin) {
    if (pin === MANAGER_PIN) {
      setIsAuthenticated(true)
      setTimeout(() => setIsAuthenticated(false), 5 * 60 * 1000)
      return true
    }
    return false
  }

  function logout() {
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, verifyPin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
