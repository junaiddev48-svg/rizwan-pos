import { useEffect } from 'react'
import supabase from '../lib/supabase'
import { addCancellation } from '../lib/cancellations'
import { playAlertSound, unlockAudio } from '../lib/alertSound'
import toast from 'react-hot-toast'

export default function useCancellationWatcher() {
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })

    const channel = supabase
      .channel('cancellation-alerts')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.old.status === 'cancelled') return
          if (payload.new.status !== 'cancelled') return
          addCancellation(payload.new)
          playAlertSound()
          toast.error(`Order #${payload.new.tokenNumber} CANCELLED — stop preparing`, { duration: 8000 })
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      supabase.removeChannel(channel)
    }
  }, [])
}
