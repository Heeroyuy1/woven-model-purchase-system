import { useEffect, useState } from 'react';
import { Plus, X, Edit2, Loader2 } from 'lucide-react';
import * as api from '../services/licensingApi';

interface Product {
  id: string;
  name: string;
  code: string;
  pricing: number;
  category: string;
  licenseType: string;
  status: string;
  shortDescription?: string;
  features?: string[];
  platformSupport?: string[];
  createdAt?: string;
}

const categories = ['AI_APPS', 'TRADING', 'AUTOMATION', 'ENTERPRISE'];
const licenseTypes = ['perpetual', 'subscription', 'trial', 'enterprise'];

interface ProductFormData {
  name: string;
  code: string;
  shortDescription: string;
  pricing: number;
  category: string;
  licenseType: string;
  features: string;
  platformSupport: string;
}

const emptyForm: ProductFormData = {
  name: '',
  code: '',
  shortDescription: '',
  pricing: 0,
  category: '',
  licenseType: '',
  features: '[]',
  platformSupport: '[]',
};

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    inactive: 'bg-red-500/10 text-red-400',
  };
  const cls = colorMap[status] || 'bg-gray-500/10 text-gray-400';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product?: Product | null;
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<ProductFormData>(() => {
    if (product) {
      return {
        name: product.name,
        code: product.code,
        shortDescription: product.shortDescription || '',
        pricing: product.pricing,
        category: product.category,
        licenseType: product.licenseType,
        features: Array.isArray(product.features) ? JSON.stringify(product.features) : '[]',
        platformSupport: Array.isArray(product.platformSupport) ? JSON.stringify(product.platformSupport) : '[]',
      };
    }
    return { ...emptyForm };
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-800/90 backdrop-blur-md border border-white/10 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Code</label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              required
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Short Description</label>
            <textarea
              value={form.shortDescription}
              onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
              rows={3}
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.pricing}
              onChange={e => setForm(f => ({ ...f, pricing: parseFloat(e.target.value) || 0 }))}
              required
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                required
                className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
              >
                <option value="">Select...</option>
                {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase mb-1">License Type</label>
              <select
                value={form.licenseType}
                onChange={e => setForm(f => ({ ...f, licenseType: e.target.value }))}
                required
                className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
              >
                <option value="">Select...</option>
                {licenseTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Features (JSON array)</label>
            <textarea
              value={form.features}
              onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              rows={3}
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm font-mono text-xs resize-none"
              placeholder='["Feature 1", "Feature 2"]'
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Platform Support (JSON array)</label>
            <textarea
              value={form.platformSupport}
              onChange={e => setForm(f => ({ ...f, platformSupport: e.target.value }))}
              rows={2}
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm font-mono text-xs resize-none"
              placeholder='["Windows", "macOS", "Linux"]'
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    api.adminGetProducts()
      .then((data: any) => {
        setProducts(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (form: ProductFormData) => {
    const payload: any = {
      name: form.name,
      code: form.code,
      shortDescription: form.shortDescription,
      pricing: form.pricing,
      category: form.category,
      licenseType: form.licenseType,
    };
    try {
      payload.features = JSON.parse(form.features);
    } catch { payload.features = []; }
    try {
      payload.platformSupport = JSON.parse(form.platformSupport);
    } catch { payload.platformSupport = []; }

    if (editProduct) {
      await api.adminUpdateProduct(editProduct.id, payload);
    } else {
      await api.adminCreateProduct(payload);
    }
    setShowModal(false);
    setEditProduct(null);
    fetchProducts();
  };

  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    api.adminUpdateProduct(product.id, { status: newStatus })
      .then(() => fetchProducts())
      .catch((err: Error) => alert(err.message));
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditProduct(null);
    setShowModal(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Products</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-4 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchProducts} className="mt-2 text-cyan-400 hover:underline text-sm">Retry</button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
          <button onClick={handleAdd} className="mt-4 text-cyan-400 hover:underline text-sm">Add your first product</button>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-navy-800/80 text-gray-400 text-sm uppercase">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">License Type</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-gray-300 font-medium">{product.name}</td>
                    <td className="p-3 text-gray-400 font-mono text-sm">{product.code}</td>
                    <td className="p-3 text-gray-300 text-right">${(product.pricing || 0).toFixed(2)}</td>
                    <td className="p-3 text-gray-400 text-sm">{product.category.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-gray-400 text-sm">{product.licenseType.charAt(0).toUpperCase() + product.licenseType.slice(1)}</td>
                    <td className="p-3 text-center"><StatusBadge status={product.status || 'active'} /></td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            product.status === 'active'
                              ? 'text-red-400 border-red-500/30 hover:bg-red-500/10'
                              : 'text-green-400 border-green-500/30 hover:bg-green-500/10'
                          }`}
                        >
                          {product.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}