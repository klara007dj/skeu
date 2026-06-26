import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const banners = [
  { title: 'Routine Eclat', subtitle: 'Jusqu\'a -30%', from: 'from-violet-500', to: 'to-purple-700', href: '/products?badge=Best+Seller' },
  { title: 'Nouveautes', subtitle: 'Vient d\'arriver', from: 'from-pink-400', to: 'to-rose-500', href: '/products?badge=New' },
  { title: 'Soin Solaire', subtitle: 'Protection SPF', from: 'from-amber-400', to: 'to-orange-500', href: '/products?category=solaire' },
  { title: 'Bestsellers', subtitle: 'Les favoris', from: 'from-fuchsia-500', to: 'to-violet-700', href: '/products' },
]

export default function BrandBanners() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {banners.map((b) => (
          <Link
            key={b.title}
            href={b.href}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${b.from} ${b.to} aspect-[3/4] p-5 flex flex-col justify-end`}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
            <p className="text-white/80 text-[11px] font-semibold uppercase tracking-widest">{b.subtitle}</p>
            <h3 className="text-white font-display text-2xl font-semibold leading-tight">{b.title}</h3>
            <span className="mt-3 inline-flex items-center gap-1.5 bg-white text-violet-700 text-[11px] font-bold px-3 py-1.5 rounded-full w-max group-hover:gap-2.5 transition-all">
              Acheter <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
