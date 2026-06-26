'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check,
  Copy,
  Link2,
  Loader2,
  LogOut,
  MessageCircle,
  Save,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'

interface Detail {
  reseller: {
    _id: string
    name: string
    email: string
    phone: string
    referralCode: string
    whatsappNumber: string
    resellerCity: string
    resellerBio: string
    resellerActive: boolean
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
  orders: Array<{ _id: string; orderNumber: string; clientName: string; total: number; paymentStatus: string; createdAt: string }>
  ratings: Array<{ _id: string; customerName: string; rating: number; comment?: string; createdAt: string }>
  customers: Array<{ _id: string; name: string; email: string; phone?: string; createdAt: string }>
}

const statusColor: Record<string, string> = {
  SUCCESSFUL: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

export default function ResellerDashboard() {
  const router = useRouter()
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ whatsappNumber: '', resellerCity: '', phone: '', resellerBio: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reseller/me', { cache: 'no-store' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const d = await res.json()
      setData(d)
      setForm({
        whatsappNumber: d.reseller?.whatsappNumber || '',
        resellerCity: d.reseller?.resellerCity || '',
        phone: d.reseller?.phone || '',
        resellerBio: d.reseller?.resellerBio || '',
      })
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/reseller/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      setMsg('Informations enregistrees')
      load()
    } catch (e: any) {
      setMsg('Erreur: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const logout = async () => {
    await fetch('/api/account', { method: 'DELETE' })
    router.push('/login')
  }

  const referralLink = data?.reseller.referralCode ? `${appUrl}/?ref=${data.reseller.referralCode}` : ''

  const copy = (text: string, what: 'code' | 'link') => {
    navigator.clipboard.writeText(text)
    setCopied(what)
    setTimeout(() => setCopied(null), 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-50">
        <Loader2 className="animate-spin text-violet-600" size={28} />
      </div>
    )
  }

  if (!data?.reseller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-violet-50 text-center p-6">
        <p className="text-gray-600 mb-4">Espace revendeur indisponible.</p>
        <Link href="/login" className="btn-primary text-sm">Se connecter</Link>
      </div>
    )
  }

  const { reseller, stats } = data

  const statCards = [
    { label: 'Clients parraines', value: stats.customers, icon: Users, color: 'bg-violet-50 text-violet-700' },
    { label: 'Commandes payees', value: stats.paidOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-700' },
    { label: 'Revenus (FCFA)', value: stats.revenue.toLocaleString(), icon: TrendingUp, color: 'bg-green-50 text-green-700' },
    { label: 'Note moyenne', value: stats.ratingCount ? `${stats.avgRating}/5` : '—', icon: Star, color: 'bg-amber-50 text-amber-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      {/* Top bar */}
      <header className="gradient-brand text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-violet-100 text-xs uppercase tracking-[0.2em]">Espace revendeur</p>
            <h1 className="font-display text-2xl font-semibold">{reseller.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden sm:inline-block bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-full transition-colors">
              Voir la boutique
            </Link>
            <button onClick={logout} className="inline-flex items-center gap-2 bg-white text-violet-700 text-sm font-medium px-4 py-2 rounded-full">
              <LogOut size={15} /> Quitter
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {!reseller.resellerActive && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
            Votre compte revendeur est actuellement suspendu. Contactez l&apos;administrateur.
          </div>
        )}

        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-2xl px-4 py-3">{msg}</div>
        )}

        {/* Referral tools */}
        <section className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Link2 size={18} className="text-violet-600" /> Votre lien & code de parrainage
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Partagez ce lien ou ce code. Les clients qui s&apos;inscrivent avec seront rattaches a vous, et leurs
            commandes vous seront attribuees.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-violet-50 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-violet-500 font-semibold mb-2">Code promo</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xl font-bold text-violet-800">{reseller.referralCode}</span>
                <button onClick={() => copy(reseller.referralCode, 'code')} className="p-2 rounded-lg bg-white text-violet-700 hover:bg-violet-100 transition-colors">
                  {copied === 'code' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <div className="bg-violet-50 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-violet-500 font-semibold mb-2">Lien d&apos;inscription</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-violet-800 truncate">{referralLink}</span>
                <button onClick={() => copy(referralLink, 'link')} className="p-2 rounded-lg bg-white text-violet-700 hover:bg-violet-100 transition-colors flex-shrink-0">
                  {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
              <s.icon size={22} className="mb-2 opacity-70" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-1 opacity-70">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Profile form */}
        <section className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MessageCircle size={18} className="text-violet-600" /> Mes informations de contact
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Le numero WhatsApp ci-dessous est celui vers lequel vos clients seront rediriges pour discuter des
            modalites de livraison.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Numero WhatsApp (ex: 2376XXXXXXXX)</label>
              <input
                value={form.whatsappNumber}
                onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400"
                placeholder="2376XXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telephone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400"
                placeholder="Telephone"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
              <input
                value={form.resellerCity}
                onChange={(e) => setForm((p) => ({ ...p, resellerCity: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400"
                placeholder="Douala, Yaounde..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Presentation (visible par vos clients)</label>
              <textarea
                rows={3}
                value={form.resellerBio}
                onChange={(e) => setForm((p) => ({ ...p, resellerBio: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400 resize-none"
                placeholder="Quelques mots sur vous..."
              />
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary text-sm mt-5 inline-flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Enregistrer
          </button>
        </section>

        {/* Orders */}
        <section className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Mes commandes ({data.orders.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs uppercase border-b border-gray-100">
                <tr>
                  <th className="py-2 text-left">N° Commande</th>
                  <th className="py-2 text-left">Client</th>
                  <th className="py-2 text-left">Montant</th>
                  <th className="py-2 text-left">Statut</th>
                  <th className="py-2 text-left hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.orders.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-400">Aucune commande pour le moment.</td></tr>
                ) : data.orders.map((o) => (
                  <tr key={o._id}>
                    <td className="py-3 font-mono text-xs text-gray-600">{o.orderNumber}</td>
                    <td className="py-3 text-gray-800">{o.clientName}</td>
                    <td className="py-3 font-semibold text-gray-800">{o.total.toLocaleString()} FCFA</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor[o.paymentStatus] || 'bg-gray-100'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-400 hidden sm:table-cell">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ratings */}
        <section className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Avis de mes clients ({data.ratings.length})</h2>
          {data.ratings.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun avis pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {data.ratings.map((r) => (
                <div key={r._id} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 text-sm">{r.customerName}</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-500 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
