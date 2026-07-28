import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import SalesSummary from './SalesSummary'
import LiveTransactionFeed from './LiveTransactionFeed'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useShift } from '../../contexts/ShiftContext'

export default function OwnerDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { activeShift, shifts } = useShift()

  useEffect(() => {
    if (!activeShift) {
      setLoading(false)
      return
    }
    const q = query(
      collection(db, 'orders'),
      where('shiftId', '==', activeShift.id),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setOrders(list)
      setLoading(false)
    })
    return unsub
  }, [activeShift])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Owner Dashboard</h1>
        <p className="text-slate-400 text-sm">
          {activeShift
            ? `Shift active since ${new Date(activeShift.openedAt).toLocaleTimeString()}`
            : 'No active shift'}
        </p>
      </div>

      {!activeShift ? (
        <div className="text-center text-slate-500 py-10">
          <p>Open a shift to start monitoring transactions.</p>
          <a href="/shift" className="text-[#22C55E] hover:underline mt-2 inline-block">Go to Shift Manager</a>
        </div>
      ) : (
        <>
          <SalesSummary orders={orders} />
          <LiveTransactionFeed orders={orders} />
        </>
      )}
    </div>
  )
}
