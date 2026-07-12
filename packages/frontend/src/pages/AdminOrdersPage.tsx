import { useEffect, useState } from 'react';
import { Search, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import * as api from '../services/licensingApi';

interface OrderItem {
  id: string;
  product: { name: string; code: string };
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

interface License {
  id: string;
  licenseKey: string;
  licenseType: string;
  status: string;
}

interface Event {
  id: string;
  eventType: string;
  description: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: { email: string; firstName: string; lastName: string };
  total: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
  payments?: Payment[];
  licenses?: License[];
  events?: Event[];
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-400',
    active: 'bg-green-500/10 text-green-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
    cancelled: 'bg-red-500/10 text-red-400',
    revoked: 'bg-red-500/10 text-red-400',
    confirmed: 'bg-blue-500/10 text-blue-400',
  };
  const cls = colorMap[status] || 'bg-gray-500/10 text-gray-400';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-800/90 backdrop-blur-md border border-white/10 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Order {order.orderNumber}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm uppercase font-medium text-gray-400 mb-2">Items</h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-navy-900/60 rounded-lg p-3">
                  <div>
                    <p className="text-white text-sm font-medium">{item.product.name}</p>
                    <p className="text-gray-400 text-xs">{item.product.code} × {item.quantity}</p>
                  </div>
                  <p className="text-white text-sm font-semibold">${item.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments */}
        {order.payments && order.payments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm uppercase font-medium text-gray-400 mb-2">Payments</h4>
            <div className="space-y-2">
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-navy-900/60 rounded-lg p-3">
                  <div>
                    <p className="text-white text-sm">${p.amount.toFixed(2)} via {p.method}</p>
                    <p className="text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Licenses */}
        {order.licenses && order.licenses.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm uppercase font-medium text-gray-400 mb-2">Licenses</h4>
            <div className="space-y-2">
              {order.licenses.map((l) => (
                <div key={l.id} className="flex items-center justify-between bg-navy-900/60 rounded-lg p-3">
                  <div>
                    <p className="text-white text-sm font-mono">{l.licenseKey.slice(0, 16)}...</p>
                    <p className="text-gray-400 text-xs">{l.licenseType}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Timeline */}
        {order.events && order.events.length > 0 && (
          <div>
            <h4 className="text-sm uppercase font-medium text-gray-400 mb-2">Events</h4>
            <div className="space-y-3">
              {order.events.map((e) => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm">{e.description}</p>
                    <p className="text-gray-500 text-xs">{new Date(e.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
          <span className="text-gray-400">Total</span>
          <span className="text-2xl font-bold text-white">${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    setError('');
    const params: any = { page, limit: 15 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    api.adminGetOrders(params)
      .then((data: any) => {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    api.adminUpdateOrderStatus?.(orderId, newStatus)
      .then(() => fetchOrders())
      .catch((err: Error) => alert(err.message));
  };

  const handleRowClick = (order: Order) => {
    api.getOrder(order.id)
      .then((data: any) => setSelectedOrder(data))
      .catch(() => setSelectedOrder(order));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Orders</h1>

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="glass-card rounded-xl p-4 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-400 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Order # or email..."
              className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-navy-900/60 border border-white/10 rounded-lg py-2 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="bg-navy-900/60 border border-white/10 rounded-lg py-2 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="bg-navy-900/60 border border-white/10 rounded-lg py-2 px-3 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
          />
        </div>

        <button type="submit" className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors">
          Filter
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchOrders} className="mt-2 text-cyan-400 hover:underline text-sm">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && orders.length > 0 && (
        <>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-navy-800/80 text-gray-400 text-sm uppercase">
                    <th className="text-left p-3 font-medium">Order #</th>
                    <th className="text-left p-3 font-medium">Customer</th>
                    <th className="text-center p-3 font-medium">Items</th>
                    <th className="text-right p-3 font-medium">Total</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(order)}
                    >
                      <td className="p-3 text-gray-300 font-medium">{order.orderNumber}</td>
                      <td className="p-3 text-gray-300 text-sm">{order.customer.email}</td>
                      <td className="p-3 text-gray-400 text-center text-sm">{order.items?.length || '-'}</td>
                      <td className="p-3 text-gray-300 text-right">${(order.total || 0).toFixed(2)}</td>
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className="bg-navy-900/80 border border-white/10 rounded text-xs px-2 py-1 text-gray-300 focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-3 text-gray-400 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleRowClick(order)}
                          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-gray-400 text-sm">Showing {orders.length} of {total} orders</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-navy-800/60 border border-white/10 text-gray-300 text-sm disabled:opacity-40 hover:border-cyan-500/30 transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-navy-800/60 border border-white/10 text-gray-300 text-sm disabled:opacity-40 hover:border-cyan-500/30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}