'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, LogOut, Plus, Edit, Trash2,
  Loader2, X, Check, Users, Menu, Store, Truck, FileDown, Star, Eye, UserCheck,
  Pause, Play,
} from 'lucide-react'
import { downloadGeneralReport, downloadResellerReport } from '@/lib/pdf'

interface Product { _id: string; name: string; price: number; category: string; stock: number; active: boolean; badge?: string; images: string[] }
interface Order   { _id: string; orderNumber: string; clientName: string; clientPhone: string; total: number; deliveryFee?: number; shippingZone?: string; paymentStatus: string; createdAt: string; items: any[]; resellerId?: { name: string; referralCode: string } | null }
interface AdminUser { _id: string; name: string; email: string; phone?: string; role: string; createdAt: string }
interface Reseller {
  _id: string; name: string; email: string; phone: string; referralCode: string; whatsappNumber: string
  resellerCity: string; resellerActive: boolean; createdAt: string
  customers: number; totalOrders: number; paidOrders: number; revenue: number; pendingRevenue: number; avgRating: number; ratingCount: number
}
interface Zone { _id: string; name: string; fee: number; active: boolean; isDefault: boolean }

type Tab = 'dashboard' | 'products' | 'orders' | 'resellers' | 'shipping' | 'users'

const DEFAULT_CATEGORIES = ['Visage', 'Corps', 'Cheveux', 'Lèvres', 'Solaire', 'Parfums']
const EMPTY_PRODUCT = { name: '', description: '', price: '', category: '', stock: '', badge: '', discount: '', images: [] as string[], featured: false }

const statusColor: Record<string, string> = {
  SUCCESSFUL: 'bg-green-100 text-green-700',
  PENDING:    'bg-yellow-100 text-yellow-700',
  FAILED:     'bg-red-100 text-red-700',
  EXPIRED:    'bg-gray-100 text-gray-500',
}

const NAV: [Tab, string, any][] = [
  ['dashboard', 'Tableau de bord', LayoutDashboard],
  ['products', 'Produits', Package],
  ['orders', 'Commandes', ShoppingBag],
  ['resellers', 'Revendeurs', Store],
  ['shipping', 'Livraison', Truck],
  ['users', 'Utilisateurs', Users],
]

