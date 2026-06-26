'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  _id: string
  name: string
  images: string[]
}

export default function BrandShowcase() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products?limit=4&sort=newest')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
  }, [])

  if (products.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
        {products.map((p) => (
          <Link key={p._id} href={`/products/${p._id}`} className="flex flex-col items-center gap-3 group">
            <span className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-violet-200 group-hover:border-violet-500 group-hover:shadow-lg group-hover:shadow-violet-100 transition-all">
              <Image src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} fill className="object-cover" sizes="112px" />
            </span>
            <span className="text-xs font-medium text-gray-600 group-hover:text-violet-700 transition-colors text-center max-w-[7rem] truncate">
              {p.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
