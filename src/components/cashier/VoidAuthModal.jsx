import PinInput from '../shared/PinInput'
import { useAuth } from '../../contexts/AuthContext'

export default function VoidAuthModal({ onSuccess, onCancel }) {
  const { checkPin } = useAuth()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-2xl p-6 w-80 border border-[#334155]">
        <PinInput
          title="Owner PIN Required"
          onConfirm={async (pin) => {
            const result = await checkPin(pin)
            if (result.ok && result.user.role === 'owner') {
              onSuccess()
              return true
            }
            return false
          }}
          onCancel={onCancel}
        />
      </div>
    </div>
  )
}