export default function AdminDashboard() {
  const router  = useRouter()
  const [tab,      setTab]      = useState<Tab>('dashboard')
  const [products, setProducts] = useState<Product[]>([])
  const [orders,   setOrders]   = useState<Order[]>([])
  const [users,    setUsers]    = useState<AdminUser[]>([])
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [zones,    setZones]    = useState<Zone[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [form,     setForm]     = useState<typeof EMPTY_PRODUCT>(EMPTY_PRODUCT)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  // Reseller management
  const [promoteForm, setPromoteForm] = useState({ email: '', whatsappNumber: '', resellerCity: '' })
  const [promoting, setPromoting] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  // Shipping management
  const [zoneForm, setZoneForm] = useState({ name: '', fee: '', isDefault: false })
  const [zoneSaving, setZoneSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const json = (r: Response) => (r.ok ? r.json() : Promise.resolve({}))

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, oRes, uRes, rRes, zRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/orders'),
        fetch('/api/users'),
        fetch('/api/admin/resellers'),
        fetch('/api/admin/shipping'),
      ])
      const [pData, oData, uData, rData, zData] = await Promise.all([json(pRes), json(oRes), json(uRes), json(rRes), json(zRes)])
      setProducts(pData.products || [])
      setOrders(oData.orders || [])
      setUsers(uData.users || [])
      setResellers(rData.resellers || [])
      setZones(zData.zones || [])
    } finally {
      setLoading(false)
    }
  }

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...products.map((p) => p.category).filter(Boolean)])).sort()

  // ── Products ──
  const openCreate = () => { setForm(EMPTY_PRODUCT); setEditId(null); setShowForm(true) }
  const openEdit   = (p: Product) => {
    setForm({ name: p.name, description: (p as any).description || '', price: String(p.price), category: p.category, stock: String(p.stock), badge: p.badge || '', discount: '', images: p.images || [], featured: (p as any).featured || false })
    setEditId(p._id)
    setShowForm(true)
  }

  const saveProduct = async () => {
    setSaving(true)
    try {
      if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
        throw new Error('Nom, description et categorie sont requis')
      }
      const payload = {
        name: form.name, description: form.description,
        price: Number(form.price), category: form.category,
        stock: Number(form.stock), badge: form.badge || undefined,
        discount: form.discount ? Number(form.discount) : undefined,
        images: form.images, featured: form.featured,
      }
      const url    = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error((await res.json()).error)
      flash(editId ? 'Produit mis a jour' : 'Produit cree')
      setShowForm(false)
      fetchAll()
    } catch (e: any) { flash('Erreur: ' + e.message) } finally { setSaving(false) }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const onSelectImages = async (files: FileList | null) => {
    if (!files?.length) return
    const MAX_IMAGES = 6
    const compressImage = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const img = new Image()
          img.onload = () => {
            const maxWidth = 1200
            const scale = img.width > maxWidth ? maxWidth / img.width : 1
            const canvas = document.createElement('canvas')
            canvas.width = Math.round(img.width * scale)
            canvas.height = Math.round(img.height * scale)
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Canvas indisponible'))
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg', 0.75))
          }
          img.onerror = reject
          img.src = String(reader.result || '')
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    const remainingSlots = Math.max(0, MAX_IMAGES - form.images.length)
    if (remainingSlots <= 0) { flash('Maximum 6 images par produit.'); return }
    const selected = Array.from(files).slice(0, remainingSlots)
    const encoded = await Promise.all(selected.map(compressImage))
    setForm((prev) => ({ ...prev, images: [...prev.images, ...encoded] }))
  }

  // ── Resellers ──
  const promoteReseller = async () => {
    setPromoting(true)
    try {
      const res = await fetch('/api/admin/resellers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(promoteForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      flash(`${data.reseller.name} est maintenant revendeur (code ${data.reseller.referralCode})`)
      setPromoteForm({ email: '', whatsappNumber: '', resellerCity: '' })
      fetchAll()
    } catch (e: any) { flash('Erreur: ' + e.message) } finally { setPromoting(false) }
  }

  const toggleReseller = async (r: Reseller) => {
    await fetch(`/api/admin/resellers/${r._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resellerActive: !r.resellerActive }),
    })
    fetchAll()
  }

  const demoteReseller = async (r: Reseller) => {
    if (!confirm(`Retirer le statut revendeur de ${r.name} ?`)) return
    await fetch(`/api/admin/resellers/${r._id}`, { method: 'DELETE' })
    fetchAll()
  }

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setDetail({ loading: true })
    try {
      const res = await fetch(`/api/admin/resellers/${id}`)
      const data = await res.json()
      setDetail(data)
    } finally { setDetailLoading(false) }
  }

  const downloadGeneral = async () => {
    setPdfBusy(true)
    try {
      const res = await fetch('/api/admin/reports')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      downloadGeneralReport(data)
    } catch (e: any) { flash('Erreur PDF: ' + e.message) } finally { setPdfBusy(false) }
  }

  const downloadPersonal = async (id: string) => {
    setPdfBusy(true)
    try {
      const res = await fetch(`/api/admin/reports?resellerId=${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      downloadResellerReport(data)
    } catch (e: any) { flash('Erreur PDF: ' + e.message) } finally { setPdfBusy(false) }
  }

  // ── Shipping ──
  const saveZone = async () => {
    setZoneSaving(true)
    try {
      if (!zoneForm.name.trim()) throw new Error('Nom de la zone requis')
      const res = await fetch('/api/admin/shipping', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: zoneForm.name, fee: Number(zoneForm.fee), isDefault: zoneForm.isDefault }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      flash('Zone de livraison ajoutee')
      setZoneForm({ name: '', fee: '', isDefault: false })
      fetchAll()
    } catch (e: any) { flash('Erreur: ' + e.message) } finally { setZoneSaving(false) }
  }

  const patchZone = async (id: string, body: any) => {
    await fetch(`/api/admin/shipping/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    fetchAll()
  }

  const deleteZone = async (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return
    await fetch(`/api/admin/shipping/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const totalRevenue = orders.filter(o => o.paymentStatus === 'SUCCESSFUL').reduce((s, o) => s + o.total, 0)
  const resellerRevenue = resellers.reduce((s, r) => s + r.revenue, 0)

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-56 bg-violet-950 text-white flex flex-col z-30 hidden md:flex">
        <div className="p-6 border-b border-violet-800">
          <h1 className="font-display text-xl font-semibold">skeu</h1>
          <p className="text-violet-400 text-xs mt-1">Super Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === id ? 'bg-violet-700 text-white' : 'text-violet-200 hover:bg-violet-800'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="p-4 space-y-2">
          <Link href="/" className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-white text-violet-900 text-sm font-medium">
            Retourner a la boutique
          </Link>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-violet-300 hover:text-white text-sm transition-colors">
            <LogOut size={16} /> Deconnexion
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="md:ml-56 p-6">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-gradient font-semibold">Admin</h1>
          <button onClick={() => setMenuOpen(true)} className="p-2 rounded-lg border text-gray-500 hover:text-gray-700" aria-label="Ouvrir le menu admin">
            <Menu size={20} />
          </button>
        </div>

        {menuOpen && (
          <>
            <button className="fixed inset-0 bg-black/40 z-40" aria-label="Fermer le menu admin" onClick={() => setMenuOpen(false)} />
            <aside className="fixed top-0 left-0 h-full w-72 bg-violet-950 text-white z-50 p-5 flex flex-col">
              <div className="flex items-center justify-between border-b border-violet-800 pb-4 mb-4">
                <div>
                  <p className="font-display text-xl">Menu admin</p>
                  <p className="text-violet-300 text-xs">Navigation</p>
                </div>
                <button onClick={() => setMenuOpen(false)} className="text-violet-200 hover:text-white" aria-label="Fermer le menu"><X size={20} /></button>
              </div>
              <nav className="space-y-2 overflow-y-auto">
                {NAV.map(([id, label, Icon]) => (
                  <button key={id} onClick={() => { setTab(id); setMenuOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${tab === id ? 'bg-violet-700 text-white' : 'text-violet-100 hover:bg-violet-800'}`}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </nav>
              <div className="mt-auto space-y-2 pt-5">
                <Link href="/" onClick={() => setMenuOpen(false)} className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-white text-violet-900 text-sm font-medium">Retourner au site</Link>
                <button onClick={logout} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-800 text-white text-sm"><LogOut size={16} /> Deconnexion</button>
              </div>
            </aside>
          </>
        )}

        {msg && (
          <div className="mb-4 bg-violet-50 border border-violet-200 text-violet-800 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
            {msg} <button onClick={() => setMsg('')}><X size={14} /></button>
          </div>
        )}

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tableau de bord</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Produits',       value: products.length,                 icon: Package,     color: 'bg-violet-50 text-violet-700' },
                { label: 'Commandes',      value: orders.length,                   icon: ShoppingBag, color: 'bg-blue-50 text-blue-700' },
                { label: 'Revenus (FCFA)', value: totalRevenue.toLocaleString(),   icon: TrendingUp,  color: 'bg-green-50 text-green-700' },
                { label: 'Revendeurs',     value: resellers.length,                icon: Store,       color: 'bg-amber-50 text-amber-700' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl p-6 ${s.color}`}>
                  <s.icon size={24} className="mb-3 opacity-70" />
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="text-sm mt-1 opacity-70">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">Dernieres commandes</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map(o => (
                    <div key={o._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{o.clientName}</p>
                        <p className="text-xs text-gray-400">{o.orderNumber}{o.resellerId ? ` · ${o.resellerId.name}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">{o.total.toLocaleString()} FCFA</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[o.paymentStatus] || 'bg-gray-100'}`}>{o.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-gray-400 text-sm">Aucune commande.</p>}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Top revendeurs</h3>
                  <button onClick={downloadGeneral} disabled={pdfBusy} className="text-xs inline-flex items-center gap-1.5 text-violet-700 font-medium hover:underline">
                    {pdfBusy ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} PDF general
                  </button>
                </div>
                <div className="space-y-3">
                  {[...resellers].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(r => (
                    <div key={r._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.customers} clients · {r.paidOrders} cmd</p>
                      </div>
                      <p className="text-sm font-semibold text-green-700">{r.revenue.toLocaleString()} FCFA</p>
                    </div>
                  ))}
                  {resellers.length === 0 && <p className="text-gray-400 text-sm">Aucun revendeur.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {tab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Produits ({products.length})</h2>
              <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Ajouter</button>
            </div>
            {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-violet-500" /></div> : (
              <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Produit</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Categorie</th>
                      <th className="px-4 py-3 text-left">Prix</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Stock</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.category}</td>
                        <td className="px-4 py-3 text-violet-700 font-semibold">{p.price.toLocaleString()} FCFA</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stock > 5 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors"><Edit size={15} /></button>
                            <button onClick={() => deleteProduct(p._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Commandes ({orders.length})</h2>
            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">N° Commande</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Revendeur</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Livraison</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{o.clientName}</p>
                        <p className="text-xs text-gray-400">{o.clientPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {o.resellerId ? <span className="text-xs font-medium text-violet-700">{o.resellerId.name}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">
                        {o.deliveryFee ? `${o.deliveryFee.toLocaleString()} FCFA` : '—'}{o.shippingZone ? ` (${o.shippingZone})` : ''}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{o.total.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor[o.paymentStatus] || 'bg-gray-100'}`}>{o.paymentStatus}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Aucune commande.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resellers */}
        {tab === 'resellers' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Revendeurs ({resellers.length})</h2>
              <button onClick={downloadGeneral} disabled={pdfBusy} className="btn-outline text-sm inline-flex items-center gap-2">
                {pdfBusy ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />} PDF general
              </button>
            </div>

            {/* Promote */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><UserCheck size={18} className="text-violet-600" /> Nommer un revendeur</h3>
              <p className="text-sm text-gray-500 mb-4">La personne doit avoir un compte client. Saisissez son email pour la promouvoir revendeur.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <input value={promoteForm.email} onChange={e => setPromoteForm(p => ({ ...p, email: e.target.value }))} placeholder="Email du compte *" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400" />
                <input value={promoteForm.whatsappNumber} onChange={e => setPromoteForm(p => ({ ...p, whatsappNumber: e.target.value }))} placeholder="WhatsApp (2376...)" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400" />
                <input value={promoteForm.resellerCity} onChange={e => setPromoteForm(p => ({ ...p, resellerCity: e.target.value }))} placeholder="Ville" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <button onClick={promoteReseller} disabled={promoting} className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                {promoting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Nommer revendeur
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Revendeur</th>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Clients</th>
                    <th className="px-4 py-3 text-left">Revenus</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Note</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resellers.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-violet-700">{r.referralCode}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{r.customers}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-green-700">{r.revenue.toLocaleString()} FCFA</p>
                        {r.pendingRevenue > 0 && <p className="text-[10px] text-yellow-600">{r.pendingRevenue.toLocaleString()} en attente</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {r.ratingCount ? <span className="inline-flex items-center gap-1 text-amber-600"><Star size={12} className="fill-amber-400 text-amber-400" />{r.avgRating} ({r.ratingCount})</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.resellerActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{r.resellerActive ? 'Actif' : 'Suspendu'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openDetail(r._id)} title="Voir le detail" className="p-1.5 text-gray-400 hover:text-violet-600"><Eye size={15} /></button>
                          <button onClick={() => downloadPersonal(r._id)} title="PDF personnel" className="p-1.5 text-gray-400 hover:text-violet-600"><FileDown size={15} /></button>
                          <button onClick={() => toggleReseller(r)} title={r.resellerActive ? 'Suspendre' : 'Reactiver'} className="p-1.5 text-gray-400 hover:text-amber-600">{r.resellerActive ? <Pause size={15} /> : <Play size={15} />}</button>
                          <button onClick={() => demoteReseller(r)} title="Retirer le statut" className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {resellers.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Aucun revendeur. Nommez-en un ci-dessus.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shipping */}
        {tab === 'shipping' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Frais de livraison ({zones.length})</h2>
            <p className="text-sm text-gray-500 mb-6">Definissez les frais de livraison et d&apos;expedition selon le lieu du client. La zone par defaut s&apos;applique si la ville du client ne correspond a aucune zone.</p>

            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Ajouter une zone</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <input value={zoneForm.name} onChange={e => setZoneForm(p => ({ ...p, name: e.target.value }))} placeholder="Nom (ex: Douala) *" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400" />
                <input type="number" value={zoneForm.fee} onChange={e => setZoneForm(p => ({ ...p, fee: e.target.value }))} placeholder="Frais (FCFA) *" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400" />
                <label className="flex items-center gap-2 text-sm text-gray-700 px-2">
                  <input type="checkbox" checked={zoneForm.isDefault} onChange={e => setZoneForm(p => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 accent-violet-600" />
                  Zone par defaut
                </label>
              </div>
              <button onClick={saveZone} disabled={zoneSaving} className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                {zoneSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Ajouter la zone
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Zone</th>
                    <th className="px-4 py-3 text-left">Frais</th>
                    <th className="px-4 py-3 text-left">Par defaut</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {zones.map(z => (
                    <tr key={z._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{z.name}</td>
                      <td className="px-4 py-3 text-violet-700 font-semibold">{z.fee.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3">
                        {z.isDefault ? <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-100 text-violet-700">Defaut</span>
                          : <button onClick={() => patchZone(z._id, { isDefault: true })} className="text-xs text-violet-600 hover:underline">Definir</button>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => patchZone(z._id, { active: !z.active })} className={`text-[10px] font-bold px-2 py-1 rounded-full ${z.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {z.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button onClick={() => deleteZone(z._id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {zones.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucune zone definie.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Gestion utilisateurs ({users.length})</h2>
            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Nom</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Telephone</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Creation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-violet-100 text-violet-700' : u.role === 'reseller' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.phone || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800 text-lg">{editId ? 'Modifier produit' : 'Nouveau produit'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'name',        label: 'Nom *',         type: 'text' },
                { key: 'description', label: 'Description *', type: 'textarea' },
                { key: 'price',       label: 'Prix (FCFA) *', type: 'number' },
                { key: 'stock',       label: 'Stock *',       type: 'number' },
                { key: 'badge',       label: 'Badge (ex: Best Seller)', type: 'text' },
                { key: 'discount',    label: 'Reduction (%)', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea rows={3} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400 resize-none" />
                  ) : (
                    <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400" />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categorie *</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400">
                  <option value="">Selectionner une categorie</option>
                  {categoryOptions.map((category) => (<option key={category} value={category}>{category}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Images du produit</label>
                <input type="file" multiple accept="image/*" onChange={(e) => onSelectImages(e.target.files)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400" />
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {form.images.map((image, index) => (
                      <div key={`${index}-${image.slice(0, 20)}`} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt={`Apercu ${index + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                        <button type="button" onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }))} className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1" aria-label="Supprimer l'image"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 accent-violet-600" />
                Produit vedette (affiche sur la page d&apos;accueil)
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1 text-sm">Annuler</button>
              <button onClick={saveProduct} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {editId ? 'Mettre a jour' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reseller detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-lg">Detail revendeur</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {detailLoading || detail.loading ? (
              <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-violet-500" /></div>
            ) : detail.reseller ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-display text-2xl text-gray-900">{detail.reseller.name}</p>
                    <p className="text-sm text-gray-500">{detail.reseller.email}</p>
                    <p className="text-sm text-gray-500">Code <span className="font-mono font-semibold text-violet-700">{detail.reseller.referralCode}</span> · WhatsApp {detail.reseller.whatsappNumber || '—'}</p>
                  </div>
                  <button onClick={() => downloadPersonal(detail.reseller._id)} disabled={pdfBusy} className="btn-outline text-sm inline-flex items-center gap-2">
                    {pdfBusy ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />} PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ['Clients', detail.stats.customers],
                    ['Cmd payees', detail.stats.paidOrders],
                    ['Revenus', `${detail.stats.revenue.toLocaleString()}`],
                    ['Note', detail.stats.ratingCount ? `${detail.stats.avgRating}/5` : '—'],
                  ].map(([l, v]) => (
                    <div key={l as string} className="bg-violet-50 rounded-2xl p-3 text-center">
                      <p className="text-lg font-bold text-violet-800">{v}</p>
                      <p className="text-[11px] text-violet-500">{l}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Commandes ({detail.orders.length})</h4>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {detail.orders.length === 0 ? <p className="text-gray-400 text-sm p-3">Aucune commande.</p> :
                      detail.orders.map((o: any) => (
                        <div key={o._id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-gray-600">{o.clientName}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{o.total.toLocaleString()} FCFA</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColor[o.paymentStatus] || 'bg-gray-100'}`}>{o.paymentStatus}</span>
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Avis ({detail.ratings.length})</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {detail.ratings.length === 0 ? <p className="text-gray-400 text-sm">Aucun avis.</p> :
                      detail.ratings.map((r: any) => (
                        <div key={r._id} className="border border-gray-100 rounded-xl px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{r.customerName}</span>
                            <span className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={11} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />)}</span>
                          </div>
                          {r.comment && <p className="text-xs text-gray-500 mt-1">{r.comment}</p>}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-8 text-center">Detail indisponible.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
