import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ShoppingCart, ArrowLeft, Download, BookOpen, HelpCircle, Monitor, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/licensingApi';
import { useAuthStore } from '../store/authStore';

interface Product {
  id: string;
  name: string; code: string; shortDescription: string; overview: string;
  pricing: number; category: string; licenseType: string; version: string;
  trialAvailable: boolean; trialDays: number;
  features: string[]; platformSupport: string[]; systemRequirements: any;
  screenshots: string[]; faqs: any[]; documentationUrl: string;
  releaseNotes: any; versionHistory: any;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!id) return;
    api.getProduct(id).then((data: any) => {
      setProduct(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in first'); return; }
    try {
      await api.addToCart(product!.id, qty);
      toast.success('Added to cart!');
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="py-20 text-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!product) return <div className="py-20 text-center text-gray-400">Product not found</div>;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/products" className="inline-flex items-center gap-1 text-gray-400 hover:text-cyan-400 mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-1 rounded">
                {product.category?.replace('_', ' ')}
              </span>
              {product.trialAvailable && (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20">
                  {product.trialDays}-day trial
                </span>
              )}
              <span className="text-xs text-gray-500">v{product.version}</span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
            <p className="text-lg text-gray-400 mb-6">{product.shortDescription}</p>

            {product.overview && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">Overview</h2>
                <p className="text-gray-300 leading-relaxed">{product.overview}</p>
              </div>
            )}

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">Key Features</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {product.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Support */}
            {product.platformSupport?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">Supported Platforms</h2>
                <div className="flex flex-wrap gap-2">
                  {product.platformSupport.map((p, i) => (
                    <span key={i} className="bg-navy-800 border border-navy-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-cyan-400" /> {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* System Requirements */}
            {product.systemRequirements && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">System Requirements</h2>
                <div className="bg-navy-800/60 border border-white/10 rounded-xl p-4 space-y-2">
                  {Object.entries(product.systemRequirements).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-200">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {product.faqs?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-cyan-400" /> FAQs
                </h2>
                <div className="space-y-3">
                  {product.faqs.map((faq, i) => (
                    <details key={i} className="bg-navy-800/60 border border-white/10 rounded-xl">
                      <summary className="px-4 py-3 text-white font-medium cursor-pointer hover:text-cyan-400 transition-colors">
                        {faq.q}
                      </summary>
                      <p className="px-4 pb-3 text-gray-400 text-sm">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Documentation */}
            {product.documentationUrl && (
              <a href={product.documentationUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                <BookOpen className="w-4 h-4" /> View Documentation
              </a>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 sticky top-24">
              <div className="text-3xl font-bold text-white mb-2">${product.pricing.toFixed(2)}</div>
              <p className="text-gray-400 text-sm mb-4 capitalize">{product.licenseType} license</p>

              <div className="flex items-center gap-3 mb-6">
                <label className="text-gray-400 text-sm">Qty:</label>
                <div className="flex items-center bg-navy-700 rounded-lg">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1.5 text-gray-300 hover:text-white">-</button>
                  <span className="px-4 py-1.5 text-white font-medium">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="px-3 py-1.5 text-gray-300 hover:text-white">+</button>
                </div>
              </div>

              <button onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 py-3 rounded-xl font-bold text-lg hover:shadow-glow transition-all flex items-center justify-center gap-2 mb-3">
                <ShoppingCart className="w-5 h-5" /> Add to Cart — ${(product.pricing * qty).toFixed(2)}
              </button>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Instant download</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> License delivered via email</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Secure payment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
