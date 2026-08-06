import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PinInput from '../shared/PinInput'
import { useAuth } from '../../contexts/AuthContext'

export default function ManagerPinGate({ children }) {
  const [authorized, setAuthorized] = useState(false)
  const { checkPin } = useAuth()
  const navigate = useNavigate()

  if (authorized) return children

  return (
    <PinInput
      title="Owner / Admin Access"
      onConfirm={async (pin) => {
        const result = await checkPin(pin)
        if (result.ok && (result.user.role === 'owner' || result.user.role === 'admin')) {
          setAuthorized(true)
          return true
        }
        return false
      }}
      onCancel={() => navigate('/')}
    />
  )
}