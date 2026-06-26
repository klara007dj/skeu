/**
 * Script de seed – Ajoute des produits exemples dans MongoDB
 * Usage : node scripts/seed.js
 * (Assurez-vous que MONGODB_URI est défini dans .env.local)
 */

require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) { console.error('MONGODB_URI manquant'); process.exit(1) }

const ProductSchema = new mongoose.Schema({
  name: String, description: String, price: Number,
  images: [String], category: String, stock: Number,
  badge: String, discount: Number, featured: Boolean, active: Boolean,
}, { timestamps: true })

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

const ShippingZoneSchema = new mongoose.Schema({
  name: String, fee: Number, active: Boolean, isDefault: Boolean,
}, { timestamps: true })
const ShippingZone = mongoose.models.ShippingZone || mongoose.model('ShippingZone', ShippingZoneSchema)

const shippingZones = [
  { name: 'Douala', fee: 1500, active: true, isDefault: false },
  { name: 'Yaounde', fee: 2000, active: true, isDefault: false },
  { name: 'Autres villes', fee: 3500, active: true, isDefault: true },
]

const products = [
  {
    name: 'Sérum Radiance Éclat',
    description: 'Notre sérum phare enrichi en vitamine C et acide hyaluronique pour un teint lumineux et unifié. Formule légère à absorption rapide.',
    price: 12500, category: 'Visage', stock: 50,
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'],
    badge: 'Best Seller', featured: true, active: true,
  },
  {
    name: 'Crème Hydra Glow Moisturizer',
    description: 'Crème hydratante intensive 24h aux extraits de grenade et karité. Peaux normales à mixtes.',
    price: 9800, category: 'Visage', stock: 35,
    images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500'],
    badge: 'New', featured: true, active: true,
  },
  {
    name: 'Baume Lèvres Velvet Glow',
    description: 'Baume lèvres nourrissant à l\'huile de jojoba et beurre de cacao. Couleur rosée naturelle.',
    price: 4500, category: 'Lèvres', stock: 80,
    images: ['https://images.unsplash.com/photo-1586495777744-4e6232bf2263?w=500'],
    badge: '50% OFF', discount: 50, active: true,
  },
  {
    name: 'Gel Solaire SPF 30',
    description: 'Protection solaire légère non grasse pour le visage. Convient aux peaux sensibles et mixtes.',
    price: 7200, category: 'Solaire', stock: 40,
    images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=500'],
    badge: 'Best Seller', featured: true, active: true,
  },
  {
    name: 'Huile Corps Lumineuse',
    description: 'Huile sèche multi-usages pour un corps lumineux et hydraté. Notes fleuries et vanillées.',
    price: 11000, category: 'Corps', stock: 25,
    images: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500'],
    active: true,
  },
  {
    name: 'Masque Purifiant Argile',
    description: 'Masque à l\'argile blanche et charbon actif pour purifier et affiner les pores en profondeur.',
    price: 6500, category: 'Visage', stock: 60,
    images: ['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500'],
    badge: 'New', active: true,
  },
  {
    name: 'Sérum Cheveux Réparateur',
    description: 'Sérum sans rinçage aux protéines de soie et kératine pour cheveux brillants et disciplinés.',
    price: 8900, category: 'Cheveux', stock: 45,
    images: ['https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500'],
    active: true,
  },
  {
    name: 'Eau Parfumée Fleur de Frangipane',
    description: 'Eau de toilette légère aux notes de frangipane, jasmin et musc blanc. 50ml.',
    price: 15000, category: 'Parfums', stock: 20,
    images: ['https://images.unsplash.com/photo-1541643600914-78b084683702?w=500'],
    featured: true, active: true,
  },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  await Product.deleteMany({})
  await Product.insertMany(products)
  console.log(`✅ ${products.length} produits insérés avec succès !`)

  await ShippingZone.deleteMany({})
  await ShippingZone.insertMany(shippingZones)
  console.log(`✅ ${shippingZones.length} zones de livraison insérées !`)

  await mongoose.disconnect()
}

seed().catch(console.error)
