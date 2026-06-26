'use client'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const VIOLET: [number, number, number] = [124, 58, 237]
const DARK: [number, number, number] = [76, 29, 149]

const fcfa = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR')} FCFA`
const dateFr = (d?: string | Date) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...VIOLET)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('skeu', 14, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('cosmetiques', 14, 19)

  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(title, 14, 38)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(subtitle, 14, 44)
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    const h = doc.internal.pageSize.getHeight()
    const w = doc.internal.pageSize.getWidth()
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`skeu cosmetiques - Rapport revendeurs`, 14, h - 8)
    doc.text(`Page ${i} / ${pages}`, w - 14, h - 8, { align: 'right' })
  }
}

export interface GeneralReport {
  generatedAt: string
  resellerCount: number
  totals: { revenue: number; pendingRevenue: number; paidOrders: number; totalOrders: number; customers: number }
  resellers: Array<{
    name: string
    referralCode: string
    resellerCity: string
    customers: number
    paidOrders: number
    revenue: number
    pendingRevenue: number
    avgRating: number
    ratingCount: number
    resellerActive: boolean
  }>
}

export function downloadGeneralReport(data: GeneralReport) {
  const doc = new jsPDF()
  header(doc, 'Rapport general des revendeurs', `Genere le ${dateFr(data.generatedAt)} a ${new Date(
    data.generatedAt
  ).toLocaleTimeString('fr-FR')}`)

  // Summary cards
  autoTable(doc, {
    startY: 50,
    theme: 'grid',
    head: [['Revendeurs', 'Clients', 'Commandes payees', 'Revenus encaisses', 'En attente']],
    body: [[
      String(data.resellerCount),
      String(data.totals.customers),
      String(data.totals.paidOrders),
      fcfa(data.totals.revenue),
      fcfa(data.totals.pendingRevenue),
    ]],
    headStyles: { fillColor: DARK, halign: 'center' },
    bodyStyles: { halign: 'center', fontStyle: 'bold' },
    styles: { fontSize: 9 },
  })

  const afterSummary = (doc as any).lastAutoTable.finalY + 8

  autoTable(doc, {
    startY: afterSummary,
    head: [['Revendeur', 'Code', 'Ville', 'Clients', 'Cmd payees', 'Revenus', 'En attente', 'Note', 'Statut']],
    body: data.resellers.map((r) => [
      r.name,
      r.referralCode || '-',
      r.resellerCity || '-',
      String(r.customers),
      String(r.paidOrders),
      fcfa(r.revenue),
      fcfa(r.pendingRevenue),
      r.ratingCount ? `${r.avgRating}/5 (${r.ratingCount})` : '-',
      r.resellerActive ? 'Actif' : 'Suspendu',
    ]),
    headStyles: { fillColor: VIOLET, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2 },
    columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' } },
  })

  footer(doc)
  doc.save(`rapport-revendeurs-general-${Date.now()}.pdf`)
}

export interface PersonalReport {
  generatedAt: string
  reseller: {
    name: string
    email: string
    phone: string
    referralCode: string
    whatsappNumber: string
    resellerCity: string
    createdAt: string
  }
  stats: {
    customers: number
    totalOrders: number
    paidOrders: number
    revenue: number
    pendingRevenue: number
    avgRating: number
    ratingCount: number
  }
  orders: Array<{ orderNumber: string; clientName: string; total: number; paymentStatus: string; createdAt: string }>
  ratings: Array<{ customerName: string; rating: number; comment?: string; createdAt: string }>
  customers: Array<{ name: string; email: string; phone?: string; createdAt: string }>
}

export function downloadResellerReport(data: PersonalReport) {
  const doc = new jsPDF()
  const r = data.reseller
  header(doc, `Rapport revendeur - ${r.name}`, `Genere le ${dateFr(data.generatedAt)}`)

  // Profile + stats
  autoTable(doc, {
    startY: 50,
    theme: 'plain',
    body: [
      ['Code parrainage', r.referralCode || '-', 'WhatsApp', r.whatsappNumber || '-'],
      ['Email', r.email || '-', 'Telephone', r.phone || '-'],
      ['Ville', r.resellerCity || '-', 'Membre depuis', dateFr(r.createdAt)],
    ],
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
  })

  const afterProfile = (doc as any).lastAutoTable.finalY + 6
  autoTable(doc, {
    startY: afterProfile,
    theme: 'grid',
    head: [['Clients', 'Commandes', 'Payees', 'Revenus encaisses', 'En attente', 'Note moyenne']],
    body: [[
      String(data.stats.customers),
      String(data.stats.totalOrders),
      String(data.stats.paidOrders),
      fcfa(data.stats.revenue),
      fcfa(data.stats.pendingRevenue),
      data.stats.ratingCount ? `${data.stats.avgRating}/5 (${data.stats.ratingCount})` : '-',
    ]],
    headStyles: { fillColor: DARK, halign: 'center', fontSize: 9 },
    bodyStyles: { halign: 'center', fontStyle: 'bold', fontSize: 9 },
  })

  // Orders
  let y = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text('Commandes apportees', 14, y)
  autoTable(doc, {
    startY: y + 3,
    head: [['N° Commande', 'Client', 'Montant', 'Statut', 'Date']],
    body: data.orders.length
      ? data.orders.map((o) => [o.orderNumber, o.clientName, fcfa(o.total), o.paymentStatus, dateFr(o.createdAt)])
      : [['-', 'Aucune commande', '-', '-', '-']],
    headStyles: { fillColor: VIOLET, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 2: { halign: 'right' } },
  })

  // Ratings
  y = (doc as any).lastAutoTable.finalY + 10
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage()
    y = 20
  }
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text('Avis clients', 14, y)
  autoTable(doc, {
    startY: y + 3,
    head: [['Client', 'Note', 'Commentaire', 'Date']],
    body: data.ratings.length
      ? data.ratings.map((rt) => [rt.customerName, `${rt.rating}/5`, rt.comment || '-', dateFr(rt.createdAt)])
      : [['-', '-', 'Aucun avis', '-']],
    headStyles: { fillColor: VIOLET, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
  })

  footer(doc)
  doc.save(`rapport-revendeur-${(r.referralCode || r.name).replace(/\s+/g, '-')}-${Date.now()}.pdf`)
}
