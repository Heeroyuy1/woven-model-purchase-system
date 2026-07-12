import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ShoppingBag } from 'lucide-react';
import * as api from '../services/licensingApi';

interface Order {
  id: string; orderNumber: string; status: string; total: number; subtotal: number;
  taxAmount: number; discountAmount: number; paidAt: string;
  items: Array<{ id: string; productName: string; productCode: string; quantity: number; unitPrice: number; totalPrice: number }>;
  licenses?: Array<{ id: string; licenseKey: string; product: { name: string } }>;
}

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getOrder(id).then((data: any) => {
      setOrder(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 text-center"><div className="animate-pulse text-gray-400">Loading order...</div></div>;
  if (!order) return <div className="py-20 text-center text-gray-400">Order not found</div>;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
          <p className="text-gray-400">Thank you for your purchase. Your order has been confirmed.</p>
        </div>

        <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-lg font-bold text-white font-mono">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-white">{order.paidAt ? new Date(order.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table className="w-full mb-4">
            <thead>
              <tr className="text-gray-500 text-sm uppercase">
                <th className="text-left py-2">Product</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="py-3 text-white">{item.productName}</td>
                  <td className="py-3 text-center text-gray-400">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-400">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 text-right text-white font-medium">${item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1.5 text-sm pt-3 border-t border-white/10">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span>-${order.discountAmount.toFixed(2)}</span></div>}
            {order.taxAmount > 0 && <div className="flex justify-between text-gray-400"><span>Tax</span><span>${order.taxAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-lg font-bold text-white pt-2"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Licenses */}
        {order.licenses && order.licenses.length > 0 && (
          <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">License Keys</h2>
            <div className="space-y-3">
              {order.licenses.map((lic) => (
                <div key={lic.id} className="bg-navy-900/60 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{lic.product?.name || 'Product'}</p>
                    <p className="font-mono text-gray-200 text-sm">{lic.licenseKey.length > 20 ? `${lic.licenseKey.substring(0, 12)}...${lic.licenseKey.slice(-4)}` : lic.licenseKey}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(lic.licenseKey); }} className="text-xs text-cyan-400 hover:text-cyan-300">
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Link to="/portal/orders" className="flex items-center gap-2 bg-navy-800 border border-navy-600 text-white px-6 py-3 rounded-xl font-semibold hover:border-cyan-500 transition-colors">
            <Package className="w-4 h-4" /> View My Orders
          </Link>
          <Link to="/products" className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-6 py-3 rounded-xl font-semibold hover:shadow-glow transition-all">
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
