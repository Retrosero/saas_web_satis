import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  code: string;
  name: string;
  price: number;
  vatRate: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  notes: string;
  add: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  update: (productId: string, patch: Partial<CartItem>) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
  totalItems: number;
  subTotal: number;
  vatTotal: number;
  grandTotal: number;
}

export const usePortalCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notes: '',
      add: (item) => {
        const items = [...get().items];
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          existing.quantity += item.quantity ?? 1;
        } else {
          items.push({ ...item, quantity: item.quantity ?? 1 });
        }
        set({ items });
      },
      update: (productId, patch) => set({ items: get().items.map((i) => (i.productId === productId ? { ...i, ...patch } : i)) }),
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [], notes: '' }),
      setNotes: (notes) => set({ notes }),
      get totalItems() { return get().items.reduce((s, i) => s + i.quantity, 0); },
      get subTotal() { return get().items.reduce((s, i) => s + i.price * i.quantity, 0); },
      get vatTotal() { return get().items.reduce((s, i) => s + (i.price * i.vatRate / 100) * i.quantity, 0); },
      get grandTotal() { return get().subTotal + get().vatTotal; },
    }),
    { name: 'portal-cart' },
  ),
);
