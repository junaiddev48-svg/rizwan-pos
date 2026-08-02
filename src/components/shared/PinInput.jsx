import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function PinInput({ onConfirm, onCancel, title }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function validate(next) {
    const result = onConfirm(next)
    if (result && typeof result.then === 'function') {
      result.then((valid) => {
        if (valid) setPin('')
        else {
          setError(true)
          setPin('')
        }
      })
    } else if (result) {
      setPin('')
    } else {
      setError(true)
      setPin('')
    }
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      if (e.key >= '0' && e.key <= '9' && pin.length < 4) {
        const ae = document.activeElement
        if (!(ae && ae.closest && ae.closest('[data-modal]'))) return
        e.preventDefault()
        setError(false)
        const next = pin + e.key
        setPin(next)
        if (next.length === 4) validate(next)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pin, onConfirm, onCancel])

  function handleDigit(d) {
    if (pin.length < 4) {
      const newPin = pin + d
      setPin(newPin)
      setError(false)
      if (newPin.length === 4) validate(newPin)
    }
  }

  function handleClear() {
    setPin('')
    setError(false)
  }

  const keys = [['1','2','3'],['4','5','6'],['7','8','9'],['C','0','']]

  return (
    <div data-modal className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-2xl p-6 w-80 border border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title || 'Enter PIN'}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 ${pin[i] ? 'bg-[#22C55E] border-[#22C55E]' : 'border-slate-500'}`} />
          ))}
        </div>

        {error && <p className="text-center text-[#EF4444] text-sm mb-2">Incorrect PIN</p>}

        <div className="grid grid-cols-3 gap-3">
          {keys.flat().map((k, i) => {
            if (k === 'C') return (
              <button key={i} onClick={handleClear} className="bg-[#EF4444] text-white rounded-xl py-4 text-xl font-bold active:scale-95 transition cursor-pointer">C</button>
            )
            if (!k) return <div key={i} />
            return (
              <button key={i} onClick={() => handleDigit(k)} className="bg-[#334155] text-white rounded-xl py-4 text-xl font-bold active:scale-95 hover:bg-[#475569] transition cursor-pointer">{k}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
