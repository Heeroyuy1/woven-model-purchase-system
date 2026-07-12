import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Key, User, ShoppingBag, ArrowRight, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import * as api from '../services/licensingApi';

interface Order {
  id: string; orderNumber: string; status: string; total: number; createdAt: string;
  items: Array<{ id: string; productName: string }>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [licenseCount, setLicenseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOrders().then((data: any) => setOrders(data || [])).catch(() => {}),
      api.getUserLicenses().then((data: any) => setLicenseCount(data?.length || 0)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { completed: 'text-green-400 bg-green-500/10', confirmed: 'text-blue-400 bg-blue-500/10', cancelled: 'text-red-400 bg-red-500/10', pending: 'text-yellow-400 bg-yellow-500/10' };
    const cls = colors[status] || 'text-gray-400 bg-gray-500/10';
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome, {user?.firstName} 👋</h1>
          <p className="text-gray-400 mt-1">Manage your products, licenses, and account settings.</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <Package className="w-5 h-5 text-cyan-400" />
              <span className="text-2xl font-bold text-white">{loading ? '...' : orders.length}</span>
            </div>
            <p className="text-gray-500 text-sm">Total Orders</p>
          </div>
          <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <Key className="w-5 h-5 text-cyan-400" />
              <span className="text-2xl font-bold text-white">{loading ? '...' : licenseCount}</span>
            </div>
            <p className="text-gray-500 text-sm">Active Licenses</p>
          </div>
          <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <User className="w-5 h-5 text-cyan-400" />
              <span className="text-lg font-bold text-white capitalize">{user?.role || 'customer'}</span>
            </div>
            <p className="text-gray-500 text-sm">Account Type</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/portal/orders" className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all group">
            <Package className="w-6 h-6 text-cyan-400 mb-2" />
            <p className="text-white font-semibold">My Orders</p>
            <p className="text-gray-500 text-xs mt-1 group-hover:text-cyan-400 transition-colors">View order history →</p>
          </Link>
          <Link to="/portal/licenses" className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all group">
            <Key className="w-6 h-6 text-cyan-400 mb-2" />
            <p className="text-white font-semibold">My Licenses</p>
            <p className="text-gray-500 text-xs mt-1 group-hover:text-cyan-400 transition-colors">View license keys →</p>
          </Link>
          <Link to="/portal/profile" className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all group">
            <User className="w-6 h-6 text-cyan-400 mb-2" />
            <p className="text-white font-semibold">Profile</p>
            <p className="text-gray-500 text-xs mt-1 group-hover:text-cyan-400 transition-colors">Manage settings →</p>
          </Link>
          <Link to="/products" className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all group">
            <ShoppingBag className="w-6 h-6 text-cyan-400 mb-2" />
            <p className="text-white font-semibold">Browse Products</p>
            <p className="text-gray-500 text-xs mt-1 group-hover:text-cyan-400 transition-colors">Shop now →</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
            <Link to="/portal/orders" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-navy-700/50 rounded-lg" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No orders yet</p>
              <Link to="/products" className="text-cyan-400 text-sm hover:text-cyan-300 mt-2 inline-block">Browse products →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((order) => (
                <Link key={order.id} to={`/portal/orders`} className="flex items-center justify-between bg-navy-900/40 rounded-lg p-3 hover:bg-navy-900/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-white font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} — {order.items?.length || 0} item(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white font-medium">${order.total.toFixed(2)}</span>
                    {statusBadge(order.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
