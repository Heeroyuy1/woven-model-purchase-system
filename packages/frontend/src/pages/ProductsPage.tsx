import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, ShoppingCart, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/licensingApi';
import { useAuthStore } from '../store/authStore';

interface Product {
  id: string;
  name: string;
  code: string;
  shortDescription: string;
  overview: string;
  pricing: number;
  category: string;
  licenseType: string;
  features: string[];
  version: string;
  trialAvailable: boolean;
}

const categories = [
  { value: 'all', label: 'All Products' },
  { value: 'AI_APPS', label: 'AI Applications' },
  { value: 'TRADING', label: 'Trading Software' },
  { value: 'AUTOMATION', label: 'Automation Tools' },
  { value: 'ENTERPRISE', label: 'Enterprise Solutions' },
  { value: 'UTILITIES', label: 'Utilities' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (category !== 'all') params.category = category;
    if (search) params.search = search;

    api.getProducts(params).then((data: any) => {
      setProducts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category, search]);

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    try {
      await api.addToCart(productId, 1);
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Products</h1>
          <p className="text-gray-400">Browse our complete catalog of professional software.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-10 pr-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat.value
                    ? 'bg-cyan-500 text-navy-950'
                    : 'bg-navy-800 text-gray-400 hover:text-white border border-navy-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-navy-800/60 rounded-xl p-6 animate-pulse h-72" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="group bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                    {product.category?.replace('_', ' ')}
                  </span>
                  {product.trialAvailable && (
                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                      Trial
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.shortDescription}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {product.features?.slice(0, 3).map((f, i) => (
                    <span key={i} className="text-xs bg-navy-700 text-gray-400 px-2 py-0.5 rounded">
                      {f.length > 25 ? f.substring(0, 25) + '...' : f}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                  <span className="text-2xl font-bold text-white">${product.pricing.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <Link to={`/products/${product.id}`} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button onClick={() => handleAddToCart(product.id)} className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-glow transition-all">
                      <ShoppingCart className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
