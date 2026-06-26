'use client'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { REF_STORAGE_KEY } from '@/components/ReferralCapture'
import Navbar from '@/components/layout/Navbar'
import { ShoppingBag, Loader2, CheckCircle, MessageCircle, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Step = 'form' | 'processing' | 'success'

interface FormData {
  name: string; phone: string; email: string; city: string; address: string; notes: string
}

interface Zone { _id: string; name: string; fee: number; isDefault: boolean }

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const cartTotal = total()

  const [step,     setStep]     = useState<Step>('form')
  const [formData, setFormData] = useState<FormData>({ name: '', phone: '', email: '', city: '', address: '', notes: '' })
  const [errors,   setErrors]   = useState<Partial<FormData>>({})
  const [zones,    setZones]    = useState<Zone[]>([])
  const [zoneId,   setZoneId]   = useState<string>('')
  const [result,   setResult]   = useState<{ paymentLink?: string; transId?: string; waLink?: string; deliveryFee?: number; total?: number; hasReseller?: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/shipping')
      .then((r) => r.json())
      .then((d) => {
        const z: Zone[] = d.zones || []
        setZones(z)
        const def = z.find((x) => x.isDefault) || z[0]
        if (def) setZoneId(def._id)
      })
      .catch(() => {})
  }, [])

  const selectedZone = zones.find((z) => z._id === zoneId)
  const deliveryFee = selectedZone?.fee || 0
  const grandTotal = cartTotal + deliveryFee

  const validate = (): boolean => {
    const e: Partial<FormData> = {}
    if (!formData.name.trim())  e.name  = 'Nom requis'
    if (!formData.phone.trim()) e.phone = 'Numéro requis'
    else if (!/^[+\d\s]{8,15}$/.test(formData.phone)) e.phone = 'Numéro invalide'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (items.length === 0) return

    setStep('processing')
    let resellerCode = ''
    try { resellerCode = localStorage.getItem(REF_STORAGE_KEY) || '' } catch { /* ignore */ }

    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          address: formData.address,
          notes: formData.notes,
          items,
          shippingZoneId: zoneId || undefined,
          resellerCode: resellerCode || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur de paiement')

      setResult(data)
      setStep('success')
      clearCart()
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue.')
      setStep('form')
    }
  }

  // ── Empty cart ──
  if (items.length === 0 && step === 'form') return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-20">
        <ShoppingBag size={56} className="text-gray-200 mb-4" />
        <h2 className="font-display text-3xl font-light mb-2">Votre panier est vide</h2>
        <p className="text-gray-400 text-sm mb-6">Ajoutez des produits avant de passer commande.</p>
        <Link href="/products" className="btn-primary text-sm">Explorer la boutique</Link>
      </div>
    </>
  )

  // ── Success ──
  if (step === 'success' && result) return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="font-display text-4xl font-light mb-2">Merci pour votre commande !</h2>
        <p className="text-gray-500 text-sm mb-2 max-w-sm">
          Votre commande a été enregistrée. Cliquez ci-dessous pour payer en toute sécurité sur le site via Fapshi.
        </p>
        {typeof result.total === 'number' && (
          <p className="text-gray-700 text-sm mb-8">
            Montant à payer : <strong className="text-violet-700">{result.total.toLocaleString()} FCFA</strong>
            {result.deliveryFee ? ` (dont ${result.deliveryFee.toLocaleString()} FCFA de livraison)` : ''}
          </p>
        )}

        {result.paymentLink && (
          <a href={result.paymentLink} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm mb-4 inline-block">
            💳 Payer maintenant via Fapshi
          </a>
        )}

        {result.waLink && (
          <a
            href={result.waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-medium px-6 py-3 rounded-full text-sm transition-colors shadow-md mt-2"
          >
            <MessageCircle size={18} /> {result.hasReseller ? 'Discuter avec mon revendeur' : 'Contacter sur WhatsApp'}
          </a>
        )}

        {result.transId && (
          <p className="mt-6 text-xs text-gray-400">ID Transaction : <strong>{result.transId}</strong></p>
        )}

        <Link href="/" className="mt-8 text-sm text-violet-500 hover:text-violet-700 transition-colors">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </>
  )

  // ── Form / Processing ──
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <h1 className="font-display text-4xl font-light mb-8">
          <span className="text-gradient font-semibold italic">Commande</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left – Form */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-4">Vos informations</h2>
            <div className="space-y-4">
              {[
                { key: 'name',  label: 'Nom complet *',     type: 'text',  placeholder: 'Ex: Marie Dupont' },
                { key: 'phone', label: 'Téléphone Mobile Money *', type: 'tel', placeholder: 'Ex: +237 6XX XXX XXX' },
                { key: 'email', label: 'Email (optionnel)', type: 'email', placeholder: 'marie@email.com' },
                { key: 'address', label: 'Adresse / quartier', type: 'text', placeholder: 'Ex: Akwa, rue 12' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(formData as any)[f.key]}
                    onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-violet-400 transition-colors ${
                      (errors as any)[f.key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  />
                  {(errors as any)[f.key] && (
                    <p className="text-red-500 text-xs mt-1">{(errors as any)[f.key]}</p>
                  )}
                </div>
              ))}

              {/* Shipping zone selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Truck size={14} className="inline mr-1 text-violet-500" /> Lieu de livraison
                </label>
                {zones.length > 0 ? (
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400"
                  >
                    {zones.map((z) => (
                      <option key={z._id} value={z._id}>
                        {z.name} — {z.fee.toLocaleString()} FCFA
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Votre ville"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Instructions de livraison, message..."
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-violet-50 rounded-2xl">
              <p className="text-xs text-violet-700 font-medium mb-1">💳 Paiement 100% sur le site</p>
              <p className="text-xs text-gray-500">
                Le paiement (produits + livraison) se fait directement sur le site via Fapshi (MTN / Orange Money).
              </p>
            </div>
          </div>

          {/* Right – Summary */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-4">Récapitulatif</h2>
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={item.image || '/placeholder.jpg'} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                    {(item.price * item.quantity).toLocaleString()} FCFA
                  </span>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Sous-total</span><span>{cartTotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Livraison{selectedZone ? ` (${selectedZone.name})` : ''}</span>
                  <span>{deliveryFee > 0 ? `${deliveryFee.toLocaleString()} FCFA` : 'Gratuite'}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 mt-3 text-lg">
                  <span>Total</span>
                  <span className="text-violet-700">{grandTotal.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={step === 'processing'}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-sm disabled:opacity-70"
            >
              {step === 'processing' ? (
                <><Loader2 size={18} className="animate-spin" /> Traitement en cours…</>
              ) : (
                <>💳 Confirmer et payer — {grandTotal.toLocaleString()} FCFA</>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
