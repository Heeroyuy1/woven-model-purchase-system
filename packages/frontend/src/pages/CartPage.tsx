import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function CartPage() {
  const { items, loading, fetchCart, removeItem, clearCart, addItem, itemCount, subtotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, fetchCart]);

  if (!isAuthenticated) {
    return (
      <div className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to view your cart</h1>
          <p className="text-gray-400 mb-6">Please sign in or create an account to start shopping.</p>
          <Link to="/login" className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-6 py-3 rounded-xl font-bold inline-block">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart ({itemCount()} items)</h1>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-navy-800/60 rounded-xl h-24" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Looks like you haven't added any products yet.</p>
            <Link to="/products" className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="bg-navy-800/60 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-navy-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.productId}`} className="text-white font-semibold hover:text-cyan-400 transition-colors">{item.productName}</Link>
                    <p className="text-cyan-400 font-bold mt-1">${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => addItem(item.productId, -1)} className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center text-gray-300 hover:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                    <button onClick={() => addItem(item.productId, 1)} className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center text-gray-300 hover:text-white"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-white font-bold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                  </div>
                  <button onClick={() => { removeItem(item.productId); toast.success('Removed from cart'); }} className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <div className="flex justify-between pt-4">
                <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-400 transition-colors">Clear Cart</button>
                <Link to="/products" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Continue Shopping</Link>
              </div>
            </div>

            <div className="bg-navy-800/60 border border-white/10 rounded-xl p-6 h-fit">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-400"><span>Subtotal ({itemCount()} items)</span><span>${subtotal().toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-400"><span>Discount</span><span className="text-green-400">-$0.00</span></div>
                <div className="flex justify-between text-gray-400"><span>Tax</span><span>$0.00</span></div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-bold text-white"><span>Total</span><span>${subtotal().toFixed(2)}</span></div>
              </div>
              <Link to="/checkout" className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 py-3 rounded-xl font-bold text-center block hover:shadow-glow transition-all">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
