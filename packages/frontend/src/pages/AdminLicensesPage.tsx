import { useEffect, useState } from 'react';
import { Plus, X, Loader2, AlertTriangle } from 'lucide-react';
import * as api from '../services/licensingApi';

interface Product {
  id: string;
  name: string;
  code: string;
}

interface License {
  id: string;
  licenseKey: string;
  licenseType: string;
  status: string;
  activationLimit?: number;
  perpetual?: boolean;
  createdAt: string;
  product?: { name: string; code: string };
  customer?: { email: string; firstName: string; lastName: string };
  order?: { orderNumber: string };
  expiresAt?: string;
}

const licenseTypes = ['perpetual', 'subscription', 'trial', 'enterprise'];

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    completed: 'bg-green-500/10 text-green-400',
    revoked: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-red-500/10 text-red-400',
    expired: 'bg-yellow-500/10 text-yellow-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
  };
  const cls = colorMap[status] || 'bg-gray-500/10 text-gray-400';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function GenerateLicenseModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    customerEmail: '',
    licenseType: 'perpetual',
    maxActivations: 1,
    expirationDays: 365,
    perpetual: true,
  });

  useEffect(() => {
    api.adminGetProducts()
      .then((data: any) => {
        setProducts(data || []);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        productId: form.productId,
        customerEmail: form.customerEmail,
        licenseType: form.licenseType,
      };
      if (form.perpetual) {
        payload.perpetual = true;
      } else {
        payload.maxActivations = form.maxActivations;
        payload.expirationDays = form.expirationDays;
      }
      await api.adminGenerateLicense(payload);
      onGenerated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to generate license');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-800/90 backdrop-blur-md border border-white/10 rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Generate License</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Product</label>
            {loadingProducts ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-gray-400 text-sm">Loading products...</span>
              </div>
            ) : (
              <select
                value={form.productId}
                onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                required
                className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
              >
                <option value="">Select product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Customer Email</label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
              required
              placeholder="customer@example.com"
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">License Type</label>
            <select
              value={form.licenseType}
              onChange={e => setForm(f => ({ ...f, licenseType: e.target.value }))}
              required
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
            >
              {licenseTypes.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="perpetual"
              checked={form.perpetual}
              onChange={e => setForm(f => ({ ...f, perpetual: e.target.checked }))}
              className="rounded border-white/20 bg-navy-900/60 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="perpetual" className="text-gray-300 text-sm">Perpetual (no expiration)</label>
          </div>

          {!form.perpetual && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">Max Activations</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxActivations}
                  onChange={e => setForm(f => ({ ...f, maxActivations: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">Expiration (days)</label>
                <input
                  type="number"
                  min={1}
                  value={form.expirationDays}
                  onChange={e => setForm(f => ({ ...f, expirationDays: parseInt(e.target.value) || 365 }))}
                  className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
              </div>
            </div>
          )}

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
              disabled={saving || loadingProducts}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {saving ? 'Generating...' : 'Generate License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLicenses = () => {
    setLoading(true);
    setError('');
    api.adminGetLicenses()
      .then((data: any) => {
        setLicenses(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleRevoke = (license: License) => {
    if (!window.confirm(`Are you sure you want to revoke license ${license.licenseKey.slice(0, 16)}...?`)) return;
    api.adminRevokeLicense(license.id)
      .then(() => {
        showToast('License revoked successfully', 'success');
        fetchLicenses();
      })
      .catch((err: Error) => showToast(err.message || 'Failed to revoke license', 'error'));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Licenses</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-4 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Generate License
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchLicenses} className="mt-2 text-cyan-400 hover:underline text-sm">Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && licenses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No licenses found</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-cyan-400 hover:underline text-sm">Generate your first license</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && licenses.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-navy-800/80 text-gray-400 text-sm uppercase">
                  <th className="text-left p-3 font-medium">License Key</th>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-gray-300 font-mono text-sm">{license.licenseKey?.slice(0, 20)}...</td>
                    <td className="p-3 text-gray-400 text-sm">{license.product?.name || '-'}</td>
                    <td className="p-3 text-gray-400 text-sm">
                      {license.customer ? `${license.customer.firstName} ${license.customer.lastName}` : '-'}
                      {license.customer?.email && <span className="text-xs text-gray-500 block">{license.customer.email}</span>}
                    </td>
                    <td className="p-3 text-gray-400 text-sm capitalize">{license.licenseType}</td>
                    <td className="p-3 text-center"><StatusBadge status={license.status} /></td>
                    <td className="p-3 text-gray-400 text-sm">{new Date(license.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-center">
                      {license.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevoke(license)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors flex items-center gap-1 mx-auto"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate License Modal */}
      {showModal && (
        <GenerateLicenseModal
          onClose={() => setShowModal(false)}
          onGenerated={() => showToast('License generated successfully', 'success')}
        />
      )}
    </div>
  );
}