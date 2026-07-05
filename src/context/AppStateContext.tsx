'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  vendor: string;
  orgId: string;
  image: string;
  sku: string;
  stock: number;
  isPublished: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  vendor: string;
  orgId: string;
  date: string;
  total: number;
  status: 'Pending' | 'Paid' | 'Fulfilled' | 'Cancelled';
  items: string[];
}

export interface Vendor {
  id: string;
  name: string;
  plan: 'Free' | 'Pro';
  isActive: boolean;
  productCount: number;
  orderCount: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  utilized: number;
  status: 'Active' | 'Maintenance';
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Fulfilled';
}

interface AppState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  vendors: Vendor[];
  warehouses: Warehouse[];
  purchaseOrders: PurchaseOrder[];
  currentUser: { name: string; email: string } | null;
  currentRole: 'customer' | 'vendor' | 'admin';
  globalFee: number;
  freePlanCost: number;
  proPlanCost: number;
  platformStatus: boolean;
  globalBanner: string;
}

interface AppContextType {
  state: AppState;
  setRole: (role: 'customer' | 'vendor' | 'admin') => void;
  loginCustomer: (name: string, email: string) => void;
  logoutCustomer: () => void;
  addToCart: (product: Product, quantity: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  checkout: (address: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  toggleVendorStatus: (vendorId: string) => void;
  updateVendorPlan: (vendorId: string, plan: 'Free' | 'Pro') => void;
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;
  updatePlatformSettings: (settings: { globalFee: number; freePlanCost: number; proPlanCost: number; platformStatus: boolean; globalBanner: string }) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  clearCart: () => void;
}

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Mechanical Wireless Keyboard Pro',
    price: 129.99,
    description: 'High-performance mechanical keyboard with tactile switches, hot-swappable keys, and dual-mode wireless connectivity.',
    vendor: 'TechNova Electronics',
    orgId: 'vendor-1',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'SKU-KB-PRO',
    stock: 24,
    isPublished: true,
  },
  {
    id: 'prod-2',
    name: 'Studio Monitor Headphones ANC',
    price: 398.00,
    description: 'Professional reference headphones with hybrid active noise cancellation, studio-grade drivers, and memory foam earcups.',
    vendor: 'Lumina Audio',
    orgId: 'vendor-2',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'SKU-HP-ANC',
    stock: 15,
    isPublished: true,
  },
  {
    id: 'prod-3',
    name: 'Quantum Flow Sensor X-1',
    price: 89.50,
    description: 'Precision mechanical flow rate sensor designed for advanced automated operations and industrial logging.',
    vendor: 'TechNova Electronics',
    orgId: 'vendor-1',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'SKU-SEN-X1',
    stock: 2,
    isPublished: true,
  },
  {
    id: 'prod-4',
    name: 'Precision Optical Assembly',
    price: 1250.00,
    description: 'High-tolerance calibration lens assembly for industrial scanners and automated vision systems.',
    vendor: 'TechNova Electronics',
    orgId: 'vendor-1',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'SKU-OPT-ASM',
    stock: 1,
    isPublished: true,
  },
  {
    id: 'prod-5',
    name: 'Ergonomic Office Chair',
    price: 249.00,
    description: 'Task chair with high-back breathable mesh, dynamic lumbar support, and fully adjustable 3D armrests.',
    vendor: 'ComfortSeating',
    orgId: 'vendor-3',
    image: 'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'SKU-CH-ERG',
    stock: 12,
    isPublished: true,
  },
  {
    id: 'prod-6',
    name: 'Smart LED Desk Lamp',
    price: 49.99,
    description: 'Dimmable desk lamp featuring eye-care LED diffusion, built-in wireless charging pad, and scheduling automation.',
    vendor: 'Lumina Audio',
    orgId: 'vendor-2',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'SKU-LP-SMART',
    stock: 35,
    isPublished: true,
  }
];

const initialOrders: Order[] = [
  {
    id: 'KL-940382',
    customerName: 'Sarah Jenkins',
    vendor: 'TechNova Electronics',
    orgId: 'vendor-1',
    date: '2026-07-01',
    total: 129.99,
    status: 'Paid',
    items: ['Mechanical Wireless Keyboard Pro (1)']
  },
  {
    id: 'KL-940125',
    customerName: 'Michael Chen',
    vendor: 'Lumina Audio',
    orgId: 'vendor-2',
    date: '2026-06-28',
    total: 45.00,
    status: 'Fulfilled',
    items: ['Smart LED Desk Lamp (1)']
  },
  {
    id: 'KL-939882',
    customerName: 'Elena Rostova',
    vendor: 'TechNova Electronics',
    orgId: 'vendor-1',
    date: '2026-06-25',
    total: 850.00,
    status: 'Pending',
    items: ['Precision Optical Assembly (1)']
  }
];

const initialVendors: Vendor[] = [
  { id: 'vendor-1', name: 'TechNova Electronics', plan: 'Pro', isActive: true, productCount: 3, orderCount: 2 },
  { id: 'vendor-2', name: 'Lumina Audio', plan: 'Pro', isActive: true, productCount: 2, orderCount: 1 },
  { id: 'vendor-3', name: 'ComfortSeating', plan: 'Free', isActive: true, productCount: 1, orderCount: 0 }
];

