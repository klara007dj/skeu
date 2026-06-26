import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import CartSidebar from '@/components/shop/CartSidebar'
import HeroSection from '@/components/shop/HeroSection'
import HeroProductStrip from '@/components/shop/HeroProductStrip'
import CategoryCircles from '@/components/shop/CategoryCircles'
import ProductGrid from '@/components/shop/ProductGrid'
import PromoBanner from '@/components/shop/PromoBanner'
import BrandShowcase from '@/components/shop/BrandShowcase'
import BrandBanners from '@/components/shop/BrandBanners'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <CartSidebar />

      <main className="pb-20 md:pb-0">
        <HeroSection />
        <HeroProductStrip />

        <div className="gradient-brand text-white py-3 overflow-hidden mt-8">
          <div className="flex gap-12 animate-[marquee_20s_linear_infinite] whitespace-nowrap text-sm font-medium tracking-wide">
            {Array(4)
              .fill(['Vegan', 'Naturel', 'Cruelty-Free', 'Derma teste', 'Livraison rapide', 'Paiement Mobile Money'])
              .flat()
              .map((text, index) => (
                <span key={index}>
                  {text}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                </span>
              ))}
          </div>
        </div>

        <CategoryCircles />

        <ProductGrid
          title="Nos Glow Heroes"
          subtitle="Les produits qui subliment votre peau"
          query="?featured=true"
          viewAllHref="/products"
          maxItems={8}
        />

        <PromoBanner />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-3xl px-8 py-12 text-center">
            <h2 className="font-display text-4xl sm:text-5xl font-light mb-2">
              Beauty That <span className="text-gradient font-semibold italic">Loves</span> Your Skin Back
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Nous redefinissons la beaute avec des produits conscients et puissants.
            </p>
            <a href="/products" className="btn-primary inline-block text-sm">
              Voir tous les produits
            </a>
          </div>
        </section>

        <BrandShowcase />

        <ProductGrid
          title="The Glow Edit"
          subtitle="Les chouchous de nos clientes"
          query="?badge=Best+Seller"
          viewAllHref="/products?badge=Best+Seller"
          maxItems={4}
        />

        <ProductGrid
          title="Nouveautes"
          subtitle="Les dernieres arrivees"
          query="?badge=New"
          viewAllHref="/products?badge=New"
          maxItems={4}
        />

        <BrandBanners />
      </main>

      <Footer />
      <BottomNav />
    </>
  )
}
