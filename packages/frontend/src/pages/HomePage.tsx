import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingCart, Shield, Zap, HeadphonesIcon } from 'lucide-react';
import * as api from '../services/licensingApi';

interface Product {
  id: string;
  name: string;
  code: string;
  shortDescription: string;
  pricing: number;
  category: string;
  features: string[];
}

const categories = [
  { id: 'AI_APPS', name: 'AI Applications', icon: '🤖', color: 'from-cyan-500 to-blue-600' },
  { id: 'TRADING', name: 'Trading Software', icon: '📈', color: 'from-emerald-500 to-teal-600' },
  { id: 'AUTOMATION', name: 'Automation Tools', icon: '⚙️', color: 'from-amber-500 to-orange-600' },
  { id: 'ENTERPRISE', name: 'Enterprise', icon: '🏢', color: 'from-purple-500 to-violet-600' },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts({}).then((data: any) => {
      setFeaturedProducts(data.slice(0, 3));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800" />
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] bg-cyan-400/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-400 text-sm font-medium">Woven Model Product Store</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
              Enterprise Software{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                Built for Scale
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-2xl leading-relaxed">
              Discover Woven Model's suite of professional AI and trading software.
              Instant delivery, automated licensing, and enterprise-grade support.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-8 py-3.5 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2">
                Browse Products <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="border border-gray-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:border-cyan-400 transition-colors">
                Create Account
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Secure</p>
                  <p className="text-gray-500 text-xs">Encrypted payments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Instant</p>
                  <p className="text-gray-500 text-xs">Immediate delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <HeadphonesIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Support</p>
                  <p className="text-gray-500 text-xs">Dedicated team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-cyan-400 font-mono text-sm uppercase tracking-widest mb-3">Products</p>
            <h2 className="text-4xl font-bold text-white mb-4">Featured Software</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Professional tools for traders, developers, and enterprises.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-navy-800/60 rounded-xl p-6 animate-pulse h-64" />
              ))
            ) : (
              featuredProducts.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`} className="group bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                    {product.category === 'TRADING' ? '📈' : '🤖'}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors">{product.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.shortDescription}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">${product.pricing.toFixed(2)}</span>
                    <span className="text-cyan-400 text-sm font-medium flex items-center gap-1">Learn More <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="text-center mt-8">
            <Link to="/products" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-cyan-400 font-mono text-sm uppercase tracking-widest mb-3">Categories</p>
            <h2 className="text-4xl font-bold text-white mb-4">Browse by Category</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.id}`} className="group bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-cyan-500/30 transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-4`}>
                  {cat.icon}
                </div>
                <h3 className="text-white font-semibold text-lg">{cat.name}</h3>
                <p className="text-gray-500 text-sm mt-1">View products →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-2xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">Create your account and start purchasing Woven Model products today. Instant delivery and automated licensing.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-8 py-3.5 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
              Create Free Account <ShoppingCart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
