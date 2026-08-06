import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { OrderProvider } from './contexts/OrderContext'
import { ShiftProvider } from './contexts/ShiftContext'
import CashierPOS from './components/cashier/CashierPOS'
import AdminPanel from './components/admin/AdminPanel'
import OwnerView from './components/owner/OwnerView'
import ShiftManager from './components/shift/ShiftManager'
import Navbar from './components/shared/Navbar'
import LoginScreen from './components/auth/LoginScreen'
import ManagerPinGate from './components/auth/ManagerPinGate'

function Layout({ children, showOwnerView, onToggleOwnerView }) {
  return (
    <div className="h-screen flex flex-col bg-[#0F172A]">
      <Navbar showOwnerView={showOwnerView} onToggleOwnerView={onToggleOwnerView} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}

function PosPage() {
  const [showOwnerView, setShowOwnerView] = useState(false)
  const { isOwner } = useAuth()
  return (
    <Layout showOwnerView={showOwnerView} onToggleOwnerView={() => setShowOwnerView((v) => !v)}>
      {showOwnerView && isOwner ? <OwnerView onBack={() => setShowOwnerView(false)} /> : <CashierPOS />}
    </Layout>
  )
}

function RequireOwner({ children }) {
  const { user, isOwner } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (!isOwner) return <Navigate to="/" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, isManager } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (!isManager) return <Navigate to="/" replace />
  return children
}

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="h-screen">
        <LoginScreen />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<PosPage />} />
      <Route path="/admin" element={<RequireAdmin><Layout><ManagerPinGate><AdminPanel /></ManagerPinGate></Layout></RequireAdmin>} />
      <Route path="/owner" element={<Navigate to="/" replace />} />
      <Route path="/shift" element={<RequireAuth><Layout><ShiftManager /></Layout></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShiftProvider>
          <OrderProvider>
            <AppRoutes />
          </OrderProvider>
        </ShiftProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
