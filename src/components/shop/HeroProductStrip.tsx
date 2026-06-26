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
}

export default function HeroProductStrip() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products?limit=4&sort=popular')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
  }, [])

  if (products.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => {
          const price = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price
          return (
            <Link
              key={p._id}
              href={`/products/${p._id}`}
              className="group flex items-center gap-3 bg-white rounded-full shadow-md shadow-violet-100/60 border border-violet-50 pl-2 pr-4 py-2 hover:shadow-lg transition-all"
            >
              <span className="relative w-12 h-12 rounded-full overflow-hidden bg-violet-50 flex-shrink-0">
                <Image src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} fill className="object-cover" sizes="48px" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-gray-800 truncate group-hover:text-violet-700 transition-colors">{p.name}</span>
                <span className="block text-xs font-bold text-violet-700">{price.toLocaleString()} FCFA</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