const initialWarehouses: Warehouse[] = [
  { id: 'wh-1', name: 'Warehouse A', location: 'North Sector', capacity: 10000, utilized: 72, status: 'Active' },
  { id: 'wh-2', name: 'Warehouse B', location: 'South Sector', capacity: 5000, utilized: 45, status: 'Active' },
  { id: 'wh-3', name: 'Warehouse C', location: 'West Depot', capacity: 8000, utilized: 90, status: 'Active' }
];

const initialPurchaseOrders: PurchaseOrder[] = [
  { id: 'PO-2024-001', supplier: 'TechNova Inc', amount: 2450.00, date: '2026-07-02', status: 'Paid' },
  { id: 'PO-2024-002', supplier: 'Lumina Materials', amount: 1800.00, date: '2026-07-01', status: 'Pending' },
  { id: 'PO-2024-003', supplier: 'Apex Logistics', amount: 450.00, date: '2026-06-20', status: 'Fulfilled' }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    products: initialProducts,
    cart: [],
    orders: initialOrders,
    vendors: initialVendors,
    warehouses: initialWarehouses,
    purchaseOrders: initialPurchaseOrders,
    currentUser: { name: 'Jane Doe', email: 'jane.doe@example.com' }, // Pre-logged in customer as Jane Doe from Stitch Checkout
    currentRole: 'customer',
    globalFee: 2.5,
    freePlanCost: 0,
    proPlanCost: 49,
    platformStatus: true,
    globalBanner: 'Welcome to the Kinetic Ledger Marketplace Platform!'
  });

  const setRole = (role: 'customer' | 'vendor' | 'admin') => {
    setState((prev) => ({ ...prev, currentRole: role }));
  };

  const loginCustomer = (name: string, email: string) => {
    setState((prev) => ({ ...prev, currentUser: { name, email } }));
  };

  const logoutCustomer = () => {
    setState((prev) => ({ ...prev, currentUser: null, cart: [] }));
  };

  const addToCart = (product: Product, quantity: number) => {
    setState((prev) => {
      const existing = prev.cart.find((item) => item.product.id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prev.cart, { product, quantity }];
      }
      return { ...prev, cart: newCart };
    });
  };

  const updateCartQty = (productId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  };

  const removeFromCart = (productId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.product.id !== productId),
    }));
  };

  const checkout = (address: string) => {
    setState((prev) => {
      if (prev.cart.length === 0) return prev;

      // Group items by vendor
      const cartItemsByVendor: { [key: string]: CartItem[] } = {};
      prev.cart.forEach((item) => {
        const vendorId = item.product.orgId;
        if (!cartItemsByVendor[vendorId]) {
          cartItemsByVendor[vendorId] = [];
        }
        cartItemsByVendor[vendorId].push(item);
      });

      const newOrders: Order[] = Object.keys(cartItemsByVendor).map((vendorId, index) => {
        const items = cartItemsByVendor[vendorId];
        const vendorName = items[0].product.vendor;
        const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        return {
          id: `KL-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: prev.currentUser?.name || 'Guest User',
          vendor: vendorName,
          orgId: vendorId,
          date: new Date().toISOString().split('T')[0],
          total: Number(total.toFixed(2)),
          status: 'Paid' as const,
          items: items.map((item) => `${item.product.name} (${item.quantity})`),
        };
      });

      // Update product stock
      const updatedProducts = prev.products.map((prod) => {
        const cartItem = prev.cart.find((item) => item.product.id === prod.id);
        if (cartItem) {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
        }
        return prod;
      });

      return {
        ...prev,
        products: updatedProducts,
        orders: [...newOrders, ...prev.orders],
        cart: [],
      };
    });
  };

  const addProduct = (prod: Omit<Product, 'id'>) => {
    setState((prev) => {
      const newProd: Product = {
        ...prod,
        id: `prod-${prev.products.length + 1}`,
      };
      return {
        ...prev,
        products: [newProd, ...prev.products],
      };
    });
  };

  const toggleVendorStatus = (vendorId: string) => {
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) =>
        v.id === vendorId ? { ...v, isActive: !v.isActive } : v
      ),
    }));
  };

  const updateVendorPlan = (vendorId: string, plan: 'Free' | 'Pro') => {
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) =>
        v.id === vendorId ? { ...v, plan } : v
      ),
    }));
  };

  const addWarehouse = (wh: Omit<Warehouse, 'id'>) => {
    setState((prev) => {
      const newWh: Warehouse = {
        ...wh,
        id: `wh-${prev.warehouses.length + 1}`,
      };
      return {
        ...prev,
        warehouses: [...prev.warehouses, newWh],
      };
    });
  };

  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id'>) => {
    setState((prev) => {
      const newPo: PurchaseOrder = {
        ...po,
        id: `PO-2024-00${prev.purchaseOrders.length + 1}`,
      };
      return {
        ...prev,
        purchaseOrders: [newPo, ...prev.purchaseOrders],
      };
    });
  };

  const updatePlatformSettings = (settings: {
    globalFee: number;
    freePlanCost: number;
    proPlanCost: number;
    platformStatus: boolean;
    globalBanner: string;
  }) => {
    setState((prev) => ({
      ...prev,
      ...settings,
    }));
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
    }));
  };

  const clearCart = () => {
    setState((prev) => ({ ...prev, cart: [] }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setRole,
        loginCustomer,
        logoutCustomer,
        addToCart,
        updateCartQty,
        removeFromCart,
        checkout,
        addProduct,
        toggleVendorStatus,
        updateVendorPlan,
        addWarehouse,
        addPurchaseOrder,
        updatePlatformSettings,
        updateOrderStatus,
        clearCart
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
