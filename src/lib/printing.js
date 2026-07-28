export function printCustomerReceipt(order) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-9999px'
  iframe.style.left = '-9999px'
  iframe.style.width = '80mm'
  iframe.style.height = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`
    <html>
    <head>
      <style>
        @page { margin: 0; size: 80mm auto; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; padding: 4mm 4mm; color: #000; }
        .center { text-align: center; }
        .header { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .sub { font-size: 10px; color: #555; }
        hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 2px 0; }
        .right { text-align: right; }
        .total { font-weight: bold; font-size: 14px; }
        .footer { text-align: center; margin-top: 8px; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="header">RIZWAN FAST FOOD</div>
        <div class="sub">Lahore, Pakistan</div>
      </div>
      <hr/>
      <div>Date: ${new Date(order.createdAt).toLocaleDateString()}  Time: ${new Date(order.createdAt).toLocaleTimeString()}</div>
      <div>Order: ${order.orderId}</div>
      <div>Token: ${order.tokenNumber}  Type: ${order.orderType.toUpperCase()}</div>
      ${order.tableNumber ? `<div>Table: ${order.tableNumber}</div>` : ''}
      <hr/>
      <table>
        <tr><th>ITEM</th><th class="right">QTY</th><th class="right">PRICE</th></tr>
        ${order.items.map(i => `
          <tr><td>${i.name}</td><td class="right">${i.quantity}</td><td class="right">Rs. ${(i.basePrice * i.quantity).toLocaleString()}</td></tr>
          ${(i.selectedModifiers || []).map(m => `<tr><td style="padding-left:8px;">+ ${m.name}</td><td class="right">${i.quantity}</td><td class="right">Rs. ${(m.additionalPrice * i.quantity).toLocaleString()}</td></tr>`).join('')}
          ${i.itemNotes ? `<tr><td style="padding-left:8px;font-style:italic;font-size:10px;">* ${i.itemNotes}</td><td></td><td></td></tr>` : ''}
        `).join('')}
      </table>
      <hr/>
      <table>
        <tr><td>SUB-TOTAL:</td><td class="right">Rs. ${order.subtotal.toLocaleString()}</td></tr>
        <tr class="total"><td>GRAND TOTAL:</td><td class="right">Rs. ${order.grandTotal.toLocaleString()}</td></tr>
      </table>
      <div>PAID VIA: ${order.paymentMethod.toUpperCase()}</div>
      <hr/>
      <div class="footer">Thank you for your visit!</div>
    </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }, 300)
}

export function printKitchenKOT(order) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-9999px'
  iframe.style.left = '-9999px'
  iframe.style.width = '80mm'
  iframe.style.height = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`
    <html>
    <head>
      <style>
        @page { margin: 0; size: 80mm auto; }
        body { font-family: 'Courier New', monospace; font-size: 14px; width: 72mm; padding: 4mm 4mm; color: #000; }
        .center { text-align: center; }
        .token { font-size: 24px; font-weight: bold; margin: 8px 0; }
        .type { font-size: 16px; font-weight: bold; }
        .table { font-size: 16px; }
        hr { border: none; border-top: 1px solid #000; margin: 6px 0; }
        .item { font-size: 14px; margin: 4px 0; }
        .mod { padding-left: 12px; font-size: 12px; }
        .note { padding-left: 12px; font-style: italic; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="token">TOKEN #${order.tokenNumber}</div>
        <div class="type">${order.orderType.toUpperCase()}</div>
        ${order.tableNumber ? `<div class="table">[ ${order.tableNumber} ]</div>` : ''}
      </div>
      <hr/>
      <div>Time: ${new Date(order.createdAt).toLocaleTimeString()}</div>
      <hr/>
      ${order.items.map(i => `
        <div class="item">${i.quantity}x ${i.name}</div>
        ${(i.selectedModifiers || []).map(m => `<div class="mod">* ${m.name.toUpperCase()}</div>`).join('')}
        ${i.itemNotes ? `<div class="note">* ${i.itemNotes}</div>` : ''}
      `).join('')}
      <hr/>
      ${order.customerPhone ? `<div>Phone: ${order.customerPhone}</div>` : ''}
      ${order.customerAddress ? `<div>Address: ${order.customerAddress}</div>` : ''}
    </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }, 300)
}
