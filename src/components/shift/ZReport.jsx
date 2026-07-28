import { X, Printer, DollarSign, ShoppingCart, Ban, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ZReport({ orders, shift, onClose }) {
  const active = orders.filter((o) => o.status !== 'cancelled')
  const cancelled = orders.filter((o) => o.status === 'cancelled')

  const cashOrders = active.filter((o) => o.paymentMethod === 'cash' || !o.paymentMethod)
  const walletOrders = active.filter((o) => o.paymentMethod === 'jazzcash' || o.paymentMethod === 'easypaisa')

  const totalCash = cashOrders.reduce((s, o) => s + (o.grandTotal || 0), 0)
  const totalWallet = walletOrders.reduce((s, o) => s + (o.grandTotal || 0), 0)
  const netRevenue = active.reduce((s, o) => s + (o.grandTotal || 0), 0)
  const voidedValue = cancelled.reduce((s, o) => s + (o.grandTotal || 0), 0)

  function handlePrint() {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'; iframe.style.top = '-9999px'
    iframe.style.width = '80mm'; iframe.style.height = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(`
      <html><head><style>
        @page { margin: 0; size: 80mm auto; }
        body { font-family: 'Courier New', monospace; font-size: 11px; width: 72mm; padding: 3mm; color: #000; }
        .center { text-align: center; }
        h2 { font-size: 14px; margin: 4px 0; }
        hr { border-top: 1px dashed #000; margin: 4px 0; }
        table { width: 100%; }
        td:last-child { text-align: right; }
        .big { font-size: 16px; font-weight: bold; }
      </style></head><body>
        <div class="center"><h2>RIZWAN FAST FOOD</h2><div>Z-REPORT</div></div>
        <hr/>
        <div>Opened: ${new Date(shift.openedAt).toLocaleString()}</div>
        <div>Closed: ${new Date().toLocaleString()}</div>
        <div>Cashier: ${shift.openedBy || 'cashier'}</div>
        <hr/>
        <table>
          <tr><td>Total Orders</td><td>${active.length}</td></tr>
          <tr><td>Cancelled</td><td>${cancelled.length}</td></tr>
          <tr><td>Cash Total</td><td>Rs. ${totalCash.toLocaleString()}</td></tr>
          <tr><td>Mobile Wallets</td><td>Rs. ${totalWallet.toLocaleString()}</td></tr>
          <tr><td>Voided Value</td><td>Rs. ${voidedValue.toLocaleString()}</td></tr>
        </table>
        <hr/>
        <div class="center big">NET REVENUE</div>
        <div class="center" style="font-size:18px;font-weight:bold;">Rs. ${netRevenue.toLocaleString()}</div>
        <hr/>
        <div class="center" style="font-size:10px;">End of Report</div>
      </body></html>
    `)
    doc.close()
    setTimeout(() => {
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 300)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-lg border border-[#334155] overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <h3 className="text-lg font-bold">Z-Report</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-secondary text-sm flex items-center gap-1 cursor-pointer"><Printer size={14} /> Print</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={22} /></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center text-sm text-slate-400">
            <p>Shift opened: {new Date(shift.openedAt).toLocaleString()}</p>
            <p>Closed: {new Date().toLocaleString()}</p>
            <p>Cashier: {shift.openedBy || 'cashier'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#334155] rounded-xl p-3">
              <div className="flex items-center gap-2 text-[#22C55E] mb-1"><DollarSign size={14} /> Cash</div>
              <div className="text-lg font-bold">Rs. {totalCash.toLocaleString()}</div>
            </div>
            <div className="bg-[#334155] rounded-xl p-3">
              <div className="flex items-center gap-2 text-[#A855F7] mb-1"><TrendingUp size={14} /> Mobile Wallets</div>
              <div className="text-lg font-bold">Rs. {totalWallet.toLocaleString()}</div>
            </div>
            <div className="bg-[#334155] rounded-xl p-3">
              <div className="flex items-center gap-2 text-[#F59E0B] mb-1"><ShoppingCart size={14} /> Orders</div>
              <div className="text-lg font-bold">{active.length}</div>
            </div>
            <div className="bg-[#334155] rounded-xl p-3">
              <div className="flex items-center gap-2 text-[#EF4444] mb-1"><Ban size={14} /> Voided</div>
              <div className="text-lg font-bold">{cancelled.length} (Rs. {voidedValue.toLocaleString()})</div>
            </div>
          </div>

          <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-400 mb-1">NET REVENUE</div>
            <div className="text-3xl font-bold text-[#22C55E]">Rs. {netRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
