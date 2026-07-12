import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import * as api from '../services/licensingApi';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  orderCount?: number;
  licenseCount?: number;
}

function CustomerDetail({ customer }: { customer: Customer }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.adminGetOrders({ customerId: customer.id, limit: 5 }).then((d: any) => setOrders(d.orders || [])),
      api.adminGetLicenses({ customerId: customer.id, limit: 5 }).then((d: any) => setLicenses(d || [])),
    ]).finally(() => setLoading(false));
  }, [customer.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Orders Section */}
      <div>
        <h4 className="text-sm uppercase font-medium text-gray-400 mb-3">Recent Orders</h4>
        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between bg-navy-900/60 rounded-lg p-3">
                <div>
                  <p className="text-white text-sm font-medium">{o.orderNumber}</p>
                  <p className="text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-white text-sm">${(o.total || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Licenses Section */}
      <div>
        <h4 className="text-sm uppercase font-medium text-gray-400 mb-3">Recent Licenses</h4>
        {licenses.length === 0 ? (
          <p className="text-gray-500 text-sm">No licenses yet</p>
        ) : (
          <div className="space-y-2">
            {licenses.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between bg-navy-900/60 rounded-lg p-3">
                <div>
                  <p className="text-white text-sm font-mono">{l.licenseKey?.slice(0, 16)}...</p>
                  <p className="text-gray-400 text-xs">{l.product?.name || l.productName}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  l.status === 'active' ? 'bg-green-500/10 text-green-400' :
                  l.status === 'revoked' ? 'bg-red-500/10 text-red-400' :
                  'bg-gray-500/10 text-gray-400'
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCustomers = (searchTerm?: string) => {
    setLoading(true);
    setError('');
    const params: any = { page, limit: 15 };
    if (searchTerm) params.search = searchTerm;
    api.adminGetCustomers(params)
      .then((data: any) => {
        setCustomers(data.customers || []);
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
    fetchCustomers(search);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(search);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Customers</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="glass-card rounded-xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
          />
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <button onClick={() => fetchCustomers(search)} className="mt-2 text-cyan-400 hover:underline text-sm">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && customers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No customers found</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && customers.length > 0 && (
        <>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-navy-800/80 text-gray-400 text-sm uppercase">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Company</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-center p-3 font-medium">Orders</th>
                    <th className="text-center p-3 font-medium">Licenses</th>
                    <th className="text-left p-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <>
                      <tr
                        key={customer.id}
                        className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(customer.id)}
                      >
                        <td className="p-3 text-gray-300 font-medium">
                          {customer.firstName} {customer.lastName}
                        </td>
                        <td className="p-3 text-gray-400 text-sm">{customer.email}</td>
                        <td className="p-3 text-gray-400 text-sm">{customer.company || '-'}</td>
                        <td className="p-3 text-gray-400 text-sm capitalize">{customer.role}</td>
                        <td className="p-3 text-gray-300 text-center">{customer.orderCount || 0}</td>
                        <td className="p-3 text-gray-300 text-center">{customer.licenseCount || 0}</td>
                        <td className="p-3 text-gray-400 text-sm">{new Date(customer.createdAt).toLocaleDateString()}</td>
                      </tr>
                      {expandedId === customer.id && (
                        <tr key={`${customer.id}-detail`}>
                          <td colSpan={7} className="p-4 bg-navy-900/40 border-t border-white/5">
                            <CustomerDetail customer={customer} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-gray-400 text-sm">Showing {customers.length} of {total} customers</p>
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
    </div>
  );
}