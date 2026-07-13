import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, Key, Package, Users, BarChart3, Tag } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setProfileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-navy-900/85 backdrop-blur-xl border-b border-white/10 h-[72px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-xl">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center text-navy-950 font-bold text-sm">
            WM
          </div>
          Woven Model
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="https://wovenmodel.com" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
            Home
          </a>
          <Link to="/products" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
            Products
          </Link>
          <Link to="/cart" className="text-gray-300 hover:text-white transition-colors relative text-sm font-medium">
            <ShoppingCart className="w-5 h-5" />
            {itemCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-cyan-500 text-navy-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount()}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm">{user?.firstName}</span>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-navy-800 border border-white/10 rounded-xl shadow-xl z-20 py-2">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-sm text-white font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    {isAdmin && (
                      <>
                        <div className="px-4 py-1.5 text-xs text-gray-600 uppercase tracking-wider font-semibold">Admin</div>
                        <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-cyan-400" /> Dashboard
                        </Link>
                        <Link to="/admin/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                          <Package className="w-4 h-4 text-cyan-400" /> Orders
                        </Link>
                        <Link to="/admin/products" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                          <Package className="w-4 h-4 text-cyan-400" /> Products
                        </Link>
                        <Link to="/admin/customers" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                          <Users className="w-4 h-4 text-cyan-400" /> Customers
                        </Link>
                        <Link to="/admin/licenses" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                          <Key className="w-4 h-4 text-cyan-400" /> Licenses
                        </Link>
                        <Link to="/admin/reports" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                          <BarChart3 className="w-4 h-4 text-cyan-400" /> Reports
                        </Link>
                        <Link to="/admin/coupons" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                          <Tag className="w-4 h-4 text-cyan-400" /> Coupons
                        </Link>
                        <div className="border-t border-white/10 my-1" />
                      </>
                    )}
                    <Link to="/portal/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                    </Link>
                    <Link to="/portal/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Package className="w-4 h-4 text-gray-400" /> My Orders
                    </Link>
                    <Link to="/portal/licenses" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Key className="w-4 h-4 text-gray-400" /> My Licenses
                    </Link>
                    <div className="border-t border-white/10 mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 w-full transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
                Sign In
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-glow transition-all">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-900/98 backdrop-blur-xl border-t border-white/10 absolute top-[72px] left-0 w-full">
          <div className="px-4 py-4 space-y-3">
            <a href="https://wovenmodel.com" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-300 hover:text-white font-medium">← Home</a>
            <Link to="/products" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-300 hover:text-white">Products</Link>
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-300 hover:text-white">Cart ({itemCount()})</Link>
            {isAuthenticated ? (
              <>
                <Link to="/portal/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-300 hover:text-white">Dashboard</Link>
                <Link to="/portal/orders" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-300 hover:text-white">Orders</Link>
                <Link to="/portal/licenses" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-300 hover:text-white">Licenses</Link>
                {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-cyan-400 font-medium">Admin</Link>}
                <button onClick={handleLogout} className="block py-2 text-red-400 w-full text-left">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-300 hover:text-white">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-cyan-400 font-medium">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
