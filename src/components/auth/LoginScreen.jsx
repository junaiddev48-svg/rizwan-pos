import { useState, useEffect } from 'react'
import { UtensilsCrossed, Delete, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const KEYS = [['1','2','3'],['4','5','6'],['7','8','9'],['C','0','DEL']]

const ROLE_STYLES = {
  owner: 'border-[#F59E0B]/40',
  admin: 'border-[#3B82F6]/40',
  cashier: 'border-[#22C55E]/40',
}

const ROLE_AVATAR = {
  owner: 'bg-[#F59E0B] text-[#052E16]',
  admin: 'bg-[#3B82F6] text-white',
  cashier: 'bg-[#334155] text-slate-300',
}

const ROLE_LABEL = {
  owner: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  admin: 'bg-[#3B82F6]/20 text-[#3B82F6]',
  cashier: 'bg-[#22C55E]/20 text-[#22C55E]',
}

export default function LoginScreen() {
  const { activeStaff, login, authLoading } = useAuth()
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const accounts = activeStaff.length > 0
    ? activeStaff
    : [{ id: 'local-owner', name: 'Owner', role: 'owner' }]

  useEffect(() => {
    function onKeyDown(e) {
      if (selected && e.key >= '0' && e.key <= '9' && pin.length < 4) {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, pin])

  async function handleDigit(d) {
    if (!selected || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError('')
    setNote('')
    if (next.length === 4) {
      setPin('')
      const result = await login(selected.name, next)
      if (result.ok && result.fallback) {
        setNote('Owner default account (PIN 1234). Owner can add more staff in Admin.')
      } else if (!result.ok) {
        setError(result.error || 'Wrong PIN')
      }
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
    <div className="h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-5 p-4 overflow-y-auto">
      <div className="text-center">
        <UtensilsCrossed className="text-[#22C55E] mx-auto mb-2" size={44} />
        <h1 className="text-2xl font-black tracking-wide">RIZWAN</h1>
        <p className="text-slate-500 text-sm mt-0.5">Fast Food POS System</p>
      </div>

      {!selected ? (
        <div className="w-full max-w-md">
          <h2 className="text-lg font-bold text-center mb-1">Who is working?</h2>
          <p className="text-slate-400 text-center text-xs mb-4">Tap your name to open the till</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => { setSelected(acc); setPin(''); setError(''); setNote('') }}
                className={`flex items-center gap-3 bg-[#1E293B] border-2 ${ROLE_STYLES[acc.role] || ROLE_STYLES.cashier} rounded-2xl px-4 py-4 hover:bg-[#243447] transition cursor-pointer text-left`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black ${ROLE_AVATAR[acc.role] || ROLE_AVATAR.cashier}`}>
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate text-base">{acc.name}</div>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${ROLE_LABEL[acc.role] || ROLE_LABEL.cashier}`}>
                    {acc.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-sm border border-[#334155]">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer" title="Choose another person">
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-lg font-bold truncate">
              Enter PIN for <span className="text-[#22C55E]">{selected.name}</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 text-center">4-digit PIN to open the till</p>

          <div className="flex justify-center gap-3 mb-3">
            {[0,1,2,3].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition ${pin[i] ? 'bg-[#22C55E] border-[#22C55E]' : 'border-slate-500'}`} />
            ))}
          </div>

          {error && <p className="text-center text-[#EF4444] text-sm mb-2">{error}</p>}
          {note && <p className="text-center text-[#F59E0B] text-xs mb-2">{note}</p>}
          {authLoading && <p className="text-center text-[#F59E0B] text-sm mb-2">Verifying...</p>}

          <div className="grid grid-cols-3 gap-3">
            {KEYS.flat().map((k, i) => {
              if (k === 'C') return (
                <button key={i} onClick={handleClear} className="bg-[#EF4444] text-white rounded-xl py-4 text-xl font-bold active:scale-95 transition cursor-pointer">C</button>
              )
              if (k === 'DEL') return (
                <button key={i} onClick={handleBackspace} className="bg-[#334155] text-slate-300 rounded-xl py-4 flex items-center justify-center active:scale-95 hover:bg-[#475569] transition cursor-pointer" title="Backspace">
                  <Delete size={20} />
                </button>
              )
              return (
                <button key={i} onClick={() => handleDigit(k)} className="bg-[#334155] text-white rounded-xl py-4 text-2xl font-bold active:scale-95 hover:bg-[#475569] transition cursor-pointer">{k}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
