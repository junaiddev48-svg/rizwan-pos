import { useState, useEffect } from 'react'
import { UtensilsCrossed, Delete } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const KEYS = [['1','2','3'],['4','5','6'],['7','8','9'],['C','0','']]

export default function LoginScreen() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const { login, authLoading } = useAuth()

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key >= '0' && e.key <= '9' && pin.length < 4) {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pin])

  async function handleDigit(d) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError('')
    if (next.length === 4) {
      setPin('')
      const result = await login(next)
      if (!result.ok) setError(result.error || 'Invalid PIN')
    }
  }

  function handleBackspace() {
    setError('')
    setPin((p) => p.slice(0, -1))
  }

  function handleClear() {
    setPin('')
    setError('')
  }

  return (
    <div className="h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <UtensilsCrossed className="text-[#22C55E] mx-auto mb-3" size={48} />
        <h1 className="text-2xl font-black tracking-wide">RIZWAN</h1>
        <p className="text-slate-500 text-sm mt-1">Fast Food POS System</p>
      </div>

      <div className="bg-[#1E293B] rounded-2xl p-6 w-80 border border-[#334155]">
        <h3 className="text-lg font-bold text-center mb-4">Enter PIN to unlock</h3>

        <div className="flex justify-center gap-3 mb-4">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition ${
              pin[i] ? 'bg-[#22C55E] border-[#22C55E]' : 'border-slate-500'
            }`} />
          ))}
        </div>

        {error && (
          <p className="text-center text-[#EF4444] text-sm mb-3">{error}</p>
        )}
        {authLoading && (
          <p className="text-center text-[#F59E0B] text-sm mb-3">Verifying...</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {KEYS.flat().map((k, i) => {
            if (k === 'C') return (
              <button key={i} onClick={handleClear} className="bg-[#EF4444] text-white rounded-xl py-4 text-xl font-bold active:scale-95 transition cursor-pointer">
                C
              </button>
            )
            if (!k) return (
              <button key={i} onClick={handleBackspace} className="bg-[#334155] text-slate-300 rounded-xl py-4 flex items-center justify-center active:scale-95 hover:bg-[#475569] transition cursor-pointer" title="Backspace">
                <Delete size={20} />
              </button>
            )
            return (
              <button key={i} onClick={() => handleDigit(k)} className="bg-[#334155] text-white rounded-xl py-4 text-xl font-bold active:scale-95 hover:bg-[#475569] transition cursor-pointer">
                {k}
              </button>
            )
          })}
        </div>

        <p className="text-center text-[10px] text-slate-500 mt-4">
          Owner PIN: 1234 &middot; Cashiers: ask owner for your PIN
        </p>
      </div>
    </div>
  )
}
