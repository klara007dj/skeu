'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import CartSidebar from '@/components/shop/CartSidebar'
import { Loader2, LogOut, MessageCircle, ShieldCheck, Star, Store, UserRound } from 'lucide-react'

type ReferredBy = {
  id: string
  name: string
  whatsappNumber: string
  referralCode: string
  active: boolean
}

type SessionUser = {
  id?: string
  name: string
  email: string
  phone?: string
  role: 'customer' | 'admin' | 'reseller'
  referralCode?: string
  referredBy?: ReferredBy | null
}

export default function AccountPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Rating widget
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [ratingMsg, setRatingMsg] = useState('')
  const [ratingBusy, setRatingBusy] = useState(false)

  const loadSession = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account', { cache: 'no-store' })
      const data = await res.json()
      setUser(data.user || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  const logout = async () => {
    await fetch('/api/account', { method: 'DELETE' })
    setUser(null)
  }

  const submitRating = async () => {
    if (!rating) {
      setRatingMsg('Choisissez une note.')
      return
    }
    setRatingBusy(true)
    setRatingMsg('')
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRatingMsg('Merci ! Votre avis a ete enregistre.')
    } catch (e: any) {
      setRatingMsg('Erreur: ' + e.message)
    } finally {
      setRatingBusy(false)
    }
  }

  const resellerWaLink = (reseller: ReferredBy) => {
    const num = String(reseller.whatsappNumber || '').replace(/[^\d]/g, '')
    const text = encodeURIComponent(
      `Bonjour ${reseller.name}, je suis votre client sur skeu et je souhaite discuter des modalites de livraison.`
    )
    return num ? `https://wa.me/${num}?text=${text}` : ''
  }

  return (
    <>
      <Navbar />
      <CartSidebar />
      <main className="min-h-screen bg-gradient-to-b from-violet-50/60 to-white pb-28 md:pb-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl mb-10">
            <h1 className="font-display text-4xl sm:text-5xl font-light mb-3">
              Mon <span className="text-gradient font-semibold italic">compte</span>
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Consultez votre profil quand vous etes connecte. Sinon, utilisez le bouton de connexion.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-violet-600">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : user ? (
            <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6">
              <div className="bg-white border border-violet-100 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white">
                    {user.role === 'admin' ? <ShieldCheck size={24} /> : user.role === 'reseller' ? <Store size={24} /> : <UserRound size={24} />}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-violet-500 font-semibold">
                      {user.role === 'admin' ? 'Administrateur' : user.role === 'reseller' ? 'Revendeur' : 'Client'}
                    </p>
                    <h2 className="font-display text-3xl text-gray-900">{user.name}</h2>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-violet-50 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-500 font-semibold mb-1">Email</p>
                    <p className="text-gray-800 font-medium break-all">{user.email}</p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-500 font-semibold mb-1">Telephone</p>
                    <p className="text-gray-800 font-medium">{user.phone || 'Non renseigne'}</p>
                  </div>
                  {user.role === 'reseller' && user.referralCode && (
                    <div className="rounded-2xl bg-violet-50 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-violet-500 font-semibold mb-1">Mon code</p>
                      <p className="text-gray-800 font-mono font-bold">{user.referralCode}</p>
                    </div>
                  )}
                  <div className="rounded-2xl bg-violet-50 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-500 font-semibold mb-1">Statut</p>
                    <p className="text-gray-800 font-medium">Connecte</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-8">
                  {user.role === 'admin' && (
                    <Link href="/admin" className="btn-primary text-sm inline-flex items-center gap-2">
                      <ShieldCheck size={16} /> Ouvrir le panel admin
                    </Link>
                  )}
                  {user.role === 'reseller' && (
                    <Link href="/reseller" className="btn-primary text-sm inline-flex items-center gap-2">
                      <Store size={16} /> Mon espace revendeur
                    </Link>
                  )}
                  <button onClick={logout} className="btn-outline text-sm inline-flex items-center gap-2">
                    <LogOut size={16} />
                    Deconnexion
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Reseller contact + rating (customers referred by a reseller) */}
                {user.role === 'customer' && user.referredBy && (
                  <div className="bg-white border border-violet-100 rounded-[32px] p-8 shadow-sm">
                    <h3 className="font-display text-2xl mb-1">Votre revendeur</h3>
                    <p className="text-gray-800 font-medium">{user.referredBy.name}</p>
                    <p className="text-xs text-gray-400 mb-4">Pour toute question sur les modalites de livraison.</p>
                    {resellerWaLink(user.referredBy) ? (
                      <a
                        href={resellerWaLink(user.referredBy)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-medium px-5 py-3 rounded-full text-sm transition-colors w-full justify-center"
                      >
                        <MessageCircle size={18} /> Contacter sur WhatsApp
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400">Numero WhatsApp non disponible.</p>
                    )}

                    {/* Rating */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">Notez votre revendeur</p>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setRating(n)}
                            onMouseEnter={() => setHover(n)}
                            onMouseLeave={() => setHover(0)}
                            aria-label={`Note ${n}`}
                          >
                            <Star
                              size={26}
                              className={n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Un commentaire (optionnel)"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-violet-400 resize-none mb-3"
                      />
                      <button onClick={submitRating} disabled={ratingBusy} className="btn-primary text-sm w-full inline-flex items-center justify-center gap-2">
                        {ratingBusy ? <Loader2 size={15} className="animate-spin" /> : null}
                        Envoyer mon avis
                      </button>
                      {ratingMsg && <p className="text-xs text-violet-600 mt-2">{ratingMsg}</p>}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-violet-100 rounded-[32px] p-8 shadow-sm">
                  <h3 className="font-display text-2xl mb-3">Acces rapide</h3>
                  <div className="space-y-3">
                    <Link href="/products" className="btn-primary text-sm inline-block w-full text-center">
                      Voir les produits
                    </Link>
                    <Link href="/wishlist" className="btn-outline text-sm inline-block w-full text-center">
                      Voir ma wishlist
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-xl bg-white border border-violet-100 rounded-[32px] p-8 shadow-sm">
              <h2 className="font-display text-3xl mb-3">Connexion requise</h2>
              <p className="text-gray-500 text-sm mb-6">
                Vous n&apos;etes pas connecte. Cliquez sur le bouton ci-dessous pour acceder a la page de connexion et d&apos;inscription.
              </p>
              <Link href="/login" className="btn-primary inline-flex items-center justify-center text-sm px-6">
                Se connecter
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
