import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UtensilsCrossed, LayoutDashboard, Settings, Clock, Menu, X, RefreshCw, WifiOff } from 'lucide-react'
import useNetworkStatus from '../../hooks/useNetworkStatus'
import useOfflineSync from '../../hooks/useOfflineSync'
import { useShift } from '../../contexts/ShiftContext'

const navItems = [
  { path: '/', label: 'POS', icon: UtensilsCrossed },
  { path: '/admin', label: 'Admin', icon: Settings },
  { path: '/owner', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shift', label: 'Shift', icon: Clock },
]

export default function Navbar({ showOwnerView, onToggleOwnerView }) {
  const [time, setTime] = useState(new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isOnline = useNetworkStatus()
  const { queuedCount, syncing } = useOfflineSync()
  const { activeShift } = useShift()
  const isPosRoute = location.pathname === '/'

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <nav className="bg-[#1E293B] border-b border-[#334155] px-3 py-2 no-print">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="lg:hidden p-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <UtensilsCrossed className="text-[#22C55E]" size={22} />
          <span className="font-bold text-sm hidden sm:inline">RIZWAN</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">|</span>
          <span className="text-xs text-slate-400 hidden sm:inline">Station 01</span>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path && !showOwnerView
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#334155] text-[#22C55E]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {isPosRoute && (
            <button
              onClick={onToggleOwnerView}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showOwnerView
                  ? 'bg-[#22C55E] text-[#052E16] shadow-lg shadow-[#22C55E]/20'
                  : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'
              }`}
            >
              {showOwnerView ? '◀ BACK TO POS' : '📊 OWNER VIEW'}
            </button>
          )}
          {queuedCount > 0 && (
            <span className="flex items-center gap-1 text-[#F59E0B] text-[10px] bg-[#F59E0B]/10 px-2 py-0.5 rounded">
              <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
              {queuedCount}
            </span>
          )}
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
          <span className="text-slate-400 font-mono text-xs">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {activeShift && (
            <span className="hidden sm:inline text-[#F59E0B] text-[10px] bg-[#F59E0B]/10 px-2 py-0.5 rounded font-semibold">
              SHIFT ON
            </span>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden mt-2 flex flex-col gap-1 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#334155] text-[#22C55E]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
