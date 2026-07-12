import { useEffect, useState } from 'react';
import { Plus, X, Edit2, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/licensingApi';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = { code: '', description: '', discountType: 'percentage', discountValue: 10, minOrderAmount: '', maxUses: '', expiresAt: '' };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = () => {
    setLoading(true);
    api.adminGetCoupons().then((d: any) => { setCoupons(d || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openAdd = () => { setEditCoupon(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount?.toString() || '',
      maxUses: c.maxUses?.toString() || '',
      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        code: form.code,
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: form.discountValue,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      };
      if (editCoupon) await api.adminUpdateCoupon(editCoupon.id, payload);
      else await api.adminCreateCoupon(payload);
      toast.success(editCoupon ? 'Coupon updated!' : 'Coupon created!');
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try { await api.adminDeleteCoupon(id); toast.success('Coupon deleted'); fetchCoupons(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Coupons</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-4 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No coupons yet</p>
          <button onClick={openAdd} className="mt-4 text-cyan-400 hover:underline text-sm">Create your first coupon</button>
        </div>
      ) : (
        <div className="bg-navy-800/60 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy-800/80">
              <tr className="text-gray-400 text-sm uppercase text-left">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Uses</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3"><span className="text-cyan-400 font-mono font-medium">{c.code}</span>{c.description && <span className="block text-xs text-gray-500">{c.description}</span>}</td>
                  <td className="px-4 py-3 text-gray-300">{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue.toFixed(2)}`}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-navy-800/90 backdrop-blur-md border border-white/10 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{editCoupon ? 'Edit Coupon' : 'Add Coupon'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">Code</label>
                <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}required className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm font-mono" placeholder="SUMMER20" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 focus:outline-none text-sm" placeholder="20% off summer sale" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Type</label>
                  <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 text-sm">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Value</label>
                  <input type="number" step="0.01" min="0" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: parseFloat(e.target.value) || 0 }))} required className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Min Order ($)</label>
                  <input type="number" step="0.01" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Max Uses</label>
                  <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">Expires (optional)</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 px-3 text-gray-300 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 font-semibold text-sm hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Saving...' : editCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
