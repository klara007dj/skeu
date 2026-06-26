'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  _id: string
  name: string
  images: string[]
}

const FALLBACK: Product[] = [
  { _id: 'b1', name: 'Soins Visage', images: [] },
  { _id: 'b2', name: 'Serums Glow', images: [] },
  { _id: 'b3', name: 'Hydratation', images: [] },
  { _id: 'b4', name: 'Solaire', images: [] },
]

export default function BrandShowcase() {
  const [products, setProducts] = useState<Product[]>(FALLBACK)
  const [isFallback, setIsFallback] = useState(true)

  useEffect(() => {
    fetch('/api/products?limit=4&sort=newest')
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
        {products.map((p) => {
          const ring = (
            <span className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-violet-200 group-hover:border-violet-500 group-hover:shadow-lg group-hover:shadow-violet-100 transition-all flex items-center justify-center bg-gradient-to-br from-violet-100 to-pink-50">
              {p.images?.[0] ? (
                <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="112px" />
              ) : (
                <span className="font-display text-violet-400 text-3xl">{p.name.charAt(0)}</span>
              )}
            </span>
          )
          return (
            <Link key={p._id} href={isFallback ? '/products' : `/products/${p._id}`} className="flex flex-col items-center gap-3 group">
              {ring}
              <span className="text-xs font-medium text-gray-600 group-hover:text-violet-700 transition-colors text-center max-w-[7rem] truncate">{p.name}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
