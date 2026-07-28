import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { OrderProvider } from './contexts/OrderContext'
import { ShiftProvider } from './contexts/ShiftContext'
import CashierPOS from './components/cashier/CashierPOS'
import AdminPanel from './components/admin/AdminPanel'
import OwnerView from './components/owner/OwnerView'
import ShiftManager from './components/shift/ShiftManager'
import Navbar from './components/shared/Navbar'

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
  return (
    <Layout showOwnerView={showOwnerView} onToggleOwnerView={() => setShowOwnerView((v) => !v)}>
      {showOwnerView ? <OwnerView onBack={() => setShowOwnerView(false)} /> : <CashierPOS />}
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShiftProvider>
          <OrderProvider>
            <Routes>
              <Route path="/" element={<PosPage />} />
              <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
              <Route path="/owner" element={<Navigate to="/" replace />} />
              <Route path="/shift" element={<Layout><ShiftManager /></Layout>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </OrderProvider>
        </ShiftProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
