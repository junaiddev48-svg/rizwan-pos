import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4 p-4">
          <AlertTriangle size={40} className="text-[#F59E0B]" />
          <h1 className="text-xl font-bold text-slate-100">Something went wrong</h1>
          <p className="text-slate-400 text-sm text-center max-w-sm">
            An unexpected error occurred. Reloading the app usually fixes it — your data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#22C55E] text-[#052E16] font-bold px-6 py-3 rounded-xl hover:bg-[#16A34A] transition cursor-pointer"
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
