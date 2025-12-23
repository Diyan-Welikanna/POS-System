import { jsPDF } from 'jspdf'

interface ReceiptTransaction {
  id: string
  created_at: string
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: string
  cashier?: {
    full_name?: string
    email: string
  }
  customer?: {
    name: string
    email?: string
  }
  items: Array<{
    product: {
      name: string
      sku: string
    }
    quantity: number
    unit_price: number
    total: number
  }>
}

export const generateReceipt = async (transaction: ReceiptTransaction, currency: string = '$') => {
  const doc = new jsPDF()

  // Set font
  doc.setFont('helvetica')

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('POS SYSTEM', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Sales Receipt', 105, 28, { align: 'center' })

  // Draw line
  doc.setLineWidth(0.5)
  doc.line(20, 32, 190, 32)

  // Receipt details
  doc.setFontSize(10)
  let yPos = 40

  doc.text(`Receipt #: ${transaction.id.slice(0, 8).toUpperCase()}`, 20, yPos)
  yPos += 6
  doc.text(`Date: ${new Date(transaction.created_at).toLocaleString()}`, 20, yPos)
  yPos += 6
  doc.text(
    `Cashier: ${transaction.cashier?.full_name || 'N/A'}`,
    20,
    yPos
  )
  yPos += 6

  if (transaction.customer) {
    doc.text(`Customer: ${transaction.customer.name}`, 20, yPos)
    yPos += 6
  }

  // Draw line
  yPos += 2
  doc.line(20, yPos, 190, yPos)
  yPos += 8

  // Table header
  doc.setFont('helvetica', 'bold')
  doc.text('Item', 20, yPos)
  doc.text('Qty', 110, yPos, { align: 'right' })
  doc.text('Price', 140, yPos, { align: 'right' })
  doc.text('Total', 180, yPos, { align: 'right' })
  yPos += 2

  doc.setLineWidth(0.3)
  doc.line(20, yPos, 190, yPos)
  yPos += 6

  // Items
  doc.setFont('helvetica', 'normal')
  transaction.items.forEach((item) => {
    // Product name and SKU
    doc.text(`${item.product.name} (${item.product.sku})`, 20, yPos)
    doc.text(item.quantity.toString(), 110, yPos, { align: 'right' })
    doc.text(`${currency} ${item.unit_price.toFixed(2)}`, 140, yPos, { align: 'right' })
    doc.text(`${currency} ${item.total.toFixed(2)}`, 180, yPos, { align: 'right' })
    yPos += 6
  })

  // Draw line before totals
  yPos += 2
  doc.line(20, yPos, 190, yPos)
  yPos += 8

  // Totals
  doc.text('Subtotal:', 130, yPos)
  doc.text(`${currency} ${transaction.subtotal.toFixed(2)}`, 180, yPos, { align: 'right' })
  yPos += 6

  doc.text('Tax:', 130, yPos)
  doc.text(`${currency} ${transaction.tax.toFixed(2)}`, 180, yPos, { align: 'right' })
  yPos += 6

  if (transaction.discount > 0) {
    doc.text('Discount:', 130, yPos)
    doc.text(`-${currency} ${transaction.discount.toFixed(2)}`, 180, yPos, { align: 'right' })
    yPos += 6
  }

  // Grand total
  doc.setLineWidth(0.5)
  doc.line(130, yPos, 190, yPos)
  yPos += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', 130, yPos)
  doc.text(`${currency} ${transaction.total.toFixed(2)}`, 180, yPos, { align: 'right' })
  yPos += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(
    `Payment Method: ${transaction.payment_method.toUpperCase()}`,
    130,
    yPos
  )

  // Footer
  yPos = 260
  doc.setFontSize(9)
  doc.text('Thank you for your business!', 105, yPos, { align: 'center' })
  yPos += 5
  doc.text('www.possystem.com', 105, yPos, { align: 'center' })

  // Save PDF
  doc.save(`receipt-${transaction.id.slice(0, 8)}.pdf`)
}

export default generateReceipt
