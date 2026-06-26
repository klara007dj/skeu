'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  _id: string
  name: string
  price: number
  images: string[]
  discount?: number
  badge?: string
}

// Shown when the database has no products yet, so the row always matches the design.
const FALLBACK: Product[] = [
  { _id: 'f1', name: 'Gel Solaire SPF 30', price: 7200, images: [], badge: 'New' },
  { _id: 'f2', name: 'Creme HydraGlow', price: 9800, images: [], badge: 'New' },
  { _id: 'f3', name: 'Serum Radiance', price: 12500, images: [], badge: 'Best' },
  { _id: 'f4', name: 'Lip Velvet Glow', price: 4500, images: [], badge: 'New' },
]

export default function HeroProductStrip() {
  const [products, setProducts] = useState<Product[]>(FALLBACK)
  const [isFallback, setIsFallback] = useState(true)

  useEffect(() => {
    fetch('/api/products?limit=4&sort=popular')
      .then((r) => r.json())
      .then((d) => {
        if (d.products?.length) {
          setProducts(d.products)
          setIsFallback(false)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => {
          const price = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price
          const inner = (
            <>
              <span className="relative w-12 h-12 rounded-full overflow-hidden bg-violet-100 flex-shrink-0 flex items-center justify-center">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="48px" />
                ) : (
                  <span className="font-display text-violet-500 text-lg">{p.name.charAt(0)}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-gray-800 truncate group-hover:text-violet-700 transition-colors">{p.name}</span>
                <span className="block text-xs font-bold text-violet-700">{price.toLocaleString()} FCFA</span>
              </span>
              {p.badge && (
                <span className="text-[8px] font-bold uppercase bg-violet-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">{p.badge}</span>
              )}
            </>
          )
          const cls =
            'group flex items-center gap-3 bg-white rounded-full shadow-md shadow-violet-100/60 border border-violet-50 pl-2 pr-3 py-2 hover:shadow-lg transition-all'
          return isFallback ? (
            <Link key={p._id} href="/products" className={cls}>{inner}</Link>
          ) : (
            <Link key={p._id} href={`/products/${p._id}`} className={cls}>{inner}</Link>
          )
        })}
      </div>
    </section>
  )
}
