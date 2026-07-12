import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Users, Key, Loader2 } from 'lucide-react';
import * as api from '../services/licensingApi';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalLicenses: number;
  ordersByStatus: { status: string; count: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: { email: string; firstName: string; lastName: string };
    total: number;
    status: string;
    createdAt: string;
  }[];
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.adminGetStats()
      .then((data: any) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-navy-700/50 rounded w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-navy-700/50 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-navy-700/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400 bg-green-500/10' },
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Total Customers', value: stats.totalCustomers.toLocaleString(), icon: Users, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Active Licenses', value: stats.totalLicenses.toLocaleString(), icon: Key, color: 'text-cyan-400 bg-cyan-500/10' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card) => (
          <div key={card.label} className="glass-card rounded-xl p-6 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">{card.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-navy-800/80 text-gray-400 text-sm uppercase">
                <th className="text-left p-3 font-medium">Order #</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-center p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">No recent orders</td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-gray-300">{order.orderNumber}</td>
                    <td className="p-3 text-gray-300">{order.customer.firstName} {order.customer.lastName}<br /><span className="text-xs text-gray-500">{order.customer.email}</span></td>
                    <td className="p-3 text-gray-400 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-gray-300 text-right">${order.total.toFixed(2)}</td>
                    <td className="p-3 text-center"><StatusBadge status={order.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}