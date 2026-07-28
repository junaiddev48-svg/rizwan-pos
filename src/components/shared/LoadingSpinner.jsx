import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
      <Loader2 className="animate-spin" size={24} />
      <span>{text}</span>
    </div>
  )
}
