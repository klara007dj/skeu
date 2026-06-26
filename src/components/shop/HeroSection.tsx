'use client'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Leaf, Sparkles } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-pink-50/40 to-white">
      {/* soft blobs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative">
        {/* Left – copy */}
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/70 text-violet-700 text-[11px] font-semibold px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <Sparkles size={13} />
            Vegan · Cruelty-Free · Dermatologiquement teste
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.02] mb-5">
            Your <span className="text-gradient font-semibold">Skin</span>
            <br />
            Your <span className="text-gradient font-semibold">Glow</span>
          </h1>

          <p className="text-gray-500 text-base leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
            Une beaute qui sublime et prend soin de chaque peau. Cruelty-free, vegan,
            approuvee par les dermatologues.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link href="/products" className="btn-primary inline-flex items-center justify-center gap-2 text-sm">
              Explorer le Serum Radiance <ArrowRight size={16} />
            </Link>
            <Link href="/products?badge=Best+Seller" className="btn-outline inline-flex items-center justify-center gap-2 text-sm">
              Best Sellers
            </Link>
          </div>
        </div>

        {/* Right – serum bottle visual */}
        <div className="order-1 lg:order-2 flex justify-center">
          <div className="relative w-[300px] h-[320px] sm:w-[360px] sm:h-[380px]">
            {/* circular ring behind */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-violet-200" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-violet-100/70 to-pink-100/40 blur-xl" />

            {/* dropper bottle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-float">
              {/* dropper bulb */}
              <div className="w-4 h-7 bg-gray-800 rounded-t-md" />
              {/* cap */}
              <div className="w-16 h-9 bg-gray-900 rounded-md -mt-1 shadow-md" />
              {/* neck */}
              <div className="w-10 h-3 bg-violet-300" />
              {/* body */}
              <div className="relative w-32 h-44 rounded-[2rem] bg-gradient-to-b from-violet-300 via-violet-400 to-violet-500 shadow-2xl shadow-violet-300/50 overflow-hidden">
                {/* glossy highlight */}
                <div className="absolute left-3 top-4 w-3 h-28 bg-white/40 rounded-full blur-[2px]" />
                {/* label */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white/85 rounded-xl py-3 text-center backdrop-blur">
                  <p className="font-display text-violet-700 text-sm font-semibold leading-none">Radiance</p>
                  <p className="text-[9px] tracking-widest text-violet-500 mt-1">SERUM · 30ml</p>
                </div>
              </div>
            </div>

            {/* annotations */}
            <div className="absolute top-6 right-0 bg-white rounded-2xl shadow-lg px-3 py-2 text-xs font-semibold text-gray-700 inline-flex items-center gap-1.5 animate-pulse-soft">
              <Leaf size={13} className="text-emerald-600" />
              Ingredients naturels
            </div>
            <div className="absolute bottom-6 left-0 bg-white rounded-2xl shadow-lg px-3 py-2 text-xs font-semibold text-gray-700 inline-flex items-center gap-1.5 animate-pulse-soft" style={{ animationDelay: '1s' }}>
              <BadgeCheck size={13} className="text-violet-600" />
              Serum hydratant visage
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
