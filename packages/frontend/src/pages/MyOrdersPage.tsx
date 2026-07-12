import { useEffect, useState } from 'react';
import { Package, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/licensingApi';

interface OrderItem {
  id: string; productName: string; productCode: string; quantity: number; unitPrice: number; totalPrice: number;
}

interface Order {
  id: string; orderNumber: string; status: string; total: number; subtotal: number;
  taxAmount: number; discountAmount: number; createdAt: string;
  items: OrderItem[];
  licenses?: Array<{ id: string; licenseKey: string }>;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.getOrders().then((data: any) => {
      setOrders(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const badge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'text-green-400 bg-green-500/10', confirmed: 'text-blue-400 bg-blue-500/10',
      cancelled: 'text-red-400 bg-red-500/10', pending: 'text-yellow-400 bg-yellow-500/10',
      refunded: 'text-orange-400 bg-orange-500/10', processing: 'text-cyan-400 bg-cyan-500/10',
    };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'text-gray-400 bg-gray-500/10'}`}>{status}</span>;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-navy-800/60 rounded-xl h-20 animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h2 className="text-xl text-white mb-2">No orders yet</h2>
            <p className="text-gray-400">When you make a purchase, your orders will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <Package className="w-5 h-5 text-gray-500" />
                    <div className="text-left">
                      <p className="text-white font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} — {order.items.length} item(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-bold">${order.total.toFixed(2)}</span>
                    {badge(order.status)}
                    {expanded === order.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </button>

                {expanded === order.id && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-3">
                    <table className="w-full mb-3">
                      <thead className="text-gray-500 text-xs uppercase"><tr><th className="text-left py-1">Product</th><th className="text-center py-1">Qty</th><th className="text-right py-1">Price</th><th className="text-right py-1">Total</th></tr></thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id} className="border-t border-white/5">
                            <td className="py-2 text-gray-300 text-sm">{item.productName}</td>
                            <td className="py-2 text-center text-gray-400 text-sm">{item.quantity}</td>
                            <td className="py-2 text-right text-gray-400 text-sm">${item.unitPrice.toFixed(2)}</td>
                            <td className="py-2 text-right text-white text-sm">${item.totalPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-right text-sm space-y-1">
                      <div className="flex justify-end gap-4 text-gray-400"><span>Subtotal</span><span className="w-20 text-right">${order.subtotal.toFixed(2)}</span></div>
                      {order.taxAmount > 0 && <div className="flex justify-end gap-4 text-gray-400"><span>Tax</span><span className="w-20 text-right">${order.taxAmount.toFixed(2)}</span></div>}
                      <div className="flex justify-end gap-4 text-white font-bold"><span>Total</span><span className="w-20 text-right">${order.total.toFixed(2)}</span></div>
                    </div>

                    {order.licenses && order.licenses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-500 mb-2">License Keys</p>
                        {order.licenses.map((lic) => (
                          <div key={lic.id} className="flex items-center justify-between bg-navy-900/40 rounded px-3 py-1.5 mb-1">
                            <code className="text-xs text-cyan-400">{lic.licenseKey.substring(0, 16)}...</code>
                            <button onClick={() => { navigator.clipboard.writeText(lic.licenseKey); toast.success('Copied!'); }} className="text-xs text-gray-500 hover:text-cyan-400">Copy</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
