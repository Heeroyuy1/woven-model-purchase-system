import { create } from 'zustand';
import * as licensingApi from '@/services/licensingApi';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, qty?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const data = await licensingApi.getCart() as { items: CartItem[] };
      set({ items: data.items || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addItem: async (productId: string, qty = 1) => {
    set({ loading: true });
    try {
      await licensingApi.addToCart(productId, qty);
      const data = await licensingApi.getCart() as { items: CartItem[] };
      set({ items: data.items || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  removeItem: async (productId: string) => {
    set({ loading: true });
    try {
      await licensingApi.removeFromCart(productId);
      const data = await licensingApi.getCart() as { items: CartItem[] };
      set({ items: data.items || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  clearCart: async () => {
    set({ loading: true });
    try {
      await licensingApi.clearCart();
      set({ items: [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  subtotal: () => {
    return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  },
}));