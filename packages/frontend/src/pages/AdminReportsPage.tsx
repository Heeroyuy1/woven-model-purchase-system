import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Key } from 'lucide-react';
import * as api from '../services/licensingApi';

type Tab = 'sales' | 'products' | 'licenses';

interface SalesRow { period: string; revenue: number; count: number; }
interface ProductRow { productName: string; productCode: string; totalRevenue: number; totalQuantity: number; orderCount: number; }
interface LicenseReport { totalLicenses: number; byStatus: { status: string; count: number }[]; byType: { type: string; count: number }[]; last30Days: number; }

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [salesPeriod, setSalesPeriod] = useState('monthly');
  const [salesData, setSalesData] = useState<SalesRow[]>([]);
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesOrders, setSalesOrders] = useState(0);
  const [productData, setProductData] = useState<ProductRow[]>([]);
  const [licenseReport, setLicenseReport] = useState<LicenseReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === 'sales') {
      api.adminGetSalesReport({ period: salesPeriod }).then((r: any) => {
        setSalesData(r.sales || []); setSalesTotal(r.totalRevenue || 0); setSalesOrders(r.totalOrders || 0);
      }).catch(() => {}).finally(() => setLoading(false));
    } else if (tab === 'products') {
      api.adminGetProductReport().then((r: any) => setProductData(r || [])).catch(() => {}).finally(() => setLoading(false));
    } else {
      api.adminGetLicenseReport().then((r: any) => setLicenseReport(r)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab, salesPeriod]);

  const tabs = [
    { id: 'sales' as Tab, label: 'Sales', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'products' as Tab, label: 'Products', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'licenses' as Tab, label: 'Licenses', icon: <Key className="w-5 h-5" /> },
  ];

  const maxRevenue = Math.max(...salesData.map(s => s.revenue), 1);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Reports</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-cyan-500 text-navy-950' : 'bg-navy-800 text-gray-400 hover:text-white border border-navy-600'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="bg-navy-800/60 rounded-xl h-16" />)}</div>
        ) : (
          <>
            {/* Sales */}
            {tab === 'sales' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <select value={salesPeriod} onChange={(e) => setSalesPeriod(e.target.value)}
                    className="bg-navy-800 border border-navy-600 text-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-navy-800/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-1"><DollarSign className="w-4 h-4" /><span className="text-lg font-bold">${(salesTotal || 0).toLocaleString()}</span></div>
                    <p className="text-gray-500 text-xs">Total Revenue</p>
                  </div>
                  <div className="bg-navy-800/60 border border-white/10 rounded-xl p-4">
                    <div className="text-lg font-bold text-white mb-1">{salesOrders}</div>
                    <p className="text-gray-500 text-xs">Total Orders</p>
                  </div>
                  <div className="bg-navy-800/60 border border-white/10 rounded-xl p-4">
                    <div className="text-lg font-bold text-white mb-1">${salesOrders > 0 ? (salesTotal / salesOrders).toFixed(2) : '0.00'}</div>
                    <p className="text-gray-500 text-xs">Avg Order Value</p>
                  </div>
                </div>

                <div className="bg-navy-800/60 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-navy-800/80"><tr className="text-gray-400 text-sm uppercase text-left"><th className="px-4 py-3">Period</th><th className="px-4 py-3 text-right">Revenue</th><th className="px-4 py-3 text-right">Orders</th><th className="px-4 py-3 hidden md:table-cell">Bar</th></tr></thead>
                    <tbody>
                      {salesData.map((row) => (
                        <tr key={row.period} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3 text-gray-300">{row.period}</td>
                          <td className="px-4 py-3 text-right text-white font-medium">${(row.revenue || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-400">{row.count}</td>
                          <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-cyan-500/20 rounded" style={{ width: `${(row.revenue / maxRevenue) * 100}%`, maxWidth: '300px' }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {salesData.length === 0 && <p className="text-center text-gray-500 py-8">No sales data</p>}
                </div>
              </div>
            )}

            {/* Products */}
            {tab === 'products' && (
              <div className="bg-navy-800/60 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-navy-800/80"><tr className="text-gray-400 text-sm uppercase text-left"><th className="px-4 py-3">Product</th><th className="px-4 py-3">Code</th><th className="px-4 py-3 text-right">Revenue</th><th className="px-4 py-3 text-right">Sold</th><th className="px-4 py-3 text-right">Orders</th></tr></thead>
                  <tbody>
                    {productData.map((row) => (
                      <tr key={row.productCode} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-gray-300">{row.productName}</td>
                        <td className="px-4 py-3 text-gray-500 text-sm font-mono">{row.productCode}</td>
                        <td className="px-4 py-3 text-right text-white font-medium">${(row.totalRevenue || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{row.totalQuantity}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{row.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {productData.length === 0 && <p className="text-center text-gray-500 py-8">No product data</p>}
              </div>
            )}

            {/* Licenses */}
            {tab === 'licenses' && licenseReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-navy-800/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-cyan-400 mb-1"><Key className="w-4 h-4" /><span className="text-2xl font-bold">{licenseReport.totalLicenses}</span></div>
                    <p className="text-gray-500 text-xs">Total Licenses</p>
                  </div>
                  <div className="bg-navy-800/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-1"><span className="text-2xl font-bold">{licenseReport.last30Days}</span></div>
                    <p className="text-gray-500 text-xs">Last 30 Days</p>
                  </div>
                  <div className="bg-navy-800/60 border border-white/10 rounded-xl p-4">
                    <div className="flex flex-wrap gap-2">
                      {licenseReport.byType.map(t => (
                        <span key={t.type} className="text-xs bg-navy-700 px-2 py-1 rounded text-gray-300">{t.type}: {t.count}</span>
                      ))}
                    </div>
                    <p className="text-gray-500 text-xs mt-2">By Type</p>
                  </div>
                </div>

                <div className="bg-navy-800/60 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">By Status</h3>
                  <div className="space-y-3">
                    {licenseReport.byStatus.map(s => {
                      const total = licenseReport.totalLicenses || 1;
                      const pct = (s.count / total) * 100;
                      const colors: Record<string, string> = { active: 'bg-green-500', expired: 'bg-red-500', revoked: 'bg-red-500', pending: 'bg-yellow-500' };
                      return (
                        <div key={s.status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400 capitalize">{s.status}</span>
                            <span className="text-white font-medium">{s.count} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-navy-900 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colors[s.status] || 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
