import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center text-navy-950 font-bold text-xs">WM</div>
              <span className="text-white font-bold text-lg">Woven Model</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Enterprise software and AI solutions for modern businesses. Technology consulting by Jude Yearwood.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-4">Products</h4>
            <ul className="space-y-2.5">
              <li><Link to="/products" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">All Products</Link></li>
              <li><Link to="/products?category=AI_APPS" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">AI Applications</Link></li>
              <li><Link to="/products?category=TRADING" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">Trading Software</Link></li>
              <li><Link to="/products?category=AUTOMATION" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">Automation Tools</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-4">Support</h4>
            <ul className="space-y-2.5">
              <li><a href="mailto:support@wovenmodel.com" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">support@wovenmodel.com</a></li>
              <li><Link to="/portal/dashboard" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">Customer Portal</Link></li>
              <li><a href="https://docs.wovenmodel.com" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">Documentation</a></li>
              <li><Link to="/register" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Woven Model. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
