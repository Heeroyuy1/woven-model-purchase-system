import { useEffect, useState } from 'react';
import { Key, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/licensingApi';

interface License {
  id: string; licenseKey: string; licenseType: string; status: string;
  activationLimit: number; currentActivations: number; perpetual: boolean;
  expirationDate: string | null; createdAt: string;
  product: { id: string; name: string; code: string; version: string };
}

export default function MyLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUserLicenses().then((data: any) => {
      setLicenses(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('License key copied!');
  };

  const statusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === 'expired' || status === 'revoked') return <XCircle className="w-5 h-5 text-red-400" />;
    return <Clock className="w-5 h-5 text-yellow-400" />;
  };

  const badge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'text-green-400 bg-green-500/10', expired: 'text-red-400 bg-red-500/10',
      revoked: 'text-red-400 bg-red-500/10', pending: 'text-yellow-400 bg-yellow-500/10',
      suspended: 'text-orange-400 bg-orange-500/10',
    };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'text-gray-400 bg-gray-500/10'}`}>{status}</span>;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Licenses</h1>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="bg-navy-800/60 rounded-xl h-40 animate-pulse" />)}</div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-20">
            <Key className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h2 className="text-xl text-white mb-2">No licenses yet</h2>
            <p className="text-gray-400">When you purchase a product, your license keys will appear here.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {licenses.map((lic) => (
              <div key={lic.id} className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lic.status === 'active' ? 'bg-green-500/10' : lic.status === 'expired' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                      {statusIcon(lic.status)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{lic.product?.name}</p>
                      <p className="text-xs text-gray-500">v{lic.product?.version}</p>
                    </div>
                  </div>
                  {badge(lic.status)}
                </div>

                <div className="bg-navy-900/60 rounded-lg px-3 py-2 flex items-center justify-between mb-3">
                  <code className="text-sm text-cyan-400 font-mono">
                    {lic.licenseKey.length > 16 ? `${lic.licenseKey.substring(0, 12)}...${lic.licenseKey.slice(-4)}` : lic.licenseKey}
                  </code>
                  <button onClick={() => copyKey(lic.licenseKey)} className="text-gray-500 hover:text-cyan-400 transition-colors" title="Copy license key">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div><span className="text-gray-600">Type:</span> <span className="text-gray-300 capitalize">{lic.licenseType}</span></div>
                  <div><span className="text-gray-600">Activations:</span> <span className="text-gray-300">{lic.currentActivations}/{lic.activationLimit}</span></div>
                  <div><span className="text-gray-600">Perpetual:</span> <span className="text-gray-300">{lic.perpetual ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-gray-600">Issued:</span> <span className="text-gray-300">{new Date(lic.createdAt).toLocaleDateString()}</span></div>
                  {lic.expirationDate && <div className="col-span-2"><span className="text-gray-600">Expires:</span> <span className="text-gray-300">{new Date(lic.expirationDate).toLocaleDateString()}</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
